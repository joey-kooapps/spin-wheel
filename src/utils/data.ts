import type { Dataset, HistoryEntry, WheelItem } from '../types';

export const STORAGE_KEY = 'spin-wheel:v2';

export const newId = (prefix = 'id') => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}_${Math.random().toString(36).slice(2)}`;
};

export const nowLabel = () => new Date().toLocaleString();

export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

export function sanitizeWeight(value: unknown, fallback = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function normalizeTag(tag: unknown) {
  return String(tag ?? '').trim().toLowerCase();
}

export function cleanTagsArray(tags: unknown) {
  if (!Array.isArray(tags)) return [];
  const seen = new Set<string>();
  const cleaned: string[] = [];

  tags.forEach((tag) => {
    const display = String(tag ?? '').trim();
    const key = normalizeTag(display);
    if (!display || seen.has(key)) return;
    seen.add(key);
    cleaned.push(display);
  });

  return cleaned;
}

export function parseTags(value: unknown) {
  if (Array.isArray(value)) return cleanTagsArray(value);
  return cleanTagsArray(String(value || '').split(','));
}

export function tagSignature(tags: unknown) {
  return cleanTagsArray(tags).map(normalizeTag).join('|');
}

export function tagsEqual(a: unknown, b: unknown) {
  return tagSignature(a) === tagSignature(b);
}

export function matchesFilter(item: WheelItem, filterTags: string[]) {
  if (!filterTags.length) return true;
  const itemTags = cleanTagsArray(item.tags).map(normalizeTag);
  return filterTags.every((tag) => itemTags.includes(normalizeTag(tag)));
}

export function getVisibleItems(items: WheelItem[], filterTags: string[]) {
  return items.filter((item) => matchesFilter(item, filterTags));
}

export function normalizeItem(raw: unknown, index = 0): WheelItem {
  const item = raw && typeof raw === 'object' ? (raw as Partial<WheelItem>) : {};
  return {
    id: Number.isFinite(Number(item.id)) ? Number(item.id) : index,
    name: String(item.name || 'Untitled item').trim() || 'Untitled item',
    tags: cleanTagsArray(item.tags),
    weight: sanitizeWeight(item.weight, 1),
  };
}

export function makeDataset(name = 'Default', items: WheelItem[] = []): Dataset {
  const maxId = items.reduce((max, item) => Math.max(max, item.id || 0), 0);
  return {
    id: newId('dataset'),
    name,
    items,
    currentId: Math.max(maxId + 1, items.length),
    history: [],
  };
}

export function createHistory(type: HistoryEntry['type'], payload: Record<string, unknown> = {}): HistoryEntry {
  return {
    id: newId('history'),
    time: nowLabel(),
    type,
    payload,
  };
}

export function normalizeImportedDataset(fileName: string, imported: unknown): Dataset | null {
  if (!imported || typeof imported !== 'object') return null;
  const payload = imported as { currentId?: unknown; items?: unknown };
  if (!Array.isArray(payload.items)) return null;

  const items = payload.items.map((item, index) => normalizeItem(item, index));
  const maxId = items.reduce((max, item) => Math.max(max, item.id || 0), 0);
  const name = (fileName || 'Imported').replace(/\.[^/.]+$/, '') || 'Imported';

  return {
    id: newId('dataset'),
    name,
    items,
    currentId: Math.max(sanitizeWeight(payload.currentId, 0), maxId + 1),
    history: [],
  };
}

export function datasetExportPayload(dataset: Dataset) {
  return {
    currentId: dataset.currentId || 0,
    items: dataset.items || [],
  };
}

export function downloadJson(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
