export interface GmailFilterCriteria {
  from?: string;
  to?: string;
  subject?: string;
  query?: string;
  negatedQuery?: string;
  hasAttachment?: boolean;
  excludeChats?: boolean;
  size?: number;
  sizeComparison?: 'larger' | 'smaller';
}

export interface GmailFilterAction {
  addLabelIds?: string[];
  removeLabelIds?: string[];
  forward?: string;
  archive?: boolean;
  markRead?: boolean;
  star?: boolean;
  trash?: boolean;
  neverSpam?: boolean;
  markImportant?: boolean;
}

export interface GmailFilter {
  id: string;
  criteria: GmailFilterCriteria;
  action: GmailFilterAction;
}

export interface GmailLabel {
  id: string;
  name: string;
  type: 'system' | 'user';
}

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessagePayload {
  headers: GmailMessageHeader[];
  mimeType: string;
  body?: { size: number; data?: string };
}

export interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  internalDate: string;
  payload: GmailMessagePayload;
}

export interface GmailMessageListResponse {
  messages?: Array<{ id: string; threadId: string }>;
  resultSizeEstimate: number;
}
