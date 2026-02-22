import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

export function useEmailContext() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
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
