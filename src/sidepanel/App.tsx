import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  useDroppable,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AppProvider, useAppContext } from './context/AppContext';
import { useAuth } from './hooks/useAuth';
import { useFilters } from './hooks/useFilters';
import { useFolders } from './hooks/useFolders';
import { reorderArray, getFilterSummary } from './lib/filter-utils';
import { Header } from './components/layout/Header';
import { FilterList } from './components/filters/FilterList';
import { FilterForm } from './components/filters/FilterForm';
import { FolderList } from './components/folders/FolderList';
import { FolderDialog } from './components/folders/FolderCreateDialog';
import { ContextualCreator } from './components/contextual/ContextualCreator';
import { Toast } from './components/common/Toast';
import { Button } from './components/common/Button';
import { EmptyState } from './components/common/EmptyState';
import { ConsolidationBar } from './components/filters/ConsolidationBar';
import { ConsolidateDialog } from './components/filters/ConsolidateDialog';
import { DuplicateReviewDialog } from './components/filters/DuplicateReviewDialog';
import { useFilterAnalysis } from './hooks/useFilterAnalysis';
import type { ConsolidationGroup, DuplicateGroup } from './lib/filter-analysis';
import type { ConsolidateResult } from './components/filters/ConsolidateDialog';
import type { GmailFilter, GmailFilterCriteria } from '@shared/types/gmail';
import type { VirtualFolder } from '@shared/types/storage';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const { filters, filterOrder, fetchFilters, fetchLabels, deleteFilter, createFilter, updateFilterOrder, isLoading } = useFilters();
  const { addFilterToFolder, removeFilterFromAllFolders } = useFolders();
  const { state } = useAppContext();
  const { consolidationGroups, duplicateGroups, hasAnySuggestions } = useFilterAnalysis(filters, state.labels);

  const [showFilterForm, setShowFilterForm] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<VirtualFolder | null>(null);
  const [editingFilter, setEditingFilter] = useState<GmailFilter | null>(null);
  const [initialCriteria, setInitialCriteria] = useState<GmailFilterCriteria | undefined>();
  const [activeFilter, setActiveFilter] = useState<GmailFilter | null>(null);
  const [consolidateGroup, setConsolidateGroup] = useState<ConsolidationGroup | null>(null);
  const [duplicateGroup, setDuplicateGroup] = useState<DuplicateGroup | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const filter = filters.find((f) => f.id === event.active.id);
    setActiveFilter(filter ?? null);
  }, [filters]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveFilter(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Dropped onto the uncategorized zone — remove from all folders
    if (overId === 'uncategorized-drop') {
      removeFilterFromAllFolders(activeId);
      return;
    }

    // Dropped onto a folder droppable
    if (overId.startsWith('folder-')) {
      const folderId = overId.replace('folder-', '');
      addFilterToFolder(folderId, activeId);
      return;
    }

    // Check if this is a cross-section drag (folder → uncategorized or vice versa)
    const activeInFolder = state.folders.find((f) => f.filterIds.includes(activeId));
    const overInFolder = state.folders.find((f) => f.filterIds.includes(overId));

    if (activeInFolder && !overInFolder) {
      // Dragged from a folder onto an uncategorized filter — uncategorize it
      removeFilterFromAllFolders(activeId);
      return;
    }

    if (!activeInFolder && overInFolder) {
      // Dragged from uncategorized onto a filter inside a folder — add to that folder
      addFilterToFolder(overInFolder.id, activeId);
      return;
    }

    // Otherwise it's a reorder within the same section
    const oldIndex = filterOrder.indexOf(activeId);
    const newIndex = filterOrder.indexOf(overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = reorderArray(filterOrder, oldIndex, newIndex);
    updateFilterOrder(newOrder);
    window.dispatchEvent(new Event('filterflow:order-changed'));
  }, [filterOrder, updateFilterOrder, addFilterToFolder, removeFilterFromAllFolders, state.folders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFilters();
      fetchLabels();
    }
  }, [isAuthenticated, fetchFilters, fetchLabels]);

  const handleCreateFilter = (criteria?: { from?: string; subject?: string }) => {
    setInitialCriteria(criteria);
    setShowFilterForm(true);
  };

  const handleEditFilter = (filter: GmailFilter) => {
    setEditingFilter(filter);
    setInitialCriteria(filter.criteria);
    setShowFilterForm(true);
  };

  const handleCloseForm = () => {
    setShowFilterForm(false);
    setEditingFilter(null);
    setInitialCriteria(undefined);
  };

  const handleConsolidate = async (result: ConsolidateResult) => {
    // Merge each selected sub-group: delete originals, create merged filter
    for (const subGroup of result.subGroups) {
      for (const filter of subGroup.filters) {
        await deleteFilter(filter.id);
      }
      await createFilter(subGroup.mergeResult.criteria, {
        ...subGroup.filters[0].action,
      });
    }
    // Delete any remaining filters marked for deletion
    for (const id of result.deleteFilterIds) {
      await deleteFilter(id);
    }
  };

  const handleDeleteDuplicates = async (filterIdsToDelete: string[]) => {
    for (const id of filterIdsToDelete) {
      await deleteFilter(id);
    }
  };

  // Get uncategorized filters (not in any folder)
  const categorizedIds = new Set(state.folders.flatMap((f) => f.filterIds));
  const uncategorizedFilters = filters.filter((f) => !categorizedIds.has(f.id));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {isAuthenticated ? (
        <div className="p-4 space-y-4">
          {/* Contextual Creator */}
          <ContextualCreator onCreateFilter={handleCreateFilter} />

          {/* Filter Form */}
          <AnimatePresence>
            {showFilterForm && (
              <FilterForm
                initialCriteria={initialCriteria}
                initialAction={editingFilter?.action}
                onClose={handleCloseForm}
              />
            )}
          </AnimatePresence>

          {/* Toolbar */}
          {!showFilterForm && (
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => handleCreateFilter()}>
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Filter
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { setEditingFolder(null); setShowFolderDialog(true); }}>
                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                New Folder
              </Button>
              <div className="flex-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchFilters}
                disabled={isLoading}
                title="Refresh filters"
              >
                <svg
                  className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </Button>
            </div>
          )}

          {/* Filter Analysis Suggestions */}
          {hasAnySuggestions && !showFilterForm && (
            <ConsolidationBar
              consolidationGroups={consolidationGroups}
              duplicateGroups={duplicateGroups}
              onConsolidate={setConsolidateGroup}
              onReviewDuplicates={setDuplicateGroup}
            />
          )}

          {/* DndContext wraps both folders and filter lists so cross-drops work */}
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Folders */}
            <FolderList
              filters={filters}
              onDeleteFilter={deleteFilter}
              onEditFilter={handleEditFilter}
              onCreateFolder={() => { setEditingFolder(null); setShowFolderDialog(true); }}
              onEditFolder={(folder) => { setEditingFolder(folder); setShowFolderDialog(true); }}
            />

            {/* Uncategorized Filters / All filters if no folders */}
            {state.folders.length > 0 && (
              <UncategorizedSection>
                {uncategorizedFilters.length > 0 ? (
                  <FilterList
                    onCreateFilter={() => handleCreateFilter()}
                    onEditFilter={handleEditFilter}
                    folderFilterIds={uncategorizedFilters.map((f) => f.id)}
                  />
                ) : (
                  <p className="text-xs text-slate-400 text-center py-3">
                    Drag filters here to uncategorize
                  </p>
                )}
              </UncategorizedSection>
            )}

            {state.folders.length === 0 && (
              <FilterList
                onCreateFilter={() => handleCreateFilter()}
                onEditFilter={handleEditFilter}
              />
            )}

            {/* Drag overlay — floating card that follows the cursor */}
            <DragOverlay dropAnimation={null}>
              {activeFilter && (
                <div className="bg-white rounded-lg border border-indigo-300 shadow-lg p-3 ring-2 ring-indigo-200 opacity-90 max-w-sm">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {getFilterSummary(activeFilter)}
                  </p>
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Folder Dialog (create / edit) */}
          <FolderDialog
            open={showFolderDialog}
            onClose={() => { setShowFolderDialog(false); setEditingFolder(null); }}
            folder={editingFolder}
          />
        </div>
      ) : (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          }
          title="Welcome to FilterFlow"
          description="Sign in with your Google account to manage your Gmail filters with a powerful drag-and-drop interface."
        />
      )}

      {/* Consolidation & Duplicate Dialogs */}
      {consolidateGroup && (
        <ConsolidateDialog
          open={!!consolidateGroup}
          group={consolidateGroup}
          labels={state.labels}
          onConfirm={handleConsolidate}
          onClose={() => setConsolidateGroup(null)}
        />
      )}
      {duplicateGroup && (
        <DuplicateReviewDialog
          open={!!duplicateGroup}
          group={duplicateGroup}
          labels={state.labels}
          onConfirm={handleDeleteDuplicates}
          onClose={() => setDuplicateGroup(null)}
        />
      )}

      <Toast />
    </div>
  );
}

function UncategorizedSection({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'uncategorized-drop' });

  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg transition-colors ${isOver ? 'bg-indigo-50/50 ring-1 ring-indigo-200' : ''}`}
    >
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">
        Uncategorized
      </h3>
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
