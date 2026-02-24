import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ConsolidationGroup, DuplicateGroup } from '../../lib/filter-analysis';
import { t } from '../../lib/i18n';

interface ConsolidationBarProps {
  consolidationGroups: ConsolidationGroup[];
  duplicateGroups: DuplicateGroup[];
  onConsolidate: (group: ConsolidationGroup) => void;
  onReviewDuplicates: (group: DuplicateGroup) => void;
}

export function ConsolidationBar({
  consolidationGroups,
  duplicateGroups,
  onConsolidate,
  onReviewDuplicates,
}: ConsolidationBarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const total = consolidationGroups.length + duplicateGroups.length;

  return (
    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/30 overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-semibold text-indigo-800 dark:text-indigo-200">
            {t('suggestionsCount', [String(total), total !== 1 ? 's' : ''])}
          </span>
        </div>
        <svg
          className={`w-4 h-4 text-indigo-500 dark:text-indigo-400 transition-transform ${collapsed ? '' : 'rotate-180'}`}
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
            <div className="px-3 pb-2 space-y-1">
              {consolidationGroups.map((group) => (
                <div
                  key={`consolidate-${group.labelId}`}
                  className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-md px-2.5 py-1.5 border border-indigo-100 dark:border-indigo-800/50"
                >
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate mr-2">
                    {t('filtersAllLabel', [String(group.filters.length), group.labelName])}
                  </span>
                  <button
                    className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    onClick={() => onConsolidate(group)}
                  >
                    {t('consolidate')}
                  </button>
                </div>
              ))}

              {duplicateGroups.map((group) => (
                <div
                  key={`duplicate-${group.key}`}
                  className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-md px-2.5 py-1.5 border border-indigo-100 dark:border-indigo-800/50"
                >
                  <span className="text-xs text-slate-700 dark:text-slate-300 truncate mr-2">
                    {t('filtersMatchKey', [String(group.filters.length), group.key])}
                  </span>
                  <button
                    className="shrink-0 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
                    onClick={() => onReviewDuplicates(group)}
                  >
                    {t('review')}
                  </button>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
