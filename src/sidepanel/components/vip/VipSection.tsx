import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVipRescue } from '../../hooks/useVipRescue';
import { VIP_MAX_CONTACTS } from '@shared/constants';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { t } from '../../lib/i18n';

export function VipSection() {
  const { vipContacts, rescueSender, removeVip } = useVipRescue();
  const [collapsed, setCollapsed] = useState(true);
  const [addEmail, setAddEmail] = useState('');
  const [adding, setAdding] = useState(false);

  if (vipContacts.length === 0 && collapsed) return null;

  const handleAdd = async () => {
    const email = addEmail.trim();
    if (!email) return;
    setAdding(true);
    try {
      await rescueSender(email);
      setAddEmail('');
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer"
        onClick={() => setCollapsed(!collapsed)}
      >
        <motion.svg
          className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          animate={{ rotate: collapsed ? 0 : 90 }}
          transition={{ duration: 0.15 }}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </motion.svg>

        <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>

        <span className="flex-1 text-sm font-medium text-slate-900 dark:text-slate-100">
          {t('vipSection')}
        </span>

        <Badge>{`${vipContacts.length} / ${VIP_MAX_CONTACTS}`}</Badge>
      </div>

      {/* Content */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* Add VIP input */}
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                  placeholder={t('placeholderSender')}
                  className="flex-1 px-2 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button size="sm" onClick={handleAdd} loading={adding} disabled={!addEmail.trim()}>
                  {t('addVip')}
                </Button>
              </div>

              {/* VIP list */}
              {vipContacts.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-2">
                  {t('vipContacts')}
                </p>
              ) : (
                <div className="space-y-1.5">
                  {vipContacts.map((contact) => (
                    <div
                      key={contact.email}
                      className="flex items-center gap-2 px-2 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {contact.email}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {t('vipRescueDesc', [
                            String(contact.messagesRescued),
                            new Date(contact.rescuedAt).toLocaleDateString(),
                          ])}
                        </p>
                      </div>
                      <button
                        className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded transition-colors"
                        onClick={() => removeVip(contact.email)}
                        title={t('removeVip')}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
