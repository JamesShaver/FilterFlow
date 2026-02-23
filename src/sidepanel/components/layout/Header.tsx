import { useState } from 'react';
import { Button } from '../common/Button';
import { Dialog } from '../common/Dialog';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
            </div>
            <h1 className="text-base font-semibold text-slate-900">FilterFlow</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setHelpOpen(true)} aria-label="Need help?">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </Button>
            {isAuthenticated ? (
              <Button variant="ghost" size="sm" onClick={signOut}>
                Sign out
              </Button>
            ) : (
              <Button size="sm" loading={isLoading} onClick={signIn}>
                Sign in
              </Button>
            )}
          </div>
        </div>
      </header>

      <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} title="Need Help?">
        <ul className="space-y-3">
          <li>
            <a
              href="https://github.com/JamesShaver/FilterFlow/issues/new?template=bug_report.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <span>🪲</span> Report a Bug
            </a>
          </li>
          <li>
            <a
              href="https://github.com/JamesShaver/FilterFlow/issues/new?template=feature_request.md"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <span>💡</span> Suggest a Feature
            </a>
          </li>
          <li>
            <a
              href="mailto:	filterflow_support@mg.cdndev.io?subject=FilterFlow%20Support%20Request"
              className="flex items-center gap-2 text-sm text-slate-700 hover:text-indigo-600 transition-colors"
            >
              <span>📫</span> Contact via Email
            </a>
          </li>
        </ul>
      </Dialog>
    </>
  );
}
