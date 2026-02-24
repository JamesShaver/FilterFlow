import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/message';

export function useEmailContext() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    // Fetch current email context from background on mount
    // (handles case where side panel opens after user already has an email open)
    sendMessage<{ emailContext: { sender: string; subject: string } | null }>({
      type: 'GET_EMAIL_CONTEXT',
    }).then((data) => {
      if (data?.emailContext) {
        dispatch({
          type: 'SET_EMAIL_CONTEXT',
          payload: data.emailContext,
        });
      }
    }).catch(() => {}); // Best-effort

    // Listen for live updates from content script via background
    const listener = (message: any) => {
      if (message.type === 'EMAIL_CONTEXT_UPDATE') {
        dispatch({
          type: 'SET_EMAIL_CONTEXT',
          payload: { sender: message.sender, subject: message.subject },
        });
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [dispatch]);

  const clearContext = () => {
    dispatch({ type: 'SET_EMAIL_CONTEXT', payload: null });
  };

  return {
    emailContext: state.emailContext,
    clearContext,
  };
}
