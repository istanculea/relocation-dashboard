import { describe, expect, it } from 'vitest';
import { buildRanking } from './relocationData.js';

describe('buildRanking', () => {
  it('returns scored cities in descending order with enriched comparison metadata', () => {
    const rows = buildRanking('balanced', 'oneParent');

    expect(rows.length).toBeGreaterThan(5);
    expect(rows[0].activeWeightedScore).toBeGreaterThanOrEqual(rows[rows.length - 1].activeWeightedScore);
    expect(rows.every((row) => Number.isFinite(row.activeWeightedScore))).toBe(true);
    expect(Object.hasOwn(rows[0], 'maxAqi')).toBe(true);
    expect(Object.hasOwn(rows[0], 'hasOfficialChildcareTariff')).toBe(true);
  });
});