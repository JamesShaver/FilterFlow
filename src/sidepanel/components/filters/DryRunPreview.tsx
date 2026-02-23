import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GmailFilterCriteria } from '@shared/types/gmail';
import { useDryRun } from '../../hooks/useDryRun';
import { Spinner } from '../common/Spinner';
import { t } from '../../lib/i18n';

interface DryRunPreviewProps {
  criteria: GmailFilterCriteria;
}

function getHeader(headers: Array<{ name: string; value: string }>, name: string): string {
  return headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';
}

export function DryRunPreview({ criteria }: DryRunPreviewProps) {
  const { messages, isLoading, error } = useDryRun(criteria);

  const hasAnyCriteria = criteria.from || criteria.to || criteria.subject || criteria.query || criteria.hasAttachment;
  if (!hasAnyCriteria) return null;

  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        <span className="text-xs font-medium text-slate-600">{t('dryRunPreview')}</span>
        {isLoading && <Spinner size="sm" />}
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.p
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-500"
          >
            {error}
          </motion.p>
        ) : messages.length > 0 ? (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-1.5"
          >
            <p className="text-xs text-slate-500">{t('matchingEmails', [String(messages.length), messages.length !== 1 ? 's' : ''])}</p>
            {messages.map((msg) => (
              <div key={msg.id} className="bg-white rounded-md px-2.5 py-2 border border-slate-100">
                <p className="text-xs font-medium text-slate-800 truncate">
                  {getHeader(msg.payload.headers, 'From')}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {getHeader(msg.payload.headers, 'Subject')}
                </p>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {msg.snippet}
                </p>
              </div>
            ))}
          </motion.div>
        ) : !isLoading ? (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-slate-400"
          >
            {t('noMatchingEmails')}
          </motion.p>
        ) : (
          <div key="loading" className="space-y-1.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-md px-2.5 py-2 border border-slate-100 animate-pulse">
                <div className="h-3 bg-slate-200 rounded w-2/3 mb-1" />
                <div className="h-3 bg-slate-100 rounded w-full" />
              </div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
