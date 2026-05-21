import { describe, expect, it } from 'vitest';
import { buildRanking } from '../../relocationData.js';
import { buildNarrativeBrief } from './narrativeEngine.js';

describe('buildNarrativeBrief', () => {
  it('returns deterministic summary with bounded confidence', () => {
    const row = buildRanking('balanced', 'oneParent')[0];
    const brief = buildNarrativeBrief(row, row.strategicPositioning);

    expect(typeof brief.summary).toBe('string');
    expect(brief.summary.length).toBeGreaterThan(20);
    expect(brief.confidence).toBeGreaterThan(0);
    expect(brief.confidence).toBeLessThanOrEqual(1);
  });
});
