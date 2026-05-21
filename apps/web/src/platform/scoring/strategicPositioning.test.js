import { describe, expect, it } from 'vitest';
import { buildRanking } from '../../relocationData.js';
import { buildStrategicPositioning } from './strategicPositioning.js';

describe('buildStrategicPositioning', () => {
  it('extracts strengths and tradeoffs from strategic balance pillars', () => {
    const row = buildRanking('balanced', 'oneParent')[0];
    const positioning = buildStrategicPositioning(row);

    expect(positioning.cityId).toBe(row.key);
    expect(positioning.strengths.length).toBeGreaterThan(0);
    expect(positioning.tradeoffs.length).toBeGreaterThan(0);
  });
});
