import { useRef, useState } from 'react';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { useAuth } from '../../hooks/useAuth';
import { useAppContext } from '../../context/AppContext';
import { t } from '../../lib/i18n';

export function Header() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const { state, dispatch } = useAppContext();
  const [helpOpen, setHelpOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleToggleSearch = () => {
    if (searchOpen) {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
      setSearchOpen(false);
    } else {
      setSearchOpen(true);
      // Focus after render
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  };

  const handleSearchChange = (value: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: value });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      dispatch({ type: 'SET_SEARCH_QUERY', payload: '' });
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <div className="flex items-center gap-2">
          {/* Search bar — expands to fill available space when open */}
          {searchOpen && isAuthenticated && (
            <div className="flex-1 relative">
              <svg
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 dark:text-slate-500 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                className="w-full pl-8 pr-8 py-1.5 text-sm border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 dark:placeholder-slate-400 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder={t('searchFilters')}
                value={state.searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
              />
              {state.searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  onClick={() => handleSearchChange('')}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Spacer when search is closed */}
          {!searchOpen && <div className="flex-1" />}

          <div className="flex items-center gap-1 shrink-0">
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSearch}
                aria-label={t('searchFilters')}
                className={searchOpen ? 'text-indigo-600 dark:text-indigo-400' : ''}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
            )}
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
