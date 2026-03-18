import React, { useState, useMemo } from 'react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { t } from '../../lib/i18n';
import type { GmailLabel } from '@shared/types/gmail';

interface GhostLabelDialogProps {
  open: boolean;
  ghostLabels: GmailLabel[];
  isDeleting: boolean;
  deleteProgress: { completed: number; total: number; deleted: number; failed: number } | null;
  onConfirm: (labelIds: string[]) => Promise<void>;
  onClose: () => void;
}

type DialogStep = 'review' | 'confirm';

export function GhostLabelDialog({
  open,
  ghostLabels,
  isDeleting,
  deleteProgress,
  onConfirm,
  onClose,
}: GhostLabelDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(ghostLabels.map((l) => l.id)));
  const [step, setStep] = useState<DialogStep>('review');

  // Reset state when dialog opens with new labels
  const labelKey = ghostLabels.map((l) => l.id).join(',');
  const [prevKey, setPrevKey] = useState(labelKey);
  if (labelKey !== prevKey) {
    setPrevKey(labelKey);
    setSelected(new Set(ghostLabels.map((l) => l.id)));
    setStep('review');
  }

  const isBulk = selected.size >= 10;

  const toggleLabel = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === ghostLabels.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(ghostLabels.map((l) => l.id)));
    }
  };

  const selectedLabels = useMemo(
    () => ghostLabels.filter((l) => selected.has(l.id)),
    [ghostLabels, selected],
  );

  const handleContinue = () => setStep('confirm');
  const handleBack = () => setStep('review');

  const handleDelete = async () => {
    await onConfirm([...selected]);
    onClose();
  };

  const progressPct = deleteProgress
    ? Math.round((deleteProgress.completed / deleteProgress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onClose={isDeleting ? () => {} : onClose} title={t('ghostLabelsTitle')} size="md">
      {step === 'review' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('ghostLabelsReviewDescription')}
          </p>

          {/* Select all toggle */}
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100 dark:border-slate-700">
            <input
              type="checkbox"
              checked={selected.size === ghostLabels.length}
              ref={(el) => { if (el) el.indeterminate = selected.size > 0 && selected.size < ghostLabels.length; }}
              onChange={toggleAll}
              className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
            />
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {t('selectAll')} ({ghostLabels.length})
            </span>
          </div>

          <div className="space-y-1 max-h-60 overflow-y-auto">
            {ghostLabels.map((label) => (
              <label
                key={label.id}
                className={`flex items-center gap-2 rounded-md px-2.5 py-1.5 border cursor-pointer transition-colors ${
                  selected.has(label.id)
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected.has(label.id)}
                  onChange={() => toggleLabel(label.id)}
                  className="rounded border-slate-300 dark:border-slate-600 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate flex-1">
                  {label.name}
                </span>
                <Badge variant="default">{t('ghostZeroMessages')}</Badge>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              {t('cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={selected.size === 0}
              onClick={handleContinue}
            >
              {t('continue')} ({selected.size})
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          {/* Bulk warning for 10+ labels */}
          {isBulk && (
            <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2">
              <p className="text-xs font-medium text-red-800 dark:text-red-300">
                {t('ghostBulkWarning', [String(selected.size)])}
              </p>
            </div>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-400">
            {t('ghostConfirmDescription', [String(selected.size)])}
          </p>

          {/* Summary of labels to delete */}
          <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto">
            {selectedLabels.map((label) => (
              <Badge key={label.id} variant="red">{label.name}</Badge>
            ))}
          </div>

          {/* Deletion progress */}
          {isDeleting && deleteProgress && (
            <div className="space-y-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                <div
                  className="bg-red-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('ghostDeleteProgress', [String(deleteProgress.deleted), String(deleteProgress.total)])}
                {deleteProgress.failed > 0 && ` (${deleteProgress.failed} failed)`}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={handleBack} disabled={isDeleting}>
              {t('back')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              disabled={selected.size === 0}
              onClick={handleDelete}
            >
              {t('ghostDeleteCount', [String(selected.size), selected.size !== 1 ? 's' : ''])}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
