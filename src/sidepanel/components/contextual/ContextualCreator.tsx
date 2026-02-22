import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEmailContext } from '../../hooks/useEmailContext';
import { Button } from '../common/Button';

interface ContextualCreatorProps {
  onCreateFilter: (criteria: { from?: string; subject?: string }) => void;
}

export function ContextualCreator({ onCreateFilter }: ContextualCreatorProps) {
  const { emailContext, clearContext } = useEmailContext();

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
          <div className="mx-4 mb-3 bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-indigo-900 mb-0.5">Quick Filter</p>
                <p className="text-xs text-indigo-700 truncate">
                  {emailContext.sender}
                </p>
                {emailContext.subject && (
                  <p className="text-xs text-indigo-500 truncate">
                    {emailContext.subject}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={() => onCreateFilter({ from: emailContext.sender })}
                  >
                    Filter sender
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearContext}
                  >
                    Dismiss
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
