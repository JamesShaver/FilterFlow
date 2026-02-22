import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-slate-200 shadow-sm ${onClick ? 'cursor-pointer hover:border-slate-300' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
