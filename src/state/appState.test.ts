import { describe, expect, it } from 'vitest';
import { appReducer, createInitialState, getActiveDataset } from './appState';
import type { Dataset, HistoryEntry } from '../types';

const history = (type: HistoryEntry['type'] = 'add_item'): HistoryEntry => ({
  id: `${type}-1`,
  time: 'now',
  type,
  payload: {},
});

const dataset = (id: string, name: string): Dataset => ({
  id,
  name,
  items: [],
  currentId: 1,
  history: [],
});

describe('app reducer', () => {
  it('adds items to the active dataset and records history', () => {
    const state = createInitialState(dataset('a', 'Default'));
    const next = appReducer(state, {
      type: 'add-item',
      item: { id: 1, name: 'Prize', tags: ['A'], weight: 2 },
      history: history(),
    });

    expect(getActiveDataset(next).items).toHaveLength(1);
    expect(getActiveDataset(next).history[0].type).toBe('add_item');
    expect(getActiveDataset(next).currentId).toBe(2);
  });

  it('switches and deletes datasets without leaving an invalid active id', () => {
    const state = {
      ...createInitialState(dataset('a', 'One')),
      datasets: [dataset('a', 'One'), dataset('b', 'Two')],
      activeDatasetId: 'b',
    };

    const next = appReducer(state, { type: 'delete-dataset', datasetId: 'b' });

    expect(next.activeDatasetId).toBe('a');
    expect(next.datasets.map((item) => item.id)).toEqual(['a']);
  });

  it('clears filter and winner together', () => {
    const state = {
      ...createInitialState(dataset('a', 'Default')),
      filterTags: ['a'],
      winner: {
        item: { id: 1, name: 'Prize', tags: [], weight: 1 },
        poolCount: 1,
        totalWeight: 1,
        filteredBy: ['a'],
      },
    };

    const next = appReducer(state, { type: 'clear-filter' });

    expect(next.filterTags).toEqual([]);
    expect(next.winner).toBeNull();
  });
});
