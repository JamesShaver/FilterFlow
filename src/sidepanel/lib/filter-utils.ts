import type { GmailFilter, GmailFilterCriteria, GmailFilterAction, GmailLabel } from '@shared/types/gmail';

export function getCriteriaSummary(criteria: GmailFilterCriteria): string {
  const parts: string[] = [];

  if (criteria.from) parts.push(`From: ${criteria.from}`);
  if (criteria.to) parts.push(`To: ${criteria.to}`);
  if (criteria.subject) parts.push(`Subject: ${criteria.subject}`);
  if (criteria.query) parts.push(`Has: ${criteria.query}`);
  if (criteria.negatedQuery) parts.push(`NOT: ${criteria.negatedQuery}`);
  if (criteria.hasAttachment) parts.push('Has attachment');
  if (criteria.size && criteria.sizeComparison) {
    parts.push(`Size ${criteria.sizeComparison} ${criteria.size}`);
  }
  if (criteria.excludeChats) parts.push('Exclude chats');

  return parts.length > 0 ? parts.join(' AND ') : 'No criteria';
}

export function getFilterSummary(filter: GmailFilter): string {
  return getCriteriaSummary(filter.criteria);
}

export function getActionSummary(filter: GmailFilter, labels: GmailLabel[] = []): string[] {
  const actions: string[] = [];
  const { action } = filter;

  const resolveLabelName = (id: string): string | undefined =>
    labels.find((l) => l.id === id)?.name;

  if (action.archive) actions.push('Archive');
  if (action.markRead) actions.push('Mark as read');
  if (action.star) actions.push('Star');
  if (action.trash) actions.push('Delete');
  if (action.markImportant) actions.push('Mark important');
  if (action.neverSpam) actions.push('Never spam');
  if (action.forward) actions.push(`Forward to ${action.forward}`);
  if (action.addLabelIds?.length) {
    for (const id of action.addLabelIds) {
      const name = resolveLabelName(id);
      actions.push(name ? `Label: ${name}` : 'Apply label');
    }
  }
  if (action.removeLabelIds?.length) {
    for (const id of action.removeLabelIds) {
      const name = resolveLabelName(id);
      actions.push(name ? `Remove: ${name}` : 'Remove label');
    }
  }

  return actions.length > 0 ? actions : ['No actions'];
}

export function buildSearchQuery(criteria: GmailFilterCriteria): string {
  const parts: string[] = [];

  if (criteria.from) {
    // Wrap multi-value OR terms in braces for Gmail: from:{a OR b}
    const fromVal = criteria.from.includes(' OR ')
      ? `{${criteria.from}}`
      : criteria.from;
    parts.push(`from:(${fromVal})`);
  }
  if (criteria.to) {
    const toVal = criteria.to.includes(' OR ')
      ? `{${criteria.to}}`
      : criteria.to;
    parts.push(`to:(${toVal})`);
  }
  if (criteria.subject) {
    const subVal = criteria.subject.includes(' OR ')
      ? `{${criteria.subject}}`
      : criteria.subject;
    parts.push(`subject:(${subVal})`);
  }
  if (criteria.query) parts.push(criteria.query);
  if (criteria.negatedQuery) parts.push(`-(${criteria.negatedQuery})`);
  if (criteria.hasAttachment) parts.push('has:attachment');
  if (criteria.size && criteria.sizeComparison) {
    parts.push(`${criteria.sizeComparison === 'larger' ? 'larger' : 'smaller'}:${criteria.size}`);
  }

  return parts.join(' ');
}

export function reorderArray<T>(array: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...array];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}
