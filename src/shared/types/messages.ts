import type { GmailFilter, GmailFilterCriteria, GmailFilterAction, GmailMessage, GmailLabel } from './gmail';
import type { VirtualFolder } from './storage';

// Background message types
export type BackgroundMessage =
  | { type: 'GET_AUTH_TOKEN'; interactive?: boolean }
  | { type: 'SIGN_OUT' }
  | { type: 'GET_FILTERS' }
  | { type: 'CREATE_FILTER'; criteria: GmailFilterCriteria; action: GmailFilterAction }
  | { type: 'DELETE_FILTER'; filterId: string }
  | { type: 'REORDER_FILTERS'; filterIds: string[] }
  | { type: 'DRY_RUN'; query: string }
  | { type: 'GET_LABELS' }
  | { type: 'CREATE_LABEL'; name: string }
  | { type: 'EMAIL_CONTEXT'; sender: string; subject: string }
  | { type: 'GET_EMAIL_CONTEXT' }
  | { type: 'APPLY_FILTER_TO_EXISTING'; query: string; action: GmailFilterAction };

// Response types
export type MessageResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string };

export type AuthTokenResponse = MessageResponse<{ token: string }>;
export type FiltersResponse = MessageResponse<{ filters: GmailFilter[] }>;
export type FilterResponse = MessageResponse<{ filter: GmailFilter }>;
export type DeleteResponse = MessageResponse<void>;
export type DryRunResponse = MessageResponse<{ messages: GmailMessage[] }>;
export type LabelsResponse = MessageResponse<{ labels: GmailLabel[] }>;
