import React from 'react';
import { Button } from '../common/Button';
import { useAuth } from '../../hooks/useAuth';

export function Header() {
  const { isAuthenticated, isLoading, signIn, signOut } = useAuth();

  return (
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
    </header>
  );
}
