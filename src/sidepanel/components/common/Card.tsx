import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm ${onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-600' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
