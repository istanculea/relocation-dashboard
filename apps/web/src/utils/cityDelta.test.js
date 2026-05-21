import { describe, expect, it } from 'vitest';
import { buildCityDeltaCards, getMetricDelta } from './cityDelta.js';

const city = {
  trends: [
    { year: 2023, overallScore: 7.1, oneParentBudget: 2700, bothWorkingBudget: 3200, pm25: 16 },
    { year: 2026, overallScore: 7.8, oneParentBudget: 2950, bothWorkingBudget: 3400, pm25: 14 },
  ],
};

describe('cityDelta utilities', () => {
  it('computes metric deltas across first and latest trend year', () => {
    const result = getMetricDelta(city.trends, 'overallScore');

    expect(result).toMatchObject({
      startYear: 2023,
      endYear: 2026,
      previous: 7.1,
      current: 7.8,
    });
    expect(result.delta).toBeCloseTo(0.7, 5);
  });

  it('builds score, budget and pollution delta cards', () => {
    const cards = buildCityDeltaCards(city);

    expect(cards.length).toBeGreaterThanOrEqual(4);
    expect(cards.find((card) => card.key === 'overallScore')?.tone).toBe('positive');
    expect(cards.find((card) => card.key === 'oneParentBudget')?.tone).toBe('negative');
    expect(cards.find((card) => card.key === 'pm25')?.tone).toBe('positive');
  });
});
