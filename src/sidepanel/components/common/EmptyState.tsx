import React from 'react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="text-slate-300 dark:text-slate-600 mb-3">{icon}</div>}
      <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-[240px]">{description}</p>}
      {action}
    </div>
  );
}
