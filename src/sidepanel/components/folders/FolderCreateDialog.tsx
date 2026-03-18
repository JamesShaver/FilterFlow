import React, { useState, useEffect } from 'react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { useFolders } from '../../hooks/useFolders';
import type { VirtualFolder } from '@shared/types/storage';
import { t } from '../../lib/i18n';

interface FolderDialogProps {
  open: boolean;
  onClose: () => void;
  folder?: VirtualFolder | null;
}

export const FOLDER_ICONS = [
  'folder', 'inbox', 'tag', 'star', 'briefcase', 'bookmark',
  'archive', 'bell', 'heart', 'flag', 'code', 'envelope',
  'building', 'graduation-cap', 'music', 'cart-shopping',
];

export const FOLDER_COLORS = [
  '#6366f1', // indigo
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ef4444', // red
  '#06b6d4', // cyan
];

export function FolderDialog({ open, onClose, folder }: FolderDialogProps) {
  const { createFolder, updateFolder, deleteFolder, folders } = useFolders();
  const [name, setName] = useState('');
  const [color, setColor] = useState(FOLDER_COLORS[0]);
  const [icon, setIcon] = useState(FOLDER_ICONS[0]);

  const isEdit = !!folder;
  // Use live folder data from state so filterIds is never stale
  const liveFolder = folder ? folders.find((f) => f.id === folder.id) : null;
  const filterCount = liveFolder?.filterIds.length ?? 0;

  useEffect(() => {
    if (open) {
      if (folder) {
        setName(folder.name);
        setColor(folder.color || FOLDER_COLORS[0]);
        setIcon(folder.icon || FOLDER_ICONS[0]);
      } else {
        setName('');
        setColor(FOLDER_COLORS[0]);
        setIcon(FOLDER_ICONS[0]);
      }
    }
  }, [open, folder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    if (isEdit) {
      await updateFolder(folder.id, { name: name.trim(), color, icon });
    } else {
      await createFolder(name.trim(), color, icon);
    }
    onClose();
  };

  const handleDelete = async () => {
    if (!folder || filterCount > 0) return;
    await deleteFolder(folder.id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? t('editFolderTitle') : t('createFolderTitle')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('folderName')}</label>
          <input
            type="text"
            className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={t('placeholderFolderName')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('folderColor')}</label>
          <div className="flex gap-2">
            {FOLDER_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 dark:ring-offset-slate-800 ring-indigo-500 scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">{t('folderIcon')}</label>
          <div className="grid grid-cols-8 gap-1.5">
            {FOLDER_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                  icon === ic
                    ? 'ring-2 ring-offset-1 dark:ring-offset-slate-800 ring-indigo-500 bg-slate-100 dark:bg-slate-700'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                onClick={() => setIcon(ic)}
              >
                <i className={`fa-solid fa-${ic} text-sm`} style={{ color }} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          {isEdit && (
            <button
              type="button"
              className={`text-xs px-2 py-1 rounded transition-colors ${
                filterCount > 0
                  ? 'text-slate-400 dark:text-slate-500 cursor-not-allowed'
                  : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
              disabled={filterCount > 0}
              onClick={handleDelete}
              title={filterCount > 0 ? t('removeFolderFiltersFirst') : t('deleteFolderTitle')}
            >
              {t('delete')}
            </button>
          )}
          <div className="flex-1" />
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={!name.trim()}>
            {isEdit ? t('saveChanges') : t('create')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
