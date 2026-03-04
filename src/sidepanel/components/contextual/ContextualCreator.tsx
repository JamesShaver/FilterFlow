import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmailContext } from '../../hooks/useEmailContext';
import { useVipRescue } from '../../hooks/useVipRescue';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { t } from '../../lib/i18n';

interface ContextualCreatorProps {
  onCreateFilter: (criteria: { from?: string; subject?: string }) => void;
}

export function ContextualCreator({ onCreateFilter }: ContextualCreatorProps) {
  const { emailContext, clearContext } = useEmailContext();
  const { isVip, rescueSender } = useVipRescue();
  const [rescuing, setRescuing] = useState(false);

  const handleCreate = () => {
    if (!emailContext) return;
    onCreateFilter({
      from: emailContext.sender || undefined,
      subject: emailContext.subject || undefined,
    });
  };

  const handleRescue = async () => {
    if (!emailContext?.sender) return;
    setRescuing(true);
    try {
      await rescueSender(emailContext.sender);
    } finally {
      setRescuing(false);
    }
  };

  const senderIsVip = emailContext?.sender ? isVip(emailContext.sender) : false;

  return (
    <AnimatePresence>
      {emailContext && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="mx-4 mb-3 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0">
                <svg className="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <p className="text-xs font-medium text-indigo-900 dark:text-indigo-200">{t('quickFilter')}</p>
                  {senderIsVip && (
                    <Badge variant="green">
                      <svg className="w-3 h-3 mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      VIP
                    </Badge>
                  )}
                </div>
                {emailContext.sender && (
                  <p className="text-xs text-indigo-700 dark:text-indigo-300 truncate">
                    {emailContext.sender}
                  </p>
                )}
                {emailContext.subject && (
                  <p className="text-xs text-indigo-500 dark:text-indigo-400 truncate">
                    {emailContext.subject}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleCreate}
                  >
                    {t('createQuickFilter')}
                  </Button>
                  {emailContext.sender && !senderIsVip && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleRescue}
                      loading={rescuing}
                      disabled={rescuing}
                    >
                      <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {t('rescueAndProtect')}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearContext}
                  >
                    {t('dismiss')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
