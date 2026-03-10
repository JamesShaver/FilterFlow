import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { sendMessage } from '../lib/message';
import { t } from '../lib/i18n';
import { GHOST_LABEL_SCAN_DELAY_MS } from '@shared/constants';
import type { GmailLabel } from '@shared/types/gmail';

export function useGhostLabels() {
  const { state, dispatch } = useAppContext();
  const [ghostLabels, setGhostLabels] = useState<GmailLabel[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<{ completed: number; total: number; deleted: number; failed: number } | null>(null);

  // Compute label IDs referenced by any filter (client-side)
  const filterLabelIds = useMemo(() => {
    const ids = new Set<string>();
    for (const f of state.filters) {
      f.action.addLabelIds?.forEach((id) => ids.add(id));
      f.action.removeLabelIds?.forEach((id) => ids.add(id));
    }
    return ids;
  }, [state.filters]);

  // Compute candidate label IDs: user labels NOT referenced by any filter
  const candidateLabelIds = useMemo(
    () => state.labels.filter((l) => l.type === 'user' && !filterLabelIds.has(l.id)).map((l) => l.id),
    [state.labels, filterLabelIds],
  );

  const scanForGhostLabels = useCallback(async () => {
    if (candidateLabelIds.length === 0) {
      setGhostLabels([]);
      setHasScanned(true);
      return;
    }

    try {
      setIsScanning(true);
      const { labels } = await sendMessage<{ labels: GmailLabel[] }>({
        type: 'GET_LABEL_DETAILS',
        labelIds: candidateLabelIds,
      });

      const ghosts = labels.filter((l) => l.messagesTotal === 0);
      setGhostLabels(ghosts);
      setHasScanned(true);
    } catch (err) {
      console.warn('Ghost label scan failed:', err);
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastGhostScanFailed'), type: 'error' } });
    } finally {
      setIsScanning(false);
    }
  }, [candidateLabelIds, dispatch]);

  const deleteGhostLabels = useCallback(async (labelIds: string[]) => {
    if (labelIds.length === 0) return;

    try {
      setIsDeleting(true);
      setDeleteProgress({ completed: 0, total: labelIds.length, deleted: 0, failed: 0 });

      const { deleted, failed } = await sendMessage<{ deleted: string[]; failed: string[] }>({
        type: 'DELETE_LABELS',
        labelIds,
      });

      // Remove deleted labels from global state
      const deletedSet = new Set(deleted);
      const updatedLabels = state.labels.filter((l) => !deletedSet.has(l.id));
      dispatch({ type: 'SET_LABELS', payload: updatedLabels });

      // Remove deleted labels from ghost list
      setGhostLabels((prev) => prev.filter((l) => !deletedSet.has(l.id)));

      // Show result toast
      if (failed.length > 0) {
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: t('toastGhostDeletePartial', [String(deleted.length), String(failed.length)]), type: 'error' },
        });
      } else {
        dispatch({
          type: 'SHOW_TOAST',
          payload: { message: t('toastGhostDeleted', [String(deleted.length)]), type: 'success' },
        });
      }
    } catch (err) {
      dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastGhostDeleteFailed'), type: 'error' } });
    } finally {
      setIsDeleting(false);
      setDeleteProgress(null);
    }
  }, [state.labels, dispatch]);

  const dismissGhostLabels = useCallback(() => {
    setGhostLabels([]);
  }, []);

  // Listen for deletion progress broadcasts from background
  useEffect(() => {
    const listener = (message: { type: string; completed?: number; total?: number; deleted?: number; failed?: number }) => {
      if (message.type === 'GHOST_DELETE_PROGRESS') {
        setDeleteProgress({
          completed: message.completed ?? 0,
          total: message.total ?? 0,
          deleted: message.deleted ?? 0,
          failed: message.failed ?? 0,
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Deferred auto-scan: run 5 seconds after labels and filters are loaded
  useEffect(() => {
    if (hasScanned || candidateLabelIds.length === 0 || state.labels.length === 0 || state.filters.length === 0) return;
    const timer = setTimeout(() => scanForGhostLabels(), GHOST_LABEL_SCAN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hasScanned, candidateLabelIds, state.labels.length, state.filters.length, scanForGhostLabels]);

  return {
    ghostLabels,
    isScanning,
    hasScanned,
    isDeleting,
    deleteProgress,
    scanForGhostLabels,
    deleteGhostLabels,
    dismissGhostLabels,
  };
}
