import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/message';
import { t } from '../lib/i18n';

export function useAuth() {
  const { state, dispatch } = useAppContext();

  // Check for existing auth on mount
  useEffect(() => {
    sendMessage<{ token: string }>({ type: 'GET_AUTH_TOKEN', interactive: false })
      .then(() => dispatch({ type: 'SET_AUTHENTICATED', payload: true }))
      .catch(() => dispatch({ type: 'SET_AUTHENTICATED', payload: false }));
  }, [dispatch]);

  const signIn = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await sendMessage({ type: 'GET_AUTH_TOKEN', interactive: true });
      dispatch({ type: 'SET_AUTHENTICATED', payload: true });
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastSignInSuccess'), type: 'success' } });
    } catch (err) {
      const errorMsg = (err as Error).message || 'Unknown error';
      console.error('Sign in failed:', errorMsg);
      dispatch({ type: 'SET_ERROR', payload: errorMsg });
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastSignInFailed', [errorMsg]), type: 'error' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const signOut = useCallback(async () => {
    try {
      await sendMessage({ type: 'SIGN_OUT' });
      dispatch({ type: 'SET_AUTHENTICATED', payload: false });
      dispatch({ type: 'SET_FILTERS', payload: [] });
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastSignedOut'), type: 'info' } });
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
    }
  }, [dispatch]);

  return {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    signIn,
    signOut,
  };
}
