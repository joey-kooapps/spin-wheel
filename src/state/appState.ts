import type { AppState, Dataset, HistoryEntry, WheelItem, WinnerResult } from '../types';
import { makeDataset } from '../utils/data';

export type AppAction =
  | { type: 'set-active-dataset'; datasetId: string }
  | { type: 'add-dataset'; dataset: Dataset }
  | { type: 'rename-dataset'; datasetId: string; name: string }
  | { type: 'delete-dataset'; datasetId: string }
  | { type: 'import-dataset'; dataset: Dataset; history: HistoryEntry }
  | { type: 'add-item'; item: WheelItem; history: HistoryEntry }
  | { type: 'update-item'; itemId: number; changes: Partial<WheelItem>; history?: HistoryEntry }
  | { type: 'delete-item'; itemId: number; history: HistoryEntry }
  | { type: 'set-filter-tags'; tags: string[] }
  | { type: 'clear-filter' }
  | { type: 'record-history'; history: HistoryEntry }
  | { type: 'record-spin'; winner: WinnerResult; history: HistoryEntry }
  | { type: 'clear-history' }
  | { type: 'clear-winner' };

export function createInitialState(dataset = makeDataset()): AppState {
  return {
    datasets: [dataset],
    activeDatasetId: dataset.id,
    filterTags: [],
    winner: null,
  };
}

export function getActiveDataset(state: AppState) {
  return state.datasets.find((dataset) => dataset.id === state.activeDatasetId) || state.datasets[0];
}

function updateDataset(state: AppState, datasetId: string, updater: (dataset: Dataset) => Dataset): AppState {
  return {
    ...state,
    datasets: state.datasets.map((dataset) => (dataset.id === datasetId ? updater(dataset) : dataset)),
  };
}

function updateActiveDataset(state: AppState, updater: (dataset: Dataset) => Dataset): AppState {
  const activeDataset = getActiveDataset(state);
  return updateDataset(state, activeDataset.id, updater);
}

function appendHistory(dataset: Dataset, history?: HistoryEntry) {
  return history ? { ...dataset, history: [history, ...dataset.history] } : dataset;
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'set-active-dataset':
      if (!state.datasets.some((dataset) => dataset.id === action.datasetId)) return state;
      return { ...state, activeDatasetId: action.datasetId, winner: null };

    case 'add-dataset':
      return {
        ...state,
        datasets: [action.dataset, ...state.datasets],
        activeDatasetId: action.dataset.id,
        filterTags: [],
        winner: null,
      };

    case 'rename-dataset':
      return updateDataset(state, action.datasetId, (dataset) => ({
        ...dataset,
        name: action.name.trim() || 'Untitled',
      }));

    case 'delete-dataset': {
      const remaining = state.datasets.filter((dataset) => dataset.id !== action.datasetId);
      const datasets = remaining.length ? remaining : [makeDataset()];
      return {
        ...state,
        datasets,
        activeDatasetId:
          state.activeDatasetId === action.datasetId ? datasets[0].id : state.activeDatasetId,
        winner: null,
      };
    }

    case 'import-dataset':
      return {
        ...state,
        datasets: [{ ...action.dataset, history: [action.history] }, ...state.datasets],
        activeDatasetId: action.dataset.id,
        filterTags: [],
        winner: null,
      };

    case 'add-item':
      return updateActiveDataset(
        { ...state, winner: null },
        (dataset) => ({
          ...appendHistory(dataset, action.history),
          items: [...dataset.items, action.item],
          currentId: Math.max(dataset.currentId, action.item.id + 1),
        }),
      );

    case 'update-item':
      return updateActiveDataset(
        { ...state, winner: null },
        (dataset) =>
          appendHistory(
            {
              ...dataset,
              items: dataset.items.map((item) =>
                item.id === action.itemId ? { ...item, ...action.changes } : item,
              ),
            },
            action.history,
          ),
      );

    case 'delete-item':
      return updateActiveDataset(
        { ...state, winner: null },
        (dataset) =>
          appendHistory(
            {
              ...dataset,
              items: dataset.items.filter((item) => item.id !== action.itemId),
            },
            action.history,
          ),
      );

    case 'set-filter-tags':
      return { ...state, filterTags: action.tags, winner: null };

    case 'clear-filter':
      return { ...state, filterTags: [], winner: null };

    case 'record-history':
      return updateActiveDataset(state, (dataset) => appendHistory(dataset, action.history));

    case 'record-spin':
      return updateActiveDataset(
        { ...state, winner: action.winner },
        (dataset) => appendHistory(dataset, action.history),
      );

    case 'clear-history':
      return updateActiveDataset(state, (dataset) => ({ ...dataset, history: [] }));

    case 'clear-winner':
      return { ...state, winner: null };

    default:
      return state;
  }
}
