import React from 'react';
import type { GmailFilter } from '@shared/types/gmail';
import type { VirtualFolder } from '@shared/types/storage';
import { useFolders } from '../../hooks/useFolders';
import { useAppContext } from '../../context/AppContext';
import { FolderItem } from './FolderItem';
import { Button } from '../common/Button';
import { t } from '../../lib/i18n';

interface FolderListProps {
  filters: GmailFilter[];
  onDeleteFilter: (id: string) => void;
  onEditFilter: (filter: GmailFilter) => void;
  onCreateFolder: () => void;
  onEditFolder: (folder: VirtualFolder) => void;
}

export function FolderList({ filters, onDeleteFilter, onEditFilter, onCreateFolder, onEditFolder }: FolderListProps) {
  const { folders } = useFolders();
  const { state } = useAppContext();

  if (folders.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t('foldersHeading')}</h3>
        <Button variant="ghost" size="sm" onClick={onCreateFolder}>
          <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {t('addFolder')}
        </Button>
      </div>

      <div className="space-y-2">
        {folders.map((folder) => (
          <FolderItem
            key={folder.id}
            folder={folder}
            filters={filters}
            labels={state.labels}
            temporalFilters={state.temporalFilters}
            onDeleteFilter={onDeleteFilter}
            onEditFilter={onEditFilter}
            onEditFolder={onEditFolder}
          />
        ))}
      </div>
    </div>
  );
}
