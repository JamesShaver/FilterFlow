import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GmailFilterCriteria, GmailFilterAction } from '@shared/types/gmail';
import { useFilters } from '../../hooks/useFilters';
import { useFolders } from '../../hooks/useFolders';
import { useAppContext } from '../../context/AppContext';
import { buildSearchQuery } from '../../lib/filter-utils';
import { sendMessage } from '../../lib/message';
import { Button } from '../common/Button';
import { DryRunPreview } from './DryRunPreview';
import { t } from '../../lib/i18n';

interface FilterFormProps {
  editingFilterId?: string;
  initialCriteria?: GmailFilterCriteria;
  initialAction?: GmailFilterAction;
  onClose: () => void;
}

function hasAnyAction(action: GmailFilterAction): boolean {
  return !!(
    action.archive ||
    action.markRead ||
    action.star ||
    action.trash ||
    action.markImportant ||
    action.neverSpam ||
    (action.addLabelIds && action.addLabelIds.length > 0) ||
    (action.forward && action.forward.trim().length > 0)
  );
}

export function FilterForm({ editingFilterId, initialCriteria, initialAction, onClose }: FilterFormProps) {
  const { createFilter, deleteFilter, createLabel, labels, isLoading } = useFilters();
  const { state } = useAppContext();
  const { addFilterToFolder } = useFolders();

  const [criteria, setCriteria] = useState<GmailFilterCriteria>(initialCriteria || {});
  const [action, setAction] = useState<GmailFilterAction>(initialAction || {});
  const [applyToExisting, setApplyToExisting] = useState(false);
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);
  const [actionError, setActionError] = useState<string | null>(null);
  const [isCreatingLabel, setIsCreatingLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [labelLoading, setLabelLoading] = useState(false);

  const updateAction = (newAction: GmailFilterAction) => {
    setAction(newAction);
    if (actionError) setActionError(null);
  };

  const handleCreateLabel = async () => {
    const trimmed = newLabelName.trim();
    if (!trimmed) return;
    try {
      setLabelLoading(true);
      const label = await createLabel(trimmed);
      updateAction({ ...action, addLabelIds: [label.id] });
      setIsCreatingLabel(false);
      setNewLabelName('');
    } catch {
      // Error handled by hook (toast)
    } finally {
      setLabelLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasAnyAction(action)) {
      setActionError(t('validationActionRequired'));
      return;
    }
    try {
      // When editing, capture folder membership before deleting the old filter
      let oldFolderIds: string[] = [];
      if (editingFilterId) {
        oldFolderIds = state.folders
          .filter((f) => f.filterIds.includes(editingFilterId))
          .map((f) => f.id);
        await deleteFilter(editingFilterId, { silent: true });
      }
      const filter = await createFilter(criteria, action);

      // If expiry is enabled, save temporal metadata
      if (enableExpiry && filter) {
        const { saveTemporalFilters, getTemporalFilters } = await import('../../lib/storage');
        const existing = await getTemporalFilters();
        await saveTemporalFilters([
          ...existing,
          {
            filterId: filter.id,
            expiresAt: Date.now() + expiryDays * 24 * 60 * 60 * 1000,
            createdAt: Date.now(),
          },
        ]);
      }

      // Restore folder membership for the new filter ID
      if (filter && oldFolderIds.length > 0) {
        for (const folderId of oldFolderIds) {
          await addFilterToFolder(folderId, filter.id);
        }
      }

      // Apply filter actions to existing matching messages
      if (applyToExisting) {
        const query = buildSearchQuery(criteria);
        if (query.trim()) {
          sendMessage<{ applied: number }>({
            type: 'APPLY_FILTER_TO_EXISTING',
            query,
            action,
          }).catch(() => {}); // Best-effort — filter is already saved
        }
      }

      onClose();
    } catch {
      // Error handled by hook
    }
  };

  const userLabels = state.labels.filter((l) => l.type === 'user');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm"
    >
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{editingFilterId ? t('editFilter') : t('createFilter')}</h2>
          <button
            className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            onClick={onClose}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* Criteria */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('criteriaLegend')}</legend>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('formFrom')}</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholderSender')}
              value={criteria.from || ''}
              onChange={(e) => setCriteria({ ...criteria, from: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('formTo')}</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholderRecipient')}
              value={criteria.to || ''}
              onChange={(e) => setCriteria({ ...criteria, to: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('formSubject')}</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholderSubject')}
              value={criteria.subject || ''}
              onChange={(e) => setCriteria({ ...criteria, subject: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('formHasWords')}</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholderQuery')}
              value={criteria.query || ''}
              onChange={(e) => setCriteria({ ...criteria, query: e.target.value || undefined })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={criteria.hasAttachment || false}
              onChange={(e) => setCriteria({ ...criteria, hasAttachment: e.target.checked || undefined })}
            />
            {t('hasAttachment')}
          </label>
        </fieldset>

        {/* Dry Run Preview */}
        <DryRunPreview criteria={criteria} />

        {/* Actions */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('actionsLegend')}</legend>

          {actionError && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1" role="alert">
              {actionError}
            </p>
          )}

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={action.archive || false}
              onChange={(e) => updateAction({ ...action, archive: e.target.checked || undefined })}
            />
            {t('actionArchive')}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={action.markRead || false}
              onChange={(e) => updateAction({ ...action, markRead: e.target.checked || undefined })}
            />
            {t('actionMarkRead')}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={action.star || false}
              onChange={(e) => updateAction({ ...action, star: e.target.checked || undefined })}
            />
            {t('actionStar')}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={action.trash || false}
              onChange={(e) => updateAction({ ...action, trash: e.target.checked || undefined })}
            />
            {t('actionDelete')}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={action.markImportant || false}
              onChange={(e) => updateAction({ ...action, markImportant: e.target.checked || undefined })}
            />
            {t('actionMarkImportant')}
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={action.neverSpam || false}
              onChange={(e) => updateAction({ ...action, neverSpam: e.target.checked || undefined })}
            />
            {t('actionNeverSpam')}
          </label>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('applyLabel')}</label>

            {!isCreatingLabel ? (
              <>
                <select
                  className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={action.addLabelIds?.[0] || ''}
                  onChange={(e) => {
                    if (e.target.value === '__create_new__') {
                      setIsCreatingLabel(true);
                      return;
                    }
                    updateAction({
                      ...action,
                      addLabelIds: e.target.value ? [e.target.value] : undefined,
                    });
                  }}
                >
                  <option value="">{t('labelNone')}</option>
                  {userLabels.map((label) => (
                    <option key={label.id} value={label.id}>{label.name}</option>
                  ))}
                  <option value="__create_new__">{t('createNewLabel')}</option>
                </select>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  className="flex-1 px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={t('newLabelName')}
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleCreateLabel();
                    }
                    if (e.key === 'Escape') {
                      setIsCreatingLabel(false);
                      setNewLabelName('');
                    }
                  }}
                  autoFocus
                  disabled={labelLoading}
                />
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  onClick={handleCreateLabel}
                  disabled={labelLoading || !newLabelName.trim()}
                >
                  {t('create')}
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                  onClick={() => {
                    setIsCreatingLabel(false);
                    setNewLabelName('');
                  }}
                  disabled={labelLoading}
                >
                  {t('cancel')}
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{t('forwardTo')}</label>
            <input
              type="email"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={t('placeholderForward')}
              value={action.forward || ''}
              onChange={(e) => updateAction({ ...action, forward: e.target.value || undefined })}
            />
          </div>
        </fieldset>

        {/* Apply to existing */}
        <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
            checked={applyToExisting}
            onChange={(e) => setApplyToExisting(e.target.checked)}
          />
          {t('applyToExisting')}
        </label>

        {/* Auto-expiry */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t('expirationLegend')}</legend>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500"
              checked={enableExpiry}
              onChange={(e) => setEnableExpiry(e.target.checked)}
            />
            {t('autoExpire')}
          </label>

          {enableExpiry && (
            <div className="flex items-center gap-2 pl-6">
              <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
              >
                <option value={1}>{t('expiry1Day')}</option>
                <option value={3}>{t('expiry3Days')}</option>
                <option value={7}>{t('expiry1Week')}</option>
                <option value={14}>{t('expiry2Weeks')}</option>
                <option value={30}>{t('expiry1Month')}</option>
                <option value={90}>{t('expiry3Months')}</option>
              </select>
              <span className="text-xs text-slate-500 dark:text-slate-400">{t('fromNow')}</span>
            </div>
          )}
        </fieldset>

        {/* Submit */}
        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" loading={isLoading} className="flex-1">
            {editingFilterId ? t('saveChanges') : t('createFilter')}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('cancel')}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
