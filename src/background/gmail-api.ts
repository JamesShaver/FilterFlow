import { GMAIL_API_BASE, DRY_RUN_MAX_RESULTS } from '@shared/constants';
import type { GmailFilter, GmailFilterCriteria, GmailFilterAction, GmailMessage, GmailLabel } from '@shared/types/gmail';
import { getAuthTokenWithRetry } from './auth';

// System label IDs used to represent boolean action flags in the Gmail API
const SYSTEM_LABEL = {
  INBOX: 'INBOX',
  UNREAD: 'UNREAD',
  STARRED: 'STARRED',
  TRASH: 'TRASH',
  IMPORTANT: 'IMPORTANT',
  SPAM: 'SPAM',
} as const;

/**
 * Convert app-friendly boolean action flags to Gmail API label operations.
 * The Gmail API filter action only supports: addLabelIds, removeLabelIds, forward.
 */
function actionToApi(action: GmailFilterAction): { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string } {
  const addLabelIds: string[] = [...(action.addLabelIds || [])];
  const removeLabelIds: string[] = [...(action.removeLabelIds || [])];

  if (action.archive) removeLabelIds.push(SYSTEM_LABEL.INBOX);
  if (action.markRead) removeLabelIds.push(SYSTEM_LABEL.UNREAD);
  if (action.star) addLabelIds.push(SYSTEM_LABEL.STARRED);
  if (action.trash) addLabelIds.push(SYSTEM_LABEL.TRASH);
  if (action.markImportant) addLabelIds.push(SYSTEM_LABEL.IMPORTANT);
  if (action.neverSpam) removeLabelIds.push(SYSTEM_LABEL.SPAM);

  const apiAction: { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string } = {};
  if (addLabelIds.length > 0) apiAction.addLabelIds = addLabelIds;
  if (removeLabelIds.length > 0) apiAction.removeLabelIds = removeLabelIds;
  if (action.forward) apiAction.forward = action.forward;

  return apiAction;
}

/**
 * Convert Gmail API label operations back to app-friendly boolean flags.
 */
function actionFromApi(apiAction: { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string }): GmailFilterAction {
  const add = new Set(apiAction.addLabelIds || []);
  const remove = new Set(apiAction.removeLabelIds || []);

  const action: GmailFilterAction = {};

  if (remove.has(SYSTEM_LABEL.INBOX)) { action.archive = true; remove.delete(SYSTEM_LABEL.INBOX); }
  if (remove.has(SYSTEM_LABEL.UNREAD)) { action.markRead = true; remove.delete(SYSTEM_LABEL.UNREAD); }
  if (add.has(SYSTEM_LABEL.STARRED)) { action.star = true; add.delete(SYSTEM_LABEL.STARRED); }
  if (add.has(SYSTEM_LABEL.TRASH)) { action.trash = true; add.delete(SYSTEM_LABEL.TRASH); }
  if (add.has(SYSTEM_LABEL.IMPORTANT)) { action.markImportant = true; add.delete(SYSTEM_LABEL.IMPORTANT); }
  if (remove.has(SYSTEM_LABEL.SPAM)) { action.neverSpam = true; remove.delete(SYSTEM_LABEL.SPAM); }

  if (apiAction.forward) action.forward = apiAction.forward;

  // Remaining labels are user labels
  const remainingAdd = [...add];
  const remainingRemove = [...remove];
  if (remainingAdd.length > 0) action.addLabelIds = remainingAdd;
  if (remainingRemove.length > 0) action.removeLabelIds = remainingRemove;

  return action;
}

async function gmailFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getAuthTokenWithRetry();
  const response = await fetch(`${GMAIL_API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || chrome.i18n.getMessage('errorGmailApi', [String(response.status)]));
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function listFilters(): Promise<GmailFilter[]> {
  const data = await gmailFetch<{ filter?: Array<{ id: string; criteria: GmailFilterCriteria; action: { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string } }> }>('/settings/filters');
  return (data.filter || []).map((f) => ({
    id: f.id,
    criteria: f.criteria,
    action: actionFromApi(f.action),
  }));
}

export async function createFilter(
  criteria: GmailFilterCriteria,
  action: GmailFilterAction
): Promise<GmailFilter> {
  const apiAction = actionToApi(action);

  // Gmail API rejects filters with no actions — guard early with a clear message
  if (!apiAction.addLabelIds && !apiAction.removeLabelIds && !apiAction.forward) {
    throw new Error(chrome.i18n.getMessage('errorNoActions') || 'Please select at least one action for the filter.');
  }

  const raw = await gmailFetch<{ id: string; criteria: GmailFilterCriteria; action: { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string } }>('/settings/filters', {
    method: 'POST',
    body: JSON.stringify({ criteria, action: apiAction }),
  });
  return { id: raw.id, criteria: raw.criteria, action: actionFromApi(raw.action) };
}

export async function deleteFilter(filterId: string): Promise<void> {
  await gmailFetch<void>(`/settings/filters/${filterId}`, {
    method: 'DELETE',
  });
}

export async function getFilter(filterId: string): Promise<GmailFilter> {
  const raw = await gmailFetch<{ id: string; criteria: GmailFilterCriteria; action: { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string } }>(`/settings/filters/${filterId}`);
  return { id: raw.id, criteria: raw.criteria, action: actionFromApi(raw.action) };
}

export async function listLabels(): Promise<GmailLabel[]> {
  const data = await gmailFetch<{ labels: GmailLabel[] }>('/labels');
  return data.labels || [];
}

export async function createLabel(name: string): Promise<GmailLabel> {
  const label = await gmailFetch<GmailLabel>('/labels', {
    method: 'POST',
    body: JSON.stringify({
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    }),
  });
  return { id: label.id, name: label.name, type: 'user' };
}

export async function searchMessages(query: string): Promise<GmailMessage[]> {
  const listData = await gmailFetch<{ messages?: Array<{ id: string }> }>(
    `/messages?q=${encodeURIComponent(query)}&maxResults=${DRY_RUN_MAX_RESULTS}`
  );

  if (!listData.messages?.length) return [];

  const messages = await Promise.all(
    listData.messages.map((m) =>
      gmailFetch<GmailMessage>(`/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`)
    )
  );

  return messages;
}
