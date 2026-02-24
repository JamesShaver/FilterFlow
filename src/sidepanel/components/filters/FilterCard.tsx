import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import type { GmailFilter, GmailLabel } from '@shared/types/gmail';
import type { TemporalFilterMeta } from '@shared/types/storage';
import { getFilterSummary, getActionSummary } from '../../lib/filter-utils';
import { Badge } from '../common/Badge';
import { FilterActions } from './FilterActions';
import { t } from '../../lib/i18n';

interface FilterCardProps {
  filter: GmailFilter;
  labels?: GmailLabel[];
  temporalMeta?: TemporalFilterMeta;
  onDelete: (id: string) => void;
  onEdit?: (filter: GmailFilter) => void;
}

export function FilterCard({ filter, labels, temporalMeta, onDelete, onEdit }: FilterCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: filter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const expiryText = temporalMeta
    ? getExpiryText(temporalMeta.expiresAt)
    : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-3 group
        ${isDragging ? 'shadow-lg ring-2 ring-indigo-200 dark:ring-indigo-800' : 'hover:border-slate-300 dark:hover:border-slate-600'}`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <button
          className="mt-0.5 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 cursor-grab active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <circle cx="4" cy="3" r="1.5" />
            <circle cx="12" cy="3" r="1.5" />
            <circle cx="4" cy="8" r="1.5" />
            <circle cx="12" cy="8" r="1.5" />
            <circle cx="4" cy="13" r="1.5" />
            <circle cx="12" cy="13" r="1.5" />
          </svg>
        </button>

        <div className="flex-1 min-w-0">
          {/* Criteria summary */}
          <p className="text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
            {getFilterSummary(filter)}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {getActionSummary(filter, labels).map((action, i) => (
              <Badge key={i} variant="indigo">{action}</Badge>
            ))}
            {expiryText && (
              <Badge variant="amber">{expiryText}</Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <FilterActions
          onEdit={onEdit ? () => onEdit(filter) : undefined}
          onDelete={() => onDelete(filter.id)}
        />
      </div>
    </motion.div>
  );
}

function getExpiryText(expiresAt: number): string {
  const now = Date.now();
  const diff = expiresAt - now;
  if (diff <= 0) return t('expired');
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days === 1) return t('expiresTomorrow');
  if (days <= 7) return t('expiresInDays', [String(days)]);
  return t('expiresOnDate', [new Date(expiresAt).toLocaleDateString()]);
}
