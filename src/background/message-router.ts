import type { BackgroundMessage, MessageResponse } from '@shared/types/messages';
import { getAuthToken, signOut } from './auth';
import { listFilters, createFilter, deleteFilter, searchMessages, listLabels, createLabel } from './gmail-api';

// Store latest email context from content script
let currentEmailContext: { sender: string; subject: string } | null = null;

export function getCurrentEmailContext() {
  return currentEmailContext;
}

export function handleMessage(
  message: BackgroundMessage,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response: MessageResponse) => void
): boolean {
  console.log('[FilterFlow] Message received:', message.type);
  handleAsync(message).then((response) => {
    console.log('[FilterFlow] Response for', message.type, ':', response.success);
    sendResponse(response);
  }).catch((err) => {
    console.error('[FilterFlow] Error handling', message.type, ':', err);
    sendResponse({ success: false, error: err.message || chrome.i18n.getMessage('errorUnknown') });
  });
  return true; // Keep the message channel open for async response
}

async function handleAsync(message: BackgroundMessage): Promise<MessageResponse> {
  switch (message.type) {
    case 'GET_AUTH_TOKEN': {
      const token = await getAuthToken(message.interactive ?? true);
      return { success: true, data: { token } };
    }

    case 'SIGN_OUT': {
      await signOut();
      return { success: true, data: undefined };
    }

    case 'GET_FILTERS': {
      const filters = await listFilters();
      return { success: true, data: { filters } };
    }

    case 'CREATE_FILTER': {
      const filter = await createFilter(message.criteria, message.action);
      return { success: true, data: { filter } };
    }

    case 'DELETE_FILTER': {
      await deleteFilter(message.filterId);
      return { success: true, data: undefined };
    }

    case 'REORDER_FILTERS': {
      // Get all current filters
      const allFilters = await listFilters();
      const filterMap = new Map(allFilters.map((f) => [f.id, f]));

      // Collect filters to reorder (skip any IDs not found)
      const filtersToReorder = message.filterIds
        .map((id) => filterMap.get(id))
        .filter((f): f is NonNullable<typeof f> => f != null);

      if (filtersToReorder.length === 0) {
        const updatedFilters = await listFilters();
        return { success: true, data: { filters: updatedFilters } };
      }

      // Delete all filters in parallel first, then recreate in desired order.
      // Batch with concurrency limit to avoid Gmail rate limits.
      const BATCH_SIZE = 5;
      const totalSteps = filtersToReorder.length * 2; // delete + create per filter
      let completedSteps = 0;

      const broadcastProgress = (phase: string) => {
        chrome.runtime.sendMessage({
          type: 'REORDER_PROGRESS',
          completed: completedSteps,
          total: totalSteps,
          phase,
        }).catch(() => {});
      };

      broadcastProgress(chrome.i18n.getMessage('progressDeleting'));

      const deleteIds = filtersToReorder.map((f) => f.id);
      for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
        const batch = deleteIds.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map((id) => deleteFilter(id).then(() => {
          completedSteps++;
          broadcastProgress(chrome.i18n.getMessage('progressDeleting'));
        })));
      }

      // Recreate in the desired order, also batched
      broadcastProgress(chrome.i18n.getMessage('progressRecreating'));
      for (let i = 0; i < filtersToReorder.length; i += BATCH_SIZE) {
        const batch = filtersToReorder.slice(i, i + BATCH_SIZE);
        await Promise.all(
          batch.map((f) => createFilter(f.criteria, f.action).then(() => {
            completedSteps++;
            broadcastProgress(chrome.i18n.getMessage('progressRecreating'));
          }))
        );
      }

      const updatedFilters = await listFilters();
      return { success: true, data: { filters: updatedFilters } };
    }

    case 'DRY_RUN': {
      const messages = await searchMessages(message.query);
      return { success: true, data: { messages } };
    }

    case 'GET_LABELS': {
      const labels = await listLabels();
      return { success: true, data: { labels } };
    }

    case 'CREATE_LABEL': {
      const label = await createLabel(message.name);
      return { success: true, data: { label } };
    }

    case 'EMAIL_CONTEXT': {
      currentEmailContext = { sender: message.sender, subject: message.subject };
      // Broadcast to side panel
      chrome.runtime.sendMessage({
        type: 'EMAIL_CONTEXT_UPDATE',
        sender: message.sender,
        subject: message.subject,
      }).catch(() => {}); // Ignore if no listener
      return { success: true, data: undefined };
    }

    default:
      return { success: false, error: chrome.i18n.getMessage('errorUnknownMessageType') };
  }
}
