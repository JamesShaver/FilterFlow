import type { BackgroundMessage, MessageResponse } from '@shared/types/messages';

export function sendMessage<T = unknown>(message: BackgroundMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime?.sendMessage) {
      reject(new Error('Extension context invalidated. Please reload the extension.'));
      return;
    }
    chrome.runtime.sendMessage(message, (response: MessageResponse<T>) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (!response) {
        reject(new Error('No response from background'));
        return;
      }
      if (!response.success) {
        reject(new Error(response.error));
        return;
      }
      resolve(response.data);
    });
  });
}
