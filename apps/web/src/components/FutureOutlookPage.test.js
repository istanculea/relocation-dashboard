import { describe, expect, it } from 'vitest';
import { getIndicatorForecastForYear, summarizeOutlookRow } from './FutureOutlookPage.jsx';

describe('FutureOutlookPage helpers', () => {
  const baseIndicator = {
    indicatorKey: 'healthcareResilience',
    current: 6.4,
    trend: 'improving',
    confidence: 0.78,
    forecast: [
      { year: 2026, value: 6.4, lower: 6.0, upper: 6.8 },
      { year: 2027, value: 6.6, lower: 6.2, upper: 7.0 },
      { year: 2028, value: 6.9, lower: 6.5, upper: 7.3 },
    ],
  };

  it('returns the selected forecast year and applies shock adjustment', () => {
    const projection = getIndicatorForecastForYear(baseIndicator, 2028, 'healthcareOverload', 1.5);

    expect(projection.year).toBe(2028);
    expect(projection.shockAdjustment).toBe(-1.65);
    expect(projection.value).toBe(5.25);
  });

  it('summarizes a row using the selected year instead of the final forecast only', () => {
    const row = {
      key: 'test-city',
      indicators: [
        baseIndicator,
        {
          indicatorKey: 'familyReadiness',
          current: 7.1,
          trend: 'stable',
          confidence: 0.66,
          forecast: [
            { year: 2026, value: 7.1, lower: 6.7, upper: 7.5 },
            { year: 2027, value: 7.1, lower: 6.7, upper: 7.5 },
            { year: 2028, value: 7.2, lower: 6.8, upper: 7.6 },
          ],
        },
      ],
    };

    const summary = summarizeOutlookRow(row, 2027, 'none', 1);

    expect(summary.averageProjected).toBe(6.85);
    expect(summary.delta).toBe(0.1);
    expect(summary.projectedIndicators).toHaveLength(2);
  });
});