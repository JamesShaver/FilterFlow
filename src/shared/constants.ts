export const GMAIL_API_BASE = 'https://www.googleapis.com/gmail/v1/users/me';

export const ALARM_CHECK_EXPIRED = 'checkExpiredFilters';
export const ALARM_PERIOD_MINUTES = 1440; // 24 hours

export const STORAGE_KEYS = {
  FOLDERS: 'folders',
  TEMPORAL_FILTERS: 'temporalFilters',
  FILTER_ORDER: 'filterOrder',
  VIP_CONTACTS: 'vipContacts',
  VIP_RESCUE_STATE: 'vipRescueState',
} as const;

export const VIP_MAX_CONTACTS = 50;

export const DRY_RUN_DEBOUNCE_MS = 500;
export const DRY_RUN_MAX_RESULTS = 5;

export const GHOST_LABEL_SCAN_DELAY_MS = 5000;
export const GMAIL_BATCH_LIMIT = 100;
