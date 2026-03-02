import { useMemo } from 'react';
import type { GmailFilter, GmailLabel } from '@shared/types/gmail';
import {
  findConsolidationGroups,
  findDuplicateGroups,
  type ConsolidationGroup,
  type DuplicateGroup,
} from '../lib/filter-analysis';

export function useFilterAnalysis(filters: GmailFilter[], labels: GmailLabel[]) {
  const consolidationGroups = useMemo(
    () => findConsolidationGroups(filters, labels),
    [filters, labels],
  );

  const duplicateGroups = useMemo(
    () => findDuplicateGroups(filters),
    [filters],
  );

  const hasAnySuggestions =
    consolidationGroups.length > 0 || duplicateGroups.length > 0;

  return { consolidationGroups, duplicateGroups, hasAnySuggestions };
}
