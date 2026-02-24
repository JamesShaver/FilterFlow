import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

const typeStyles = {
  success: 'bg-green-600',
  error: 'bg-red-600',
  info: 'bg-slate-700 dark:bg-slate-600',
};

const icons = {
  success: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  ),
  error: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export function Toast() {
  const { state, dispatch } = useAppContext();
  const toast = state.toast;

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        dispatch({ type: 'DISMISS_TOAST' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          className={`fixed bottom-4 left-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-white text-sm shadow-lg ${typeStyles[toast.type]}`}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          {icons[toast.type]}
          <span className="flex-1">{toast.message}</span>
          <button
            className="text-white/80 hover:text-white"
            onClick={() => dispatch({ type: 'DISMISS_TOAST' })}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
