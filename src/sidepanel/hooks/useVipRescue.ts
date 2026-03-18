import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/message';
import { t } from '../lib/i18n';
import type { VipContact } from '@shared/types/storage';

interface RescueResult {
  messagesRescued: number;
  filtersAdjusted: number;
  alreadyVip: boolean;
}

export function useVipRescue() {
  const { state, dispatch } = useAppContext();

  const fetchVipContacts = useCallback(async () => {
    try {
      const { contacts } = await sendMessage<{ contacts: VipContact[] }>({ type: 'GET_VIP_CONTACTS' });
      dispatch({ type: 'SET_VIP_CONTACTS', payload: contacts });
    } catch (err) {
      console.warn('Failed to fetch VIP contacts:', err);
    }
  }, [dispatch]);

  const rescueSender = useCallback(async (email: string) => {
    try {
      const result = await sendMessage<RescueResult>({ type: 'VIP_RESCUE', email });
      if (result.alreadyVip) {
        dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastVipAlreadyProtected'), type: 'info' } });
        return;
      }
      // Refresh VIP list
      const { contacts } = await sendMessage<{ contacts: VipContact[] }>({ type: 'GET_VIP_CONTACTS' });
      dispatch({ type: 'SET_VIP_CONTACTS', payload: contacts });
      dispatch({
        type: 'SHOW_TOAST',
        payload: {
          message: t('toastVipRescued', [email, String(result.messagesRescued), String(result.filtersAdjusted)]),
          type: 'success',
        },
      });
    } catch (err) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: (err as Error).message, type: 'error' } });
    }
  }, [dispatch]);

  const removeVip = useCallback(async (email: string) => {
    try {
      await sendMessage({ type: 'REMOVE_VIP', email });
      dispatch({
        type: 'SET_VIP_CONTACTS',
        payload: state.vipContacts.filter((c) => c.email.toLowerCase() !== email.toLowerCase()),
      });
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastVipRemoved'), type: 'info' } });
    } catch (err) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: (err as Error).message, type: 'error' } });
    }
  }, [dispatch, state.vipContacts]);

  const isVip = useCallback((email: string): boolean => {
    return state.vipContacts.some((c) => c.email.toLowerCase() === email.toLowerCase());
  }, [state.vipContacts]);

  const getVipStatus = useCallback((email: string): VipContact | undefined => {
    return state.vipContacts.find((c) => c.email.toLowerCase() === email.toLowerCase());
  }, [state.vipContacts]);

  return {
    vipContacts: state.vipContacts,
    fetchVipContacts,
    rescueSender,
    removeVip,
    isVip,
    getVipStatus,
  };
}
