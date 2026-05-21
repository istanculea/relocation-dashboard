import { describe, expect, it } from 'vitest';
import {
  matchesBudgetFilter,
  matchesVerificationFilter,
  sortRows,
} from './comparisonFilters.js';

const buildRow = (overrides = {}) => ({
  activeWeightedScore: 7,
  city: 'Alpha',
  city360: {
    ecoFactors: 'AQI peaks around 160 with cleaner weeks around 110.',
    fifteenMinute: 'Yes',
  },
  hasOfficialChildcareTariff: false,
  maxAqi: 160,
  mobility: {
    carNeed: 'Low',
  },
  scenarioBudget: 3200,
  verifiedChildcare: null,
  verifiedCount: 2,
  ...overrides,
});

describe('comparisonFilters', () => {
  it('matches the expected budget bands and official verification flag', () => {
    expect(matchesBudgetFilter(buildRow({ scenarioBudget: 3000 }), 'under3000')).toBe(true);
    expect(matchesBudgetFilter(buildRow({ scenarioBudget: 4000 }), 'between3000And4000')).toBe(true);
    expect(matchesVerificationFilter(buildRow({ hasOfficialChildcareTariff: true }), 'officialBands')).toBe(true);
    expect(matchesVerificationFilter(buildRow({ verifiedCount: 4 }), 'highCoverage')).toBe(true);
  });

  it('sorts air-first rows by lower AQI before score', () => {
    const sorted = sortRows([
      buildRow({ city: 'Bravo', activeWeightedScore: 9.4, maxAqi: 170 }),
      buildRow({ city: 'Alpha', activeWeightedScore: 7.1, maxAqi: 120 }),
      buildRow({ city: 'Charlie', activeWeightedScore: 8.3, maxAqi: 150 }),
    ], 'air');

    expect(sorted.map((row) => row.city)).toEqual(['Alpha', 'Charlie', 'Bravo']);
    expect(sorted.map((row) => row.filteredRank)).toEqual([1, 2, 3]);
  });
});