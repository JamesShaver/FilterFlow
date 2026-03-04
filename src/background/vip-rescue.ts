import { STORAGE_KEYS, VIP_MAX_CONTACTS } from '@shared/constants';
import type { VipContact } from '@shared/types/storage';
import type { GmailFilter } from '@shared/types/gmail';
import { listFilters, createFilter, deleteFilter, searchMessageIds, batchModifyMessages } from './gmail-api';

interface RescueState {
  email: string;
  phase: 'starting' | 'protected' | 'rescued' | 'adjusted';
  startedAt: number;
  protectionFilterId?: string;
}

interface RescueResult {
  messagesRescued: number;
  filtersAdjusted: number;
  alreadyVip: boolean;
}

/**
 * Parse a Gmail filter `from` field into individual senders.
 * Gmail separates multiple senders with ` OR `, but `,` and `|` are also common.
 */
function parseFromField(from: string): string[] {
  return from
    .split(/\s+OR\s+|,|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function getVipContactsFromSync(): Promise<VipContact[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.VIP_CONTACTS) as Record<string, unknown>;
  return (result[STORAGE_KEYS.VIP_CONTACTS] as VipContact[] | undefined) || [];
}

async function saveVipContactsToSync(contacts: VipContact[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.VIP_CONTACTS]: contacts });
}

async function getRescueState(): Promise<RescueState | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.VIP_RESCUE_STATE) as Record<string, unknown>;
  return (result[STORAGE_KEYS.VIP_RESCUE_STATE] as RescueState | undefined) || null;
}

async function saveRescueState(state: RescueState | null): Promise<void> {
  if (state) {
    await chrome.storage.local.set({ [STORAGE_KEYS.VIP_RESCUE_STATE]: state });
  } else {
    await chrome.storage.local.remove(STORAGE_KEYS.VIP_RESCUE_STATE);
  }
}

/**
 * Core VIP rescue operation — safest-first order:
 * 1. Create protective filter (future emails safe immediately)
 * 2. Rescue buried messages
 * 3. Adjust existing conflicting filters
 * 4. Persist VIP contact
 */
export async function rescueVip(email: string): Promise<RescueResult> {
  const contacts = await getVipContactsFromSync();
  const existing = contacts.find((c) => c.email.toLowerCase() === email.toLowerCase());

  if (existing) {
    return { messagesRescued: 0, filtersAdjusted: 0, alreadyVip: true };
  }

  if (contacts.length >= VIP_MAX_CONTACTS) {
    throw new Error(chrome.i18n.getMessage('toastVipCapReached') || `VIP contact limit reached (${VIP_MAX_CONTACTS})`);
  }

  // Save operation state for crash recovery
  let opState: RescueState = { email, phase: 'starting', startedAt: Date.now() };
  await saveRescueState(opState);

  // Phase 1 — Create protective filter
  let protectionFilterId: string | undefined;
  try {
    const protFilter = await createFilter({ from: email }, { neverSpam: true });
    protectionFilterId = protFilter.id;
  } catch (err) {
    // "Filter already exists" is OK — protection already in place
    const msg = (err as Error)?.message ?? '';
    if (!msg.includes('already exists')) throw err;
  }
  opState = { ...opState, phase: 'protected', protectionFilterId };
  await saveRescueState(opState);

  // Phase 2 — Rescue buried messages
  const buriedIds = await searchMessageIds(`from:${email} -in:inbox`);
  let messagesRescued = 0;
  if (buriedIds.length > 0) {
    messagesRescued = await batchModifyMessages(buriedIds, ['INBOX'], ['TRASH', 'SPAM']);
  }
  opState = { ...opState, phase: 'rescued' };
  await saveRescueState(opState);

  // Phase 3 — Adjust existing conflicting filters
  const allFilters = await listFilters();
  let filtersAdjusted = 0;

  for (const filter of allFilters) {
    // Skip the protective filter we just created
    if (filter.id === protectionFilterId) continue;

    const fromField = filter.criteria.from;
    if (!fromField) continue;

    const senders = parseFromField(fromField);
    const matchesVip = senders.some((s) => s.toLowerCase() === email.toLowerCase());
    if (!matchesVip) continue;

    // Only adjust filters with harmful actions (archive, trash)
    const hasHarmfulAction = filter.action.archive || filter.action.trash;
    if (!hasHarmfulAction) continue;

    if (senders.length === 1) {
      // Single sender — delete the filter entirely
      await deleteFilter(filter.id);
    } else {
      // Multi-sender — strip VIP email and recreate for remaining senders
      const remaining = senders.filter((s) => s.toLowerCase() !== email.toLowerCase());
      const newFrom = remaining.join(' OR ');
      await deleteFilter(filter.id);
      await createFilter({ ...filter.criteria, from: newFrom }, filter.action);
    }
    filtersAdjusted++;
  }

  opState = { ...opState, phase: 'adjusted' };
  await saveRescueState(opState);

  // Phase 4 — Persist VIP contact
  const updatedContacts = await getVipContactsFromSync();
  const newContact: VipContact = {
    email,
    rescuedAt: Date.now(),
    messagesRescued,
    filtersAdjusted,
    protectionFilterId,
  };
  updatedContacts.push(newContact);
  await saveVipContactsToSync(updatedContacts);

  // Clear operation state
  await saveRescueState(null);

  return { messagesRescued, filtersAdjusted, alreadyVip: false };
}

/**
 * Resume a stale rescue operation after service worker restart.
 * Phases are idempotent so re-running is safe.
 */
export async function resumeRescue(): Promise<void> {
  const opState = await getRescueState();
  if (!opState) return;

  console.log('[FilterFlow] Resuming VIP rescue for', opState.email, 'from phase:', opState.phase);

  try {
    // Re-run the full rescue — phases are idempotent:
    // - Re-creating a protective filter just creates a second neverSpam filter (harmless)
    // - Re-rescuing messages is a no-op if already in inbox
    // - Re-adjusting filters may find nothing to adjust
    await rescueVip(opState.email);
  } catch (err) {
    console.warn('[FilterFlow] Failed to resume VIP rescue:', err);
  }
}

/**
 * Get VIP contacts from sync storage.
 */
export async function getVipContacts(): Promise<VipContact[]> {
  return getVipContactsFromSync();
}

/**
 * Remove a VIP contact and delete its protective filter.
 */
export async function removeVip(email: string): Promise<void> {
  const contacts = await getVipContactsFromSync();
  const contact = contacts.find((c) => c.email.toLowerCase() === email.toLowerCase());

  if (contact?.protectionFilterId) {
    try {
      await deleteFilter(contact.protectionFilterId);
    } catch {
      // Filter may already be deleted — ignore
    }
  }

  const updated = contacts.filter((c) => c.email.toLowerCase() !== email.toLowerCase());
  await saveVipContactsToSync(updated);
}

/**
 * Cross-reference VIP list against actual filters.
 * Returns contacts whose protective filter is missing.
 */
export function validateVipProtection(vipContacts: VipContact[], filters: GmailFilter[]): VipContact[] {
  const filterIds = new Set(filters.map((f) => f.id));
  return vipContacts.filter((c) => c.protectionFilterId && !filterIds.has(c.protectionFilterId));
}
