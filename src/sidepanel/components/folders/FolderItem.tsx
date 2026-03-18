import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import type { VirtualFolder, VipContact } from '@shared/types/storage';
import type { GmailFilter, GmailLabel } from '@shared/types/gmail';
import { useFolders } from '../../hooks/useFolders';
import { FilterCard } from '../filters/FilterCard';
import { Badge } from '../common/Badge';
import { t } from '../../lib/i18n';

interface FolderItemProps {
  folder: VirtualFolder;
  filters: GmailFilter[];
  labels?: GmailLabel[];
  temporalFilters: Array<{ filterId: string; expiresAt: number; createdAt: number }>;
  vipContacts?: VipContact[];
  onDeleteFilter: (id: string) => void;
  onEditFilter: (filter: GmailFilter) => void;
  onEditFolder: (folder: VirtualFolder) => void;
}

export function FolderItem({ folder, filters, labels, temporalFilters, vipContacts, onDeleteFilter, onEditFilter, onEditFolder }: FolderItemProps) {
  const { toggleFolderCollapse } = useFolders();

  const { setNodeRef, isOver } = useDroppable({ id: `folder-${folder.id}` });

  const folderFilters = filters.filter((f) => folder.filterIds.includes(f.id));

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border transition-colors ${
        isOver ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {/* Folder header */}
      <div className="group flex items-center gap-2 px-3 py-2 cursor-pointer" onClick={() => toggleFolderCollapse(folder.id)}>
        <motion.svg
          className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: folder.collapsed ? 0 : 90 }}
          transition={{ duration: 0.15 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </motion.svg>

        <i
          className={`fa-solid fa-${folder.icon || 'folder'} text-sm`}
          style={{ color: folder.color }}
        />

        <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">{folder.name}</span>

        <Badge>{folderFilters.length}</Badge>

        <button
          className="p-0.5 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onEditFolder(folder);
          }}
          title={t('editFolderButton')}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      </div>

      {/* Folder contents */}
      <AnimatePresence>
        {!folder.collapsed && folderFilters.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-2 pb-2 space-y-1.5">
              {folderFilters.map((filter) => (
                <FilterCard
                  key={filter.id}
                  filter={filter}
                  labels={labels}
                  temporalMeta={temporalFilters.find((tf) => tf.filterId === filter.id)}
                  vipContacts={vipContacts}
                  onDelete={onDeleteFilter}
                  onEdit={onEditFilter}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!folder.collapsed && folderFilters.length === 0 && (
        <div className="px-3 pb-3">
          <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
            {t('dragFiltersHere')}
          </p>
        </div>
      )}
    </div>
  );
}
