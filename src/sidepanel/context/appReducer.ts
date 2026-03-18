import type { GmailFilter, GmailLabel } from '@shared/types/gmail';
import type { VirtualFolder, TemporalFilterMeta, VipContact } from '@shared/types/storage';

export interface AppState {
  isAuthenticated: boolean;
  isLoading: boolean;
  filters: GmailFilter[];
  labels: GmailLabel[];
  folders: VirtualFolder[];
  temporalFilters: TemporalFilterMeta[];
  filterOrder: string[];
  emailContext: { sender: string; subject: string } | null;
  vipContacts: VipContact[];
  searchQuery: string;
  error: string | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
}

export type AppAction =
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_FILTERS'; payload: GmailFilter[] }
  | { type: 'ADD_FILTER'; payload: GmailFilter }
  | { type: 'REMOVE_FILTER'; payload: string }
  | { type: 'SET_LABELS'; payload: GmailLabel[] }
  | { type: 'SET_FOLDERS'; payload: VirtualFolder[] }
  | { type: 'SET_TEMPORAL_FILTERS'; payload: TemporalFilterMeta[] }
  | { type: 'SET_FILTER_ORDER'; payload: string[] }
  | { type: 'SET_EMAIL_CONTEXT'; payload: { sender: string; subject: string } | null }
  | { type: 'SET_VIP_CONTACTS'; payload: VipContact[] }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SHOW_TOAST'; payload: { message: string; type: 'success' | 'error' | 'info' } }
  | { type: 'DISMISS_TOAST' };

export const initialState: AppState = {
  isAuthenticated: false,
  isLoading: false,
  filters: [],
  labels: [],
  folders: [],
  temporalFilters: [],
  filterOrder: [],
  vipContacts: [],
  emailContext: null,
  searchQuery: '',
  error: null,
  toast: null,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'ADD_FILTER':
      return { ...state, filters: [...state.filters, action.payload] };
    case 'REMOVE_FILTER':
      return {
        ...state,
        filters: state.filters.filter((f) => f.id !== action.payload),
        folders: state.folders.map((folder) => ({
          ...folder,
          filterIds: folder.filterIds.filter((id) => id !== action.payload),
        })),
      };
    case 'SET_LABELS':
      return { ...state, labels: action.payload };
    case 'SET_FOLDERS':
      return { ...state, folders: action.payload };
    case 'SET_TEMPORAL_FILTERS':
      return { ...state, temporalFilters: action.payload };
    case 'SET_FILTER_ORDER':
      return { ...state, filterOrder: action.payload };
    case 'SET_VIP_CONTACTS':
      return { ...state, vipContacts: action.payload };
    case 'SET_EMAIL_CONTEXT':
      return { ...state, emailContext: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SHOW_TOAST':
      return { ...state, toast: action.payload };
    case 'DISMISS_TOAST':
      return { ...state, toast: null };
    default:
      return state;
  }
}
