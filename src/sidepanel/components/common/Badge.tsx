import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'indigo' | 'green' | 'amber' | 'red';
  className?: string;
}

const variants = {
  default: 'bg-slate-100 text-slate-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  green: 'bg-green-50 text-green-700',
  amber: 'bg-amber-50 text-amber-700',
  red: 'bg-red-50 text-red-700',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
