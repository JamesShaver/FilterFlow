import type { GmailFilter, GmailFilterCriteria, GmailLabel } from '@shared/types/gmail';

export interface ConsolidationGroup {
  labelId: string;
  labelName: string;
  filters: GmailFilter[];
}

export interface DuplicateGroup {
  reason: string;
  key: string;
  filters: GmailFilter[];
}

export interface MergeResult {
  criteria: GmailFilterCriteria;
  mergeable: boolean;
  conflictReason?: string;
}

export interface MergeSubGroup {
  filters: GmailFilter[];
  mergeResult: MergeResult; // always mergeable within a sub-group
}

export interface ConsolidationAnalysis {
  subGroups: MergeSubGroup[];
  remaining: GmailFilter[];
}

/**
 * Group filters that all apply the same label — candidates for merging.
 */
export function findConsolidationGroups(
  filters: GmailFilter[],
  labels: GmailLabel[],
): ConsolidationGroup[] {
  const labelMap = new Map(labels.map((l) => [l.id, l.name]));
  const byLabel = new Map<string, GmailFilter[]>();

  for (const filter of filters) {
    for (const labelId of filter.action.addLabelIds ?? []) {
      const group = byLabel.get(labelId);
      if (group) {
        group.push(filter);
      } else {
        byLabel.set(labelId, [filter]);
      }
    }
  }

  const groups: ConsolidationGroup[] = [];
  for (const [labelId, groupFilters] of byLabel) {
    if (groupFilters.length >= 2) {
      groups.push({
        labelId,
        labelName: labelMap.get(labelId) ?? labelId,
        filters: groupFilters,
      });
    }
  }

  return groups;
}

/**
 * Extract domain from a `from` criteria value (e.g. "*@example.com" → "example.com").
 */
function extractDomain(from: string): string | null {
  const match = from.match(/@([\w.-]+)/);
  return match ? match[1].toLowerCase() : null;
}

/**
 * Find groups of filters that are likely duplicates based on shared domain, subject, or query.
 */
export function findDuplicateGroups(filters: GmailFilter[]): DuplicateGroup[] {
  const seen = new Set<string>(); // track filter-id pairs already surfaced
  const groups: DuplicateGroup[] = [];

  const pairKey = (ids: string[]) => [...ids].sort().join('|');

  const addGroup = (reason: string, key: string, groupFilters: GmailFilter[]) => {
    // Deduplicate: if every pair in this group was already surfaced, skip
    const pairs = groupFilters.flatMap((a, i) =>
      groupFilters.slice(i + 1).map((b) => pairKey([a.id, b.id])),
    );
    const allSeen = pairs.every((p) => seen.has(p));
    if (allSeen) return;
    pairs.forEach((p) => seen.add(p));
    groups.push({ reason, key, filters: groupFilters });
  };

  // Domain match
  const byDomain = new Map<string, GmailFilter[]>();
  for (const filter of filters) {
    if (!filter.criteria.from) continue;
    const domain = extractDomain(filter.criteria.from);
    if (!domain) continue;
    const group = byDomain.get(domain);
    if (group) {
      group.push(filter);
    } else {
      byDomain.set(domain, [filter]);
    }
  }
  for (const [domain, groupFilters] of byDomain) {
    if (groupFilters.length >= 2) {
      addGroup('Same domain', `domain:${domain}`, groupFilters);
    }
  }

  // Subject match
  const bySubject = new Map<string, GmailFilter[]>();
  for (const filter of filters) {
    const subj = filter.criteria.subject?.trim();
    if (!subj) continue;
    const key = subj.toLowerCase();
    const group = bySubject.get(key);
    if (group) {
      group.push(filter);
    } else {
      bySubject.set(key, [filter]);
    }
  }
  for (const [subj, groupFilters] of bySubject) {
    if (groupFilters.length >= 2) {
      addGroup('Same subject', `subject:${subj}`, groupFilters);
    }
  }

  // Query match
  const byQuery = new Map<string, GmailFilter[]>();
  for (const filter of filters) {
    const q = filter.criteria.query?.trim();
    if (!q) continue;
    const key = q.toLowerCase();
    const group = byQuery.get(key);
    if (group) {
      group.push(filter);
    } else {
      byQuery.set(key, [filter]);
    }
  }
  for (const [q, groupFilters] of byQuery) {
    if (groupFilters.length >= 2) {
      addGroup('Same query', `query:${q}`, groupFilters);
    }
  }

  return groups;
}

/**
 * Merge criteria from multiple filters into one using Gmail boolean syntax.
 *
 * Within a single field, multiple values are combined with OR:
 *   from: alice@x.com OR bob@y.com
 *
 * Across different fields, Gmail implicitly applies AND:
 *   from: alice@x.com (AND) subject: invoice
 *
 * Negation uses the negatedQuery field which maps to "Doesn't have":
 *   negatedQuery: "spam-sender@x.com"
 */
export function mergeFilterCriteria(filters: GmailFilter[]): MergeResult {
  const criteriaFields: (keyof GmailFilterCriteria)[] = [
    'from', 'to', 'subject', 'query',
  ];

  // Check which text criteria fields are used across all filters
  const usedFields = new Set<string>();
  for (const filter of filters) {
    for (const field of criteriaFields) {
      if (filter.criteria[field]) usedFields.add(field);
    }
  }

  // If filters use different criteria types, flag as non-mergeable
  // e.g. one uses `from`, another uses `subject` with no `from`
  const filtersWithDifferentFields = filters.some((f) => {
    const thisFields = criteriaFields.filter((field) => f.criteria[field]);
    return filters.some((other) => {
      if (other === f) return false;
      const otherFields = criteriaFields.filter((field) => other.criteria[field]);
      return (
        thisFields.length !== otherFields.length ||
        thisFields.some((field) => !otherFields.includes(field))
      );
    });
  });

  if (filtersWithDifferentFields) {
    return {
      criteria: filters[0].criteria,
      mergeable: false,
      conflictReason:
        'Filters use different criteria types and cannot be automatically merged.',
    };
  }

  // Merge by combining values within each field using OR (Gmail boolean syntax).
  // Different fields are implicitly AND-ed by Gmail.
  const merged: GmailFilterCriteria = {};

  for (const field of criteriaFields) {
    const values = filters
      .map((f) => f.criteria[field] as string | undefined)
      .filter(Boolean) as string[];
    if (values.length > 0) {
      // Collect individual terms, splitting any that are already OR-separated
      const unique = [...new Set(
        values.flatMap((v) => v.split(/\s+OR\s+/).map((t) => t.trim()).filter(Boolean))
      )];
      (merged as Record<string, string>)[field] =
        unique.length > 1 ? unique.join(' OR ') : unique[0];
    }
  }

  // Merge negatedQuery values with OR (exclude any of these)
  const negatedValues = filters
    .map((f) => f.criteria.negatedQuery)
    .filter(Boolean) as string[];
  if (negatedValues.length > 0) {
    const unique = [...new Set(
      negatedValues.flatMap((v) => v.split(/\s+OR\s+/).map((t) => t.trim()).filter(Boolean))
    )];
    merged.negatedQuery = unique.length > 1 ? unique.join(' OR ') : unique[0];
  }

  // Carry over boolean / numeric fields — use OR logic (true if any filter has it)
  if (filters.some((f) => f.criteria.hasAttachment)) merged.hasAttachment = true;
  if (filters.some((f) => f.criteria.excludeChats)) merged.excludeChats = true;

  // Size: only carry over if all filters agree on the same comparison
  const sizeCriteria = filters.filter((f) => f.criteria.size != null);
  if (sizeCriteria.length > 0) {
    const allSameComparison = sizeCriteria.every(
      (f) => f.criteria.sizeComparison === sizeCriteria[0].criteria.sizeComparison
    );
    if (allSameComparison) {
      // Use the most inclusive size (largest for "larger", smallest for "smaller")
      const sizes = sizeCriteria.map((f) => f.criteria.size!);
      merged.sizeComparison = sizeCriteria[0].criteria.sizeComparison;
      merged.size = merged.sizeComparison === 'larger'
        ? Math.min(...sizes)
        : Math.max(...sizes);
    }
  }

  return { criteria: merged, mergeable: true };
}

/**
 * Build a sorted key representing which criteria fields are active on a filter.
 * Includes text fields + boolean/numeric fields that affect merge compatibility.
 */
function getFieldSignature(filter: GmailFilter): string {
  const parts: string[] = [];
  const textFields: (keyof GmailFilterCriteria)[] = ['from', 'to', 'subject', 'query'];
  for (const field of textFields) {
    if (filter.criteria[field]) parts.push(field);
  }
  if (filter.criteria.negatedQuery) parts.push('negatedQuery');
  if (filter.criteria.hasAttachment) parts.push('hasAttachment');
  if (filter.criteria.size != null) {
    parts.push(`size:${filter.criteria.sizeComparison ?? 'larger'}`);
  }
  return parts.sort().join('|') || '_empty_';
}

/**
 * Build a key representing a filter's action shape (ignoring label IDs that
 * are already shared within a consolidation group).
 */
function getActionSignature(filter: GmailFilter, sharedLabelId: string): string {
  const a = filter.action;
  const parts: string[] = [];
  // Non-shared labels
  const otherLabels = (a.addLabelIds ?? []).filter((id) => id !== sharedLabelId).sort();
  if (otherLabels.length > 0) parts.push(`+labels:${otherLabels.join(',')}`);
  const removeLabels = (a.removeLabelIds ?? []).sort();
  if (removeLabels.length > 0) parts.push(`-labels:${removeLabels.join(',')}`);
  if (a.forward) parts.push(`fwd:${a.forward}`);
  if (a.archive) parts.push('archive');
  if (a.markRead) parts.push('read');
  if (a.star) parts.push('star');
  if (a.trash) parts.push('trash');
  if (a.neverSpam) parts.push('neverSpam');
  if (a.markImportant) parts.push('important');
  return parts.join('|') || '_default_';
}

/**
 * Normalize a criteria text field's OR terms for comparison.
 * Splits on OR, trims, lowercases, sorts, and re-joins so that
 * "b OR a" and "a OR b" are considered equal.
 */
function normalizeCriteriaField(value: string | undefined): string {
  if (!value) return '';
  return value.split(/\s+OR\s+/).map((t) => t.trim().toLowerCase()).sort().join(' OR ');
}

/**
 * Check whether two criteria objects are functionally equivalent.
 * Text fields are compared with normalized OR-term ordering.
 */
function criteriaEqual(a: GmailFilterCriteria, b: GmailFilterCriteria): boolean {
  const textFields: (keyof GmailFilterCriteria)[] = ['from', 'to', 'subject', 'query', 'negatedQuery'];
  for (const field of textFields) {
    if (normalizeCriteriaField(a[field] as string) !== normalizeCriteriaField(b[field] as string)) {
      return false;
    }
  }
  if (!!a.hasAttachment !== !!b.hasAttachment) return false;
  if (!!a.excludeChats !== !!b.excludeChats) return false;
  if ((a.size ?? null) !== (b.size ?? null)) return false;
  if ((a.sizeComparison ?? null) !== (b.sizeComparison ?? null)) return false;
  return true;
}

/**
 * Analyze a consolidation group by splitting filters into mergeable sub-groups
 * based on their criteria field signature and action compatibility.
 *
 * Filters that share the same field pattern AND action shape can be merged.
 * Singletons (unique signature) are returned as "remaining".
 *
 * If the merged result already matches an existing filter in the sub-group,
 * that filter is kept and the redundant ones are moved to "remaining" instead
 * of suggesting a merge that would create a duplicate.
 */
export function analyzeConsolidationGroup(group: ConsolidationGroup): ConsolidationAnalysis {
  // Group by combined signature (field pattern + action shape)
  const buckets = new Map<string, GmailFilter[]>();
  for (const filter of group.filters) {
    const key = `${getFieldSignature(filter)}::${getActionSignature(filter, group.labelId)}`;
    const bucket = buckets.get(key);
    if (bucket) {
      bucket.push(filter);
    } else {
      buckets.set(key, [filter]);
    }
  }

  const subGroups: MergeSubGroup[] = [];
  const remaining: GmailFilter[] = [];

  for (const filters of buckets.values()) {
    if (filters.length >= 2) {
      const mergeResult = mergeFilterCriteria(filters);
      // Should always be mergeable since they share the same field signature,
      // but guard just in case
      if (mergeResult.mergeable) {
        // Check if a filter in this bucket already has the merged criteria.
        // If so, it's already the consolidated version — the others are
        // redundant and should be offered for deletion, not re-merged.
        const existingMatch = filters.find((f) => criteriaEqual(f.criteria, mergeResult.criteria));
        if (existingMatch) {
          // The merged result already exists — all filters go to remaining
          // so the user can see and delete the redundant ones
          remaining.push(...filters);
        } else {
          subGroups.push({ filters, mergeResult });
        }
      } else {
        remaining.push(...filters);
      }
    } else {
      remaining.push(...filters);
    }
  }

  return { subGroups, remaining };
}
