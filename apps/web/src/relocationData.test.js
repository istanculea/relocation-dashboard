import { describe, expect, it } from 'vitest';
import { coreCities } from './data/citiesCore';
import { expandedCities } from './data/citiesExpanded';
import cityExpansionWaveSummary from './data/cityExpansionWaveSummary.json';
import { cityCatalog } from './data/cityCatalog.js';
import { buildRanking, buildTemporalOutlookRows, cities, spatialHierarchy } from './relocationData.js';

describe('buildRanking', () => {
  it('returns scored cities in descending order with enriched comparison metadata', () => {
    const rows = buildRanking('balanced', 'oneParent');

    expect(rows.length).toBeGreaterThan(5);
    expect(rows[0].activeWeightedScore).toBeGreaterThanOrEqual(rows[rows.length - 1].activeWeightedScore);
    expect(rows.every((row) => Number.isFinite(row.activeWeightedScore))).toBe(true);
    expect(Object.hasOwn(rows[0], 'maxAqi')).toBe(true);
    expect(Object.hasOwn(rows[0], 'hasOfficialChildcareTariff')).toBe(true);
    expect(Object.hasOwn(rows[0], 'strategicPositioning')).toBe(true);
    expect(Object.hasOwn(rows[0], 'narrativeBrief')).toBe(true);
  });

  it('imports every city from core, expanded, and expansion wave sources', () => {
    const expectedKeys = [
      ...coreCities,
      ...expandedCities,
      ...(cityExpansionWaveSummary.cities ?? []),
    ]
      .map((city) => city.key)
      .sort();
    const importedKeys = cities
      .map((city) => city.key)
      .sort();

    expect(importedKeys).toEqual(expectedKeys);
    expect(importedKeys.length).toBe(28);
  });

  it('keeps city catalog keys unique', () => {
    const allKeys = cityCatalog.map((city) => city.key);
    const uniqueKeys = new Set(allKeys);

    expect(uniqueKeys.size).toBe(allKeys.length);
  });

  it('provides spatial hierarchy and temporal outlook surfaces', () => {
    expect(spatialHierarchy.continent.id).toBe('europe');
    expect(spatialHierarchy.cityNodes.length).toBe(cities.length);

    const outlookRows = buildTemporalOutlookRows();
    expect(outlookRows.length).toBe(cities.length);
    expect(outlookRows[0].indicators.length).toBeGreaterThan(0);
  });
});