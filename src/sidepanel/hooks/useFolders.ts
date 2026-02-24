import { useCallback, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getFolders, saveFolders } from '../lib/storage';
import type { VirtualFolder } from '@shared/types/storage';
import { t } from '../lib/i18n';

export function useFolders() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    getFolders().then((folders) => {
      dispatch({ type: 'SET_FOLDERS', payload: folders });
    });
  }, [dispatch]);

  const createFolder = useCallback(async (name: string, color?: string, icon?: string) => {
    const newFolder: VirtualFolder = {
      id: crypto.randomUUID(),
      name,
      filterIds: [],
      collapsed: false,
      color,
      icon,
    };
    const updated = [...state.folders, newFolder];
    dispatch({ type: 'SET_FOLDERS', payload: updated });
    await saveFolders(updated);
    dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastFolderCreated', [name]), type: 'success' } });
    return newFolder;
  }, [state.folders, dispatch]);

  const updateFolder = useCallback(async (id: string, updates: Partial<VirtualFolder>) => {
    const updated = state.folders.map((f) =>
      f.id === id ? { ...f, ...updates } : f
    );
    dispatch({ type: 'SET_FOLDERS', payload: updated });
    await saveFolders(updated);
  }, [state.folders, dispatch]);

  const deleteFolder = useCallback(async (id: string) => {
    const updated = state.folders.filter((f) => f.id !== id);
    dispatch({ type: 'SET_FOLDERS', payload: updated });
    await saveFolders(updated);
    dispatch({ type: 'SHOW_TOAST', payload: { message: t('toastFolderDeleted'), type: 'info' } });
  }, [state.folders, dispatch]);

  const addFilterToFolder = useCallback(async (folderId: string, filterId: string) => {
    // Remove from any existing folder first
    const updated = state.folders.map((f) => ({
      ...f,
      filterIds: f.id === folderId
        ? [...f.filterIds.filter((id) => id !== filterId), filterId]
        : f.filterIds.filter((id) => id !== filterId),
    }));
    dispatch({ type: 'SET_FOLDERS', payload: updated });
    await saveFolders(updated);
  }, [state.folders, dispatch]);

  const removeFilterFromFolder = useCallback(async (folderId: string, filterId: string) => {
    const updated = state.folders.map((f) =>
      f.id === folderId
        ? { ...f, filterIds: f.filterIds.filter((id) => id !== filterId) }
        : f
    );
    dispatch({ type: 'SET_FOLDERS', payload: updated });
    await saveFolders(updated);
  }, [state.folders, dispatch]);

  const removeFilterFromAllFolders = useCallback(async (filterId: string) => {
    const updated = state.folders.map((f) => ({
      ...f,
      filterIds: f.filterIds.filter((id) => id !== filterId),
    }));
    dispatch({ type: 'SET_FOLDERS', payload: updated });
    await saveFolders(updated);
  }, [state.folders, dispatch]);

  const toggleFolderCollapse = useCallback(async (id: string) => {
    const folder = state.folders.find((f) => f.id === id);
    if (folder) {
      await updateFolder(id, { collapsed: !folder.collapsed });
    }
  }, [state.folders, updateFolder]);

  return {
    folders: state.folders,
    createFolder,
    updateFolder,
    deleteFolder,
    addFilterToFolder,
    removeFilterFromFolder,
    removeFilterFromAllFolders,
    toggleFolderCollapse,
  };
}
