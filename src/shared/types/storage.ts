export interface VirtualFolder {
  id: string;
  name: string;
  filterIds: string[];
  collapsed: boolean;
  color?: string;
  icon?: string;
}

export interface TemporalFilterMeta {
  filterId: string;
  expiresAt: number; // Unix timestamp ms
  createdAt: number;
}

export interface StorageSchema {
  folders: VirtualFolder[];
  temporalFilters: TemporalFilterMeta[];
  filterOrder: string[]; // ordered filter IDs for drag-and-drop persistence
}
