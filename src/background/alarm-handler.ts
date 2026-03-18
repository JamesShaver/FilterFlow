import { ALARM_CHECK_EXPIRED, ALARM_PERIOD_MINUTES, STORAGE_KEYS } from '@shared/constants';
import type { TemporalFilterMeta } from '@shared/types/storage';
import { deleteFilter } from './gmail-api';

export function setupAlarms(): void {
  chrome.alarms.create(ALARM_CHECK_EXPIRED, {
    periodInMinutes: ALARM_PERIOD_MINUTES,
    delayInMinutes: 1, // First check 1 minute after install
  });
}

export async function handleAlarm(alarm: chrome.alarms.Alarm): Promise<void> {
  if (alarm.name !== ALARM_CHECK_EXPIRED) return;

  const result = await chrome.storage.sync.get(STORAGE_KEYS.TEMPORAL_FILTERS) as Record<string, unknown>;
  const temporalFilters: TemporalFilterMeta[] = (result[STORAGE_KEYS.TEMPORAL_FILTERS] as TemporalFilterMeta[] | undefined) || [];
  const now = Date.now();

  const expired = temporalFilters.filter((tf) => tf.expiresAt <= now);
  if (expired.length === 0) return;

  const remaining = temporalFilters.filter((tf) => tf.expiresAt > now);

  // Delete expired filters from Gmail
  for (const tf of expired) {
    try {
      await deleteFilter(tf.filterId);
    } catch (err) {
      console.warn(`Failed to delete expired filter ${tf.filterId}:`, err);
    }
  }

  // Update storage
  await chrome.storage.sync.set({ [STORAGE_KEYS.TEMPORAL_FILTERS]: remaining });
}
