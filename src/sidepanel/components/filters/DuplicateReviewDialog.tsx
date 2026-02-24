import React, { useState } from 'react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { getFilterSummary, getActionSummary } from '../../lib/filter-utils';
import type { DuplicateGroup } from '../../lib/filter-analysis';
import type { GmailLabel } from '@shared/types/gmail';
import { t } from '../../lib/i18n';

interface DuplicateReviewDialogProps {
  open: boolean;
  group: DuplicateGroup;
  labels: GmailLabel[];
  onConfirm: (filterIdsToDelete: string[]) => Promise<void>;
  onClose: () => void;
}

export function DuplicateReviewDialog({
  open,
  group,
  labels,
  onConfirm,
  onClose,
}: DuplicateReviewDialogProps) {
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const keptCount = group.filters.length - markedForDeletion.size;

  const toggleFilter = (filterId: string) => {
    setMarkedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        // Prevent deleting all — at least one must remain
        if (keptCount <= 1) return prev;
        next.add(filterId);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (markedForDeletion.size === 0) return;
    setLoading(true);
    try {
      await onConfirm([...markedForDeletion]);
      onClose();
    } catch {
      // toast handled by caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} title={t('reviewDuplicates')} size="lg">
      <div className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('duplicateDescription', [String(group.filters.length), group.reason.toLowerCase(), group.key])}
        </p>

        <div className="space-y-2">
          {group.filters.map((filter) => {
            const isDeleting = markedForDeletion.has(filter.id);
            const isLastKept = !isDeleting && keptCount <= 1;

            return (
              <div
                key={filter.id}
                className={`rounded-md px-2.5 py-2 border transition-colors ${
                  isDeleting
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-60'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isDeleting ? 'text-red-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                      {getFilterSummary(filter)}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {getActionSummary(filter, labels).map((action, i) => (
                        <Badge key={i} variant={isDeleting ? 'red' : 'indigo'}>{action}</Badge>
                      ))}
                    </div>
                  </div>
                  <button
                    className={`shrink-0 text-xs font-medium px-2 py-1 rounded transition-colors ${
                      isDeleting
                        ? 'bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-500'
                        : isLastKept
                          ? 'bg-slate-50 dark:bg-slate-700 text-slate-300 dark:text-slate-500 cursor-not-allowed'
                          : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50'
                    }`}
                    disabled={isLastKept && !isDeleting}
                    onClick={() => toggleFilter(filter.id)}
                  >
                    {isDeleting ? t('keep') : t('delete')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            loading={loading}
            disabled={markedForDeletion.size === 0}
            onClick={handleConfirm}
          >
            {t('deleteNFilters', [String(markedForDeletion.size), markedForDeletion.size !== 1 ? 's' : ''])}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
