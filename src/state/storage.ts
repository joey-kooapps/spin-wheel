import type { AppState, Dataset } from '../types';
import { cleanTagsArray, makeDataset, sanitizeWeight, STORAGE_KEY } from '../utils/data';
import { createInitialState } from './appState';

interface StoredState {
  datasets?: Dataset[];
  activeDatasetId?: string;
}

function normalizeDataset(raw: unknown, fallbackIndex: number): Dataset {
  const dataset = raw && typeof raw === 'object' ? (raw as Partial<Dataset>) : {};
  const items = Array.isArray(dataset.items)
    ? dataset.items.map((item, index) => ({
        id: Number.isFinite(Number(item.id)) ? Number(item.id) : index,
        name: String(item.name || 'Untitled item').trim() || 'Untitled item',
        tags: cleanTagsArray(item.tags),
        weight: sanitizeWeight(item.weight, 1),
      }))
    : [];
  const maxId = items.reduce((max, item) => Math.max(max, item.id || 0), 0);

  return {
    id: String(dataset.id || `dataset_${fallbackIndex}`),
    name: String(dataset.name || `Dataset ${fallbackIndex + 1}`).trim() || `Dataset ${fallbackIndex + 1}`,
    items,
    currentId: Math.max(Number(dataset.currentId) || 0, maxId + 1),
    history: Array.isArray(dataset.history) ? dataset.history : [],
  };
}

export function loadAppState(storage: Storage | undefined = globalThis.localStorage): AppState {
  if (!storage) return createInitialState();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const stored = JSON.parse(raw) as StoredState;
    const datasets = Array.isArray(stored.datasets)
      ? stored.datasets.map((dataset, index) => normalizeDataset(dataset, index))
      : [];

    if (!datasets.length) return createInitialState();

    const activeDatasetId = datasets.some((dataset) => dataset.id === stored.activeDatasetId)
      ? String(stored.activeDatasetId)
      : datasets[0].id;

    return {
      datasets,
      activeDatasetId,
      filterTags: [],
      winner: null,
    };
  } catch {
    return createInitialState(makeDataset('Default'));
  }
}

export function saveAppState(state: AppState, storage: Storage | undefined = globalThis.localStorage) {
  if (!storage) return;
  const payload: StoredState = {
    datasets: state.datasets,
    activeDatasetId: state.activeDatasetId,
  };
  storage.setItem(STORAGE_KEY, JSON.stringify(payload));
}
