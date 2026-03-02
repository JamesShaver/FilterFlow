export const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

export const ALARM_CHECK_EXPIRED = 'checkExpiredFilters';
export const ALARM_PERIOD_MINUTES = 1440; // 24 hours

export const STORAGE_KEYS = {
  FOLDERS: 'folders',
  TEMPORAL_FILTERS: 'temporalFilters',
  FILTER_ORDER: 'filterOrder',
} as const;

export const DRY_RUN_DEBOUNCE_MS = 500;
export const DRY_RUN_MAX_RESULTS = 5;
