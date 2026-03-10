import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Badge } from '../common/Badge';
import { t } from '../../lib/i18n';
import type { GmailLabel } from '@shared/types/gmail';

interface GhostLabelBarProps {
  ghostLabels: GmailLabel[];
  isScanning: boolean;
  onReviewCleanup: () => void;
  onDismiss: () => void;
}

export function GhostLabelBar({
  ghostLabels,
  isScanning,
  onReviewCleanup,
  onDismiss,
}: GhostLabelBarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (isScanning) {
    return (
      <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 px-3 py-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
            {t('ghostScanning')}
          </span>
        </div>
      </div>
    );
  }

  if (ghostLabels.length === 0) return null;

  return (
    <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/30 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <span className="text-xs font-semibold text-amber-800 dark:text-amber-200">
            {t('ghostLabelsFound', [String(ghostLabels.length), ghostLabels.length !== 1 ? 's' : ''])}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-amber-500 dark:text-amber-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-2 space-y-2">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                {t('ghostLabelsDescription')}
              </p>

              <div className="flex flex-wrap gap-1">
                {ghostLabels.map((label) => (
                  <Badge key={label.id} variant="amber">{label.name}</Badge>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  className="text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 bg-amber-100 dark:bg-amber-800/40 px-2.5 py-1 rounded-md transition-colors"
                  onClick={onReviewCleanup}
                >
                  {t('ghostReviewCleanup')}
                </button>
                <button
                  className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                  onClick={onDismiss}
                >
                  {t('dismiss')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
