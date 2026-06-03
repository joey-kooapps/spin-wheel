import { describe, expect, it } from 'vitest';
import { pickWinnerByAngle } from './wheel';

const items = [
  { id: 1, name: 'Alpha', tags: [], weight: 1 },
  { id: 2, name: 'Beta', tags: [], weight: 3 },
];

describe('wheel utilities', () => {
  it('maps rotation angle to the weighted segment at the pointer', () => {
    expect(pickWinnerByAngle(items, 0, [])?.item.name).toBe('Alpha');
    expect(pickWinnerByAngle(items, -Math.PI, ['final'])?.item.name).toBe('Beta');
  });

  it('returns null for an empty pool', () => {
    expect(pickWinnerByAngle([], 0, [])).toBeNull();
  });
});
