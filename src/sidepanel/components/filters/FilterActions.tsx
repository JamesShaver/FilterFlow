import React, { useState } from 'react';
import { t } from '../../lib/i18n';

interface FilterActionsProps {
  onEdit?: () => void;
  onDelete: () => void;
}

export function FilterActions({ onEdit, onDelete }: FilterActionsProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      {onEdit && (
        <button
          className="p-1 text-slate-400 hover:text-slate-600 rounded"
          onClick={onEdit}
          title={t('editFilter')}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <button
            className="p-1 text-red-600 hover:text-red-700 rounded text-xs font-medium"
            onClick={() => {
              onDelete();
              setConfirmDelete(false);
            }}
          >
            {t('delete')}
          </button>
          <button
            className="p-1 text-slate-400 hover:text-slate-600 rounded text-xs"
            onClick={() => setConfirmDelete(false)}
          >
            {t('cancel')}
          </button>
        </div>
      ) : (
        <button
          className="p-1 text-slate-400 hover:text-red-500 rounded"
          onClick={() => setConfirmDelete(true)}
          title={t('deleteFilter')}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
