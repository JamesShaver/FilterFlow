import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { GmailFilterCriteria, GmailFilterAction } from '@shared/types/gmail';
import { useFilters } from '../../hooks/useFilters';
import { useAppContext } from '../../context/AppContext';
import { Button } from '../common/Button';
import { DryRunPreview } from './DryRunPreview';

interface FilterFormProps {
  initialCriteria?: GmailFilterCriteria;
  initialAction?: GmailFilterAction;
  onClose: () => void;
}

export function FilterForm({ initialCriteria, initialAction, onClose }: FilterFormProps) {
  const { createFilter, labels, isLoading } = useFilters();
  const { state } = useAppContext();

  const [criteria, setCriteria] = useState<GmailFilterCriteria>(initialCriteria || {});
  const [action, setAction] = useState<GmailFilterAction>(initialAction || {});
  const [enableExpiry, setEnableExpiry] = useState(false);
  const [expiryDays, setExpiryDays] = useState(7);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
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
      className="bg-white border border-slate-200 rounded-lg shadow-sm"
    >
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Create Filter</h2>
          <button
            className="text-slate-400 hover:text-slate-600"
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
          <legend className="text-xs font-medium text-slate-500 uppercase tracking-wider">Criteria</legend>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">From</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="sender@example.com"
              value={criteria.from || ''}
              onChange={(e) => setCriteria({ ...criteria, from: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">To</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="recipient@example.com"
              value={criteria.to || ''}
              onChange={(e) => setCriteria({ ...criteria, to: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Contains words..."
              value={criteria.subject || ''}
              onChange={(e) => setCriteria({ ...criteria, subject: e.target.value || undefined })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Has the words</label>
            <input
              type="text"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Search query..."
              value={criteria.query || ''}
              onChange={(e) => setCriteria({ ...criteria, query: e.target.value || undefined })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={criteria.hasAttachment || false}
              onChange={(e) => setCriteria({ ...criteria, hasAttachment: e.target.checked || undefined })}
            />
            Has attachment
          </label>
        </fieldset>

        {/* Dry Run Preview */}
        <DryRunPreview criteria={criteria} />

        {/* Actions */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</legend>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={action.archive || false}
              onChange={(e) => setAction({ ...action, archive: e.target.checked || undefined })}
            />
            Skip the Inbox (Archive)
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={action.markRead || false}
              onChange={(e) => setAction({ ...action, markRead: e.target.checked || undefined })}
            />
            Mark as read
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={action.star || false}
              onChange={(e) => setAction({ ...action, star: e.target.checked || undefined })}
            />
            Star it
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={action.trash || false}
              onChange={(e) => setAction({ ...action, trash: e.target.checked || undefined })}
            />
            Delete it
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={action.markImportant || false}
              onChange={(e) => setAction({ ...action, markImportant: e.target.checked || undefined })}
            />
            Mark as important
          </label>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={action.neverSpam || false}
              onChange={(e) => setAction({ ...action, neverSpam: e.target.checked || undefined })}
            />
            Never send to Spam
          </label>

          {userLabels.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Apply label</label>
              <select
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={action.addLabelIds?.[0] || ''}
                onChange={(e) => {
                  setAction({
                    ...action,
                    addLabelIds: e.target.value ? [e.target.value] : undefined,
                  });
                }}
              >
                <option value="">None</option>
                {userLabels.map((label) => (
                  <option key={label.id} value={label.id}>{label.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Forward to</label>
            <input
              type="email"
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="forward@example.com"
              value={action.forward || ''}
              onChange={(e) => setAction({ ...action, forward: e.target.value || undefined })}
            />
          </div>
        </fieldset>

        {/* Auto-expiry */}
        <fieldset className="space-y-3">
          <legend className="text-xs font-medium text-slate-500 uppercase tracking-wider">Expiration</legend>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              checked={enableExpiry}
              onChange={(e) => setEnableExpiry(e.target.checked)}
            />
            Auto-expire this filter
          </label>

          {enableExpiry && (
            <div className="flex items-center gap-2 pl-6">
              <select
                className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={expiryDays}
                onChange={(e) => setExpiryDays(Number(e.target.value))}
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>1 week</option>
                <option value={14}>2 weeks</option>
                <option value={30}>1 month</option>
                <option value={90}>3 months</option>
              </select>
              <span className="text-xs text-slate-500">from now</span>
            </div>
          )}
        </fieldset>

        {/* Submit */}
        <div className="flex items-center gap-2 pt-2">
          <Button type="submit" loading={isLoading} className="flex-1">
            Create Filter
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
