import React, { useState, useMemo } from 'react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { getFilterSummary, getCriteriaSummary, getActionSummary } from '../../lib/filter-utils';
import { analyzeConsolidationGroup } from '../../lib/filter-analysis';
import type { ConsolidationGroup, MergeSubGroup } from '../../lib/filter-analysis';
import type { GmailLabel } from '@shared/types/gmail';

export interface ConsolidateResult {
  subGroups: MergeSubGroup[];
  deleteFilterIds: string[];
}

interface ConsolidateDialogProps {
  open: boolean;
  group: ConsolidationGroup;
  labels: GmailLabel[];
  onConfirm: (result: ConsolidateResult) => Promise<void>;
  onClose: () => void;
}

export function ConsolidateDialog({
  open,
  group,
  labels,
  onConfirm,
  onClose,
}: ConsolidateDialogProps) {
  const [loading, setLoading] = useState(false);

  const analysis = useMemo(() => analyzeConsolidationGroup(group), [group]);

  // Track which sub-groups are selected for merging (default: all checked)
  const [selectedSubGroups, setSelectedSubGroups] = useState<Set<number>>(() =>
    new Set(analysis.subGroups.map((_, i) => i)),
  );

  // Track which remaining filters are marked for deletion
  const [markedForDeletion, setMarkedForDeletion] = useState<Set<string>>(new Set());

  const hasSubGroups = analysis.subGroups.length > 0;
  const hasRemaining = analysis.remaining.length > 0;
  const totalMergeable = analysis.subGroups.reduce((sum, sg) => sum + sg.filters.length, 0);

  const toggleSubGroup = (index: number) => {
    setSelectedSubGroups((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleRemainingFilter = (filterId: string) => {
    setMarkedForDeletion((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  const canAct = selectedSubGroups.size > 0 || markedForDeletion.size > 0;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const selectedSGs = analysis.subGroups.filter((_, i) => selectedSubGroups.has(i));
      await onConfirm({
        subGroups: selectedSGs,
        deleteFilterIds: [...markedForDeletion],
      });
      onClose();
    } catch {
      // toast handled by caller
    } finally {
      setLoading(false);
    }
  };

  // Description text adapts to the situation
  const description = (() => {
    if (hasSubGroups && !hasRemaining) {
      if (analysis.subGroups.length === 1) {
        return `All ${group.filters.length} filters can be merged into one.`;
      }
      return `These filters can be merged into ${analysis.subGroups.length} groups based on their criteria patterns.`;
    }
    if (hasSubGroups && hasRemaining) {
      return `${totalMergeable} filters can be merged into ${analysis.subGroups.length} ${analysis.subGroups.length === 1 ? 'group' : 'groups'}. ${analysis.remaining.length} ${analysis.remaining.length === 1 ? 'filter has' : 'filters have'} a different pattern and can't be auto-merged.`;
    }
    return "These filters use different criteria patterns and can't be auto-merged, but you can delete the ones you don't need.";
  })();

  // Button label
  const buttonLabel = (() => {
    const parts: string[] = [];
    if (selectedSubGroups.size > 0) {
      const filterCount = analysis.subGroups
        .filter((_, i) => selectedSubGroups.has(i))
        .reduce((sum, sg) => sum + sg.filters.length, 0);
      parts.push(`Merge ${filterCount} filters`);
    }
    if (markedForDeletion.size > 0) {
      parts.push(`Delete ${markedForDeletion.size}`);
    }
    return parts.join(' & ') || 'Consolidate';
  })();

  return (
    <Dialog open={open} onClose={onClose} title="Consolidate Filters" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-slate-500">
          These {group.filters.length} filters all apply the label &ldquo;{group.labelName}&rdquo;.
          {' '}{description}
        </p>

        {/* Mergeable sub-groups */}
        {analysis.subGroups.map((subGroup, index) => (
          <div key={index}>
            <div className="flex items-center gap-2 mb-1.5">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  checked={selectedSubGroups.has(index)}
                  onChange={() => toggleSubGroup(index)}
                />
                <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                  {analysis.subGroups.length === 1
                    ? `Merge ${subGroup.filters.length} filters`
                    : `Group ${index + 1}: ${subGroup.filters.length} filters`}
                </h3>
              </label>
            </div>

            {/* Filters in this sub-group */}
            <div className="space-y-1 mb-2">
              {subGroup.filters.map((filter) => (
                <div
                  key={filter.id}
                  className="rounded-md px-2.5 py-1.5 border bg-slate-50 border-slate-200"
                >
                  <p className="text-xs font-medium text-slate-800 truncate">
                    {getFilterSummary(filter)}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {getActionSummary(filter, labels).map((action, i) => (
                      <Badge key={i} variant="indigo">{action}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Merged preview */}
            {selectedSubGroups.has(index) && (
              <div className="bg-green-50 rounded-md px-2.5 py-2 border border-green-200">
                <p className="text-[10px] font-medium text-green-600 uppercase tracking-wider mb-0.5">
                  Merged Result
                </p>
                <p className="text-xs font-medium text-green-800">
                  {getCriteriaSummary(subGroup.mergeResult.criteria)}
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  <Badge variant="green">Label: {group.labelName}</Badge>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Remaining (unmergeable) filters */}
        {hasRemaining && (
          <div>
            <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5">
              {hasSubGroups ? 'Remaining Filters' : 'Current Filters'}
            </h3>
            <div className="space-y-1.5">
              {analysis.remaining.map((filter) => {
                const isDeleting = markedForDeletion.has(filter.id);
                return (
                  <div
                    key={filter.id}
                    className={`rounded-md px-2.5 py-2 border transition-colors ${
                      isDeleting
                        ? 'bg-red-50 border-red-200 opacity-60'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium truncate ${isDeleting ? 'text-red-400 line-through' : 'text-slate-800'}`}>
                          {getFilterSummary(filter)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {getActionSummary(filter, labels).map((action, i) => (
                            <Badge key={i} variant={isDeleting ? 'red' : 'indigo'}>{action}</Badge>
                          ))}
                        </div>
                      </div>
                      <button
                        className={`shrink-0 text-xs font-medium px-2 py-1 rounded transition-colors ${
                          isDeleting
                            ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}
                        onClick={() => toggleRemainingFilter(filter.id)}
                      >
                        {isDeleting ? 'Keep' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            variant={selectedSubGroups.size > 0 ? 'primary' : 'danger'}
            loading={loading}
            disabled={!canAct}
            onClick={handleConfirm}
          >
            {buttonLabel}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
