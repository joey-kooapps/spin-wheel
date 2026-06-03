export type HistoryType =
  | 'spin'
  | 'add_item'
  | 'rename_item'
  | 'update_tags'
  | 'update_weight'
  | 'delete_item'
  | 'import_items'
  | 'export_items'
  | 'clear_history';

export interface WheelItem {
  id: number;
  name: string;
  tags: string[];
  weight: number;
}

export interface HistoryEntry {
  id: string;
  time: string;
  type: HistoryType;
  payload: Record<string, unknown>;
}

export interface Dataset {
  id: string;
  name: string;
  items: WheelItem[];
  currentId: number;
  history: HistoryEntry[];
}

export interface WinnerResult {
  item: WheelItem;
  poolCount: number;
  totalWeight: number;
  filteredBy: string[];
}

export interface AppState {
  datasets: Dataset[];
  activeDatasetId: string;
  filterTags: string[];
  winner: WinnerResult | null;
}

export type ConfirmRequest =
  | { kind: 'dataset'; datasetId: string; label: string }
  | { kind: 'item'; itemId: number; label: string }
  | { kind: 'history'; label: string };
