import { useState } from 'react';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { t } from '../../lib/i18n';

export function Header() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-end">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setHelpOpen(true)} aria-label={t('needHelpAria')}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                {t('signOut')}
              </Button>
            ) : (
              <Button size="sm" loading={isLoading} onClick={signIn}>
                {t('signIn')}
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title={t('needHelp')}>
        <ul className="space-y-3">
          <li>
            <a
              href="https://github.com/JamesShaver/FilterFlow/issues/new?template=bug_report.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span>🪲</span> {t('reportBug')}
            </a>
          </li>
          <li>
            <a
              href="https://github.com/JamesShaver/FilterFlow/issues/new?template=feature_request.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <span>💡</span> {t('suggestFeature')}
            </a>
          </li>
        </ul>
      </Dialog>
    </>
  );
}
