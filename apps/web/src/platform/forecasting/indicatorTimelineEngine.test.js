import { describe, expect, it } from 'vitest';
import { cities } from '../../relocationData.js';
import { buildCityIndicatorTimeline, buildCityTemporalOutlook } from './indicatorTimelineEngine.js';

describe('indicator timeline engine', () => {
  it('builds a timeline with bounded forecast values', () => {
    const timeline = buildCityIndicatorTimeline(cities[0], 'affordabilityPressure');

    expect(timeline.cityId).toBe(cities[0].key);
    expect(timeline.forecast.length).toBe(5);
    expect(timeline.forecast.every((point) => point.value >= 0 && point.value <= 10)).toBe(true);
  });

  it('builds temporal outlook bundle for default indicators', () => {
    const outlook = buildCityTemporalOutlook(cities[0]);

    expect(outlook.length).toBeGreaterThanOrEqual(5);
    expect(outlook[0]).toHaveProperty('indicatorKey');
  });
});
