import React, { useEffect, useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { useFilters } from '../../hooks/useFilters';
import { useAppContext } from '../../context/AppContext';
import { FilterCard } from './FilterCard';
import { Button } from '../common/Button';
import { Spinner } from '../common/Spinner';
import { EmptyState } from '../common/EmptyState';
import type { GmailFilter } from '@shared/types/gmail';

interface ReorderProgress {
  completed: number;
  total: number;
  phase: string;
}

interface FilterListProps {
  onCreateFilter: () => void;
  onEditFilter: (filter: GmailFilter) => void;
  folderFilterIds?: string[];
}

export function FilterList({ onCreateFilter, onEditFilter, folderFilterIds }: FilterListProps) {
  const { filters, isLoading, deleteFilter, saveOrderToGmail } = useFilters();
  const { state } = useAppContext();
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [reorderProgress, setReorderProgress] = useState<ReorderProgress | null>(null);

  // Listen for progress updates from background script
  useEffect(() => {
    const listener = (message: Record<string, unknown>) => {
      if (message.type === 'REORDER_PROGRESS') {
        setReorderProgress({
          completed: message.completed as number,
          total: message.total as number,
          phase: message.phase as string,
        });
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, []);

  // Expose a way for the parent DndContext to signal order changes
  useEffect(() => {
    const handler = () => setHasOrderChanged(true);
    window.addEventListener('filterflow:order-changed', handler);
    return () => window.removeEventListener('filterflow:order-changed', handler);
  }, []);

  const displayFilters = folderFilterIds
    ? filters.filter((f) => folderFilterIds.includes(f.id))
    : filters;

  const handleSaveOrder = async () => {
    setReorderProgress({ completed: 0, total: 1, phase: 'Starting...' });
    await saveOrderToGmail();
    setReorderProgress(null);
    setHasOrderChanged(false);
  };

  if (isLoading && filters.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (filters.length === 0) {
    return (
      <EmptyState
        icon={
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        }
        title="No filters yet"
        description="Create your first Gmail filter to get started organizing your inbox."
        action={
          <Button size="sm" onClick={onCreateFilter}>
            Create filter
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-2">
      {hasOrderChanged && (
        <div className="bg-indigo-50 rounded-lg px-3 py-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-indigo-700 font-medium">
              {reorderProgress ? reorderProgress.phase : 'Order changed'}
            </span>
            <Button size="sm" loading={isLoading} onClick={handleSaveOrder} disabled={!!reorderProgress}>
              Save Order
            </Button>
          </div>
          {reorderProgress && reorderProgress.total > 0 && (
            <div className="space-y-1">
              <div className="w-full bg-indigo-200 rounded-full h-1.5 overflow-hidden">
                <motion.div
                  className="bg-indigo-600 h-1.5 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round((reorderProgress.completed / reorderProgress.total) * 100)}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-indigo-500 text-right">
                {reorderProgress.completed} / {reorderProgress.total} steps
              </p>
            </div>
          )}
        </div>
      )}

      <SortableContext items={displayFilters.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <AnimatePresence mode="popLayout">
          {displayFilters.map((filter) => (
            <FilterCard
              key={filter.id}
              filter={filter}
              labels={state.labels}
              temporalMeta={state.temporalFilters.find((tf) => tf.filterId === filter.id)}
              onDelete={deleteFilter}
              onEdit={onEditFilter}
            />
          ))}
        </AnimatePresence>
      </SortableContext>
    </div>
  );
}
