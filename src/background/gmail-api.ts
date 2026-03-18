import { GMAIL_API_BASE, DRY_RUN_MAX_RESULTS, GMAIL_BATCH_LIMIT } from '@shared/constants';
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
export function actionToApi(action: GmailFilterAction): { addLabelIds?: string[]; removeLabelIds?: string[]; forward?: string } {
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

/**
 * Search for message IDs matching a query (lightweight — no metadata fetch).
 * Paginates through all results to collect every matching ID.
 */
export async function searchMessageIds(query: string): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  do {
    const url = `/messages?q=${encodeURIComponent(query)}&maxResults=500${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const data = await gmailFetch<{ messages?: Array<{ id: string }>; nextPageToken?: string }>(url);
    if (data.messages) {
      ids.push(...data.messages.map((m) => m.id));
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return ids;
}

/**
 * Batch-modify messages to apply label operations.
 * Gmail limits batchModify to 1000 message IDs per call.
 */
export async function batchModifyMessages(
  messageIds: string[],
  addLabelIds?: string[],
  removeLabelIds?: string[],
): Promise<number> {
  if (messageIds.length === 0) return 0;

  const BATCH_LIMIT = 1000;
  for (let i = 0; i < messageIds.length; i += BATCH_LIMIT) {
    const batch = messageIds.slice(i, i + BATCH_LIMIT);
    await gmailFetch<void>('/messages/batchModify', {
      method: 'POST',
      body: JSON.stringify({
        ids: batch,
        ...(addLabelIds?.length ? { addLabelIds } : {}),
        ...(removeLabelIds?.length ? { removeLabelIds } : {}),
      }),
    });
  }

  return messageIds.length;
}

/**
 * Fetch full details (including messagesTotal) for multiple labels using
 * the Gmail batch API. Sends up to 100 sub-requests per HTTP call.
 */
export async function batchGetLabelDetails(labelIds: string[]): Promise<GmailLabel[]> {
  if (labelIds.length === 0) return [];

  const results: GmailLabel[] = [];

  for (let i = 0; i < labelIds.length; i += GMAIL_BATCH_LIMIT) {
    const batch = labelIds.slice(i, i + GMAIL_BATCH_LIMIT);
    const batchResults = await executeBatchLabelGet(batch);
    results.push(...batchResults);
  }

  return results;
}

async function executeBatchLabelGet(labelIds: string[]): Promise<GmailLabel[]> {
  const token = await getAuthTokenWithRetry();
  const boundary = `batch_filterflow_${Date.now()}`;

  const body = labelIds.map((id, idx) =>
    `--${boundary}\r\nContent-Type: application/http\r\nContent-ID: <item${idx}>\r\n\r\nGET /gmail/v1/users/me/labels/${encodeURIComponent(id)}\r\n`
  ).join('');

  const fullBody = `${body}--${boundary}--`;

  const response = await fetch('https://www.googleapis.com/batch/gmail/v1', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/mixed; boundary=${boundary}`,
    },
    body: fullBody,
  });

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
    await delay(retryAfter * 1000);
    return executeBatchLabelGet(labelIds);
  }

  if (!response.ok) {
    throw new Error(chrome.i18n.getMessage('errorGmailApi', [String(response.status)]));
  }

  const text = await response.text();
  return parseBatchResponse(text);
}

function parseBatchResponse(responseText: string): GmailLabel[] {
  const labels: GmailLabel[] = [];

  // Split by boundary — each part has HTTP status line + headers + JSON body
  const parts = responseText.split(/--batch_\S+/);
  for (const part of parts) {
    const jsonMatch = part.match(/\{[\s\S]*\}/);
    if (!jsonMatch) continue;

    try {
      const data = JSON.parse(jsonMatch[0]);
      // Skip error responses (e.g., label not found)
      if (data.id && data.name) {
        labels.push({
          id: data.id,
          name: data.name,
          type: data.type?.toLowerCase() === 'system' ? 'system' : 'user',
          messagesTotal: data.messagesTotal ?? 0,
          threadsTotal: data.threadsTotal ?? 0,
        });
      }
    } catch {
      // Skip unparseable parts
    }
  }

  return labels;
}

/**
 * Delete a single label. Returns true on success, false on 404 (already gone).
 * Throws on other errors. Retries on 429.
 */
export async function deleteLabel(labelId: string): Promise<boolean> {
  const token = await getAuthTokenWithRetry();
  const response = await fetch(`${GMAIL_API_BASE}/labels/${encodeURIComponent(labelId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.status === 204 || response.ok) return true;
  if (response.status === 404) return false;

  if (response.status === 429) {
    const retryAfter = parseInt(response.headers.get('Retry-After') || '5', 10);
    await delay(retryAfter * 1000);
    return deleteLabel(labelId);
  }

  const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
  throw new Error(error.error?.message || chrome.i18n.getMessage('errorGmailApi', [String(response.status)]));
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
