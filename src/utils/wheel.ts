import type { WheelItem, WinnerResult } from '../types';
import { sanitizeWeight } from './data';

const TWO_PI = Math.PI * 2;

export const wheelPalette = [
  '#41d1ff',
  '#bd34fe',
  '#ffea83',
  '#7cffc4',
  '#ff7ad9',
  '#ff9f43',
  '#6c8cff',
  '#f85f73',
  '#35f2cf',
  '#c8ff5f',
];

export function normalizeAngle(angle: number) {
  return ((angle % TWO_PI) + TWO_PI) % TWO_PI;
}

export function segmentColor(index: number, total: number) {
  if (total <= wheelPalette.length) return wheelPalette[index % wheelPalette.length];
  return `hsl(${(index * 137.508) % 360} 86% 66%)`;
}

export function pickWinnerByAngle(
  visibleItems: WheelItem[],
  rotationAngle: number,
  filterTags: string[],
): WinnerResult | null {
  if (!visibleItems.length) return null;

  const weights = visibleItems.map((item) => sanitizeWeight(item.weight, 1));
  const totalWeight = weights.reduce((total, weight) => total + weight, 0);
  if (totalWeight <= 0) return null;

  const localAngle = normalizeAngle(-rotationAngle);
  let cursor = 0;

  for (let index = 0; index < visibleItems.length; index += 1) {
    const span = TWO_PI * (weights[index] / totalWeight);
    if (localAngle >= cursor && localAngle < cursor + span) {
      return {
        item: visibleItems[index],
        poolCount: visibleItems.length,
        totalWeight,
        filteredBy: [...filterTags],
      };
    }
    cursor += span;
  }

  return {
    item: visibleItems[visibleItems.length - 1],
    poolCount: visibleItems.length,
    totalWeight,
    filteredBy: [...filterTags],
  };
}
