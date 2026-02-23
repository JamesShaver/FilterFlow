import { useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/message';
import { saveFilterOrder, getFilterOrder, saveFolders, getFolders } from '../lib/storage';
import type { GmailFilter, GmailFilterCriteria, GmailFilterAction } from '@shared/types/gmail';
import { t } from '../lib/i18n';

export function useFilters() {
  const { state, dispatch } = useAppContext();

  const fetchFilters = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { filters } = await sendMessage<{ filters: GmailFilter[] }>({ type: 'GET_FILTERS' });

      // Apply saved order
      const savedOrder = await getFilterOrder();
      if (savedOrder.length > 0) {
        const filterMap = new Map(filters.map((f) => [f.id, f]));
        const ordered: GmailFilter[] = [];

        // Add filters in saved order first
        for (const id of savedOrder) {
          const filter = filterMap.get(id);
          if (filter) {
            ordered.push(filter);
            filterMap.delete(id);
          }
        }
        // Append any new filters not in saved order
        for (const filter of filterMap.values()) {
          ordered.push(filter);
        }

        dispatch({ type: 'SET_FILTERS', payload: ordered });
        dispatch({ type: 'SET_FILTER_ORDER', payload: ordered.map((f) => f.id) });
      } else {
        dispatch({ type: 'SET_FILTERS', payload: filters });
        dispatch({ type: 'SET_FILTER_ORDER', payload: filters.map((f) => f.id) });
      }

      // Clean up ghost filterIds in folders — strip IDs that no longer exist in Gmail
      const validIds = new Set(filters.map((f) => f.id));
      const folders = await getFolders();
      const needsCleanup = folders.some((f) => f.filterIds.some((id) => !validIds.has(id)));
      if (needsCleanup) {
        const cleaned = folders.map((f) => ({
          ...f,
          filterIds: f.filterIds.filter((id) => validIds.has(id)),
        }));
        dispatch({ type: 'SET_FOLDERS', payload: cleaned });
        await saveFolders(cleaned);
      }
    } catch (err) {
      dispatch({ type: 'SET_ERROR', payload: (err as Error).message });
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastLoadFiltersFailed'), type: 'error' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const createFilter = useCallback(async (criteria: GmailFilterCriteria, action: GmailFilterAction) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { filter } = await sendMessage<{ filter: GmailFilter }>({
        type: 'CREATE_FILTER',
        criteria,
        action,
      });
      dispatch({ type: 'ADD_FILTER', payload: filter });
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastFilterCreated'), type: 'success' } });
      return filter;
    } catch (err) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastCreateFilterFailed'), type: 'error' } });
      throw err;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch]);

  const deleteFilter = useCallback(async (filterId: string) => {
    try {
      await sendMessage({ type: 'DELETE_FILTER', filterId });
      dispatch({ type: 'REMOVE_FILTER', payload: filterId });
      // Persist folder cleanup (reducer strips the ID from in-memory folders)
      const cleanedFolders = state.folders.map((f) => ({
        ...f,
        filterIds: f.filterIds.filter((id) => id !== filterId),
      }));
      await saveFolders(cleanedFolders);
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastFilterDeleted'), type: 'success' } });
    } catch (err) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastDeleteFilterFailed'), type: 'error' } });
      throw err;
    }
  }, [dispatch, state.folders]);

  const updateFilterOrder = useCallback(async (newOrder: string[]) => {
    dispatch({ type: 'SET_FILTER_ORDER', payload: newOrder });

    // Reorder the filters array to match
    const filterMap = new Map(state.filters.map((f) => [f.id, f]));
    const reordered = newOrder.map((id) => filterMap.get(id)!).filter(Boolean);
    dispatch({ type: 'SET_FILTERS', payload: reordered });

    await saveFilterOrder(newOrder);
  }, [dispatch, state.filters]);

  const saveOrderToGmail = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const { filters } = await sendMessage<{ filters: GmailFilter[] }>({
        type: 'REORDER_FILTERS',
        filterIds: state.filterOrder,
      });
      dispatch({ type: 'SET_FILTERS', payload: filters });
      dispatch({ type: 'SET_FILTER_ORDER', payload: filters.map((f) => f.id) });
      await saveFilterOrder(filters.map((f) => f.id));
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastOrderSaved'), type: 'success' } });
    } catch (err) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastSaveOrderFailed'), type: 'error' } });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [dispatch, state.filterOrder]);

  const fetchLabels = useCallback(async () => {
    try {
      const { labels } = await sendMessage<{ labels: Array<{ id: string; name: string; type: string }> }>({ type: 'GET_LABELS' });
      dispatch({ type: 'SET_LABELS', payload: labels as any });
    } catch (err) {
      console.warn('Failed to fetch labels:', err);
    }
  }, [dispatch]);

  return {
    filters: state.filters,
    labels: state.labels,
    filterOrder: state.filterOrder,
    isLoading: state.isLoading,
    fetchFilters,
    createFilter,
    deleteFilter,
    updateFilterOrder,
    saveOrderToGmail,
    fetchLabels,
  };
}
