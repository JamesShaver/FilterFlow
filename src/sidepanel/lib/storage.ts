import { STORAGE_KEYS } from '@shared/constants';
import type { VirtualFolder, TemporalFilterMeta, VipContact } from '@shared/types/storage';

export async function getFolders(): Promise<VirtualFolder[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.FOLDERS) as Record<string, unknown>;
  return (result[STORAGE_KEYS.FOLDERS] as VirtualFolder[] | undefined) || [];
}

export async function saveFolders(folders: VirtualFolder[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.FOLDERS]: folders });
}

export async function getTemporalFilters(): Promise<TemporalFilterMeta[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.TEMPORAL_FILTERS) as Record<string, unknown>;
  return (result[STORAGE_KEYS.TEMPORAL_FILTERS] as TemporalFilterMeta[] | undefined) || [];
}

export async function saveTemporalFilters(filters: TemporalFilterMeta[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.TEMPORAL_FILTERS]: filters });
}

export async function getFilterOrder(): Promise<string[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.FILTER_ORDER) as Record<string, unknown>;
  return (result[STORAGE_KEYS.FILTER_ORDER] as string[] | undefined) || [];
}

export async function saveFilterOrder(order: string[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.FILTER_ORDER]: order });
}

export async function getVipContacts(): Promise<VipContact[]> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.VIP_CONTACTS) as Record<string, unknown>;
  return (result[STORAGE_KEYS.VIP_CONTACTS] as VipContact[] | undefined) || [];
}

export async function saveVipContacts(contacts: VipContact[]): Promise<void> {
  await chrome.storage.sync.set({ [STORAGE_KEYS.VIP_CONTACTS]: contacts });
}
