import { describe, expect, it } from 'vitest';
import { getVisibleItems, normalizeImportedDataset, parseTags, sanitizeWeight } from './data';

describe('data utilities', () => {
  it('parses and de-duplicates tags case-insensitively', () => {
    expect(parseTags('Alpha, beta, alpha,  Beta ')).toEqual(['Alpha', 'beta']);
  });

  it('sanitizes weights to a positive fallback', () => {
    expect(sanitizeWeight('2.5')).toBe(2.5);
    expect(sanitizeWeight(0, 1)).toBe(1);
    expect(sanitizeWeight('nope', 3)).toBe(3);
  });

  it('filters items by requiring every active tag', () => {
    const items = [
      { id: 1, name: 'One', tags: ['Team', 'Prize'], weight: 1 },
      { id: 2, name: 'Two', tags: ['Team'], weight: 1 },
    ];

    expect(getVisibleItems(items, ['team', 'prize']).map((item) => item.name)).toEqual(['One']);
  });

  it('normalizes current import/export compatible dataset JSON', () => {
    const dataset = normalizeImportedDataset('choices.json', {
      currentId: 8,
      items: [{ id: 3, name: 'Prize', tags: ['A'], weight: '2' }],
    });

    expect(dataset?.name).toBe('choices');
    expect(dataset?.currentId).toBe(8);
    expect(dataset?.items[0]).toEqual({ id: 3, name: 'Prize', tags: ['A'], weight: 2 });
  });
});
