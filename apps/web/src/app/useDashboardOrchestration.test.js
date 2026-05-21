import { describe, expect, it } from 'vitest';
import {
  buildDashboardShareState,
  isDefaultDashboardShareState,
  readDashboardShareState,
  resolveMobilityMapForPage,
} from './useDashboardOrchestration.js';

describe('resolveMobilityMapForPage', () => {
  it('maps explorer route to reach layer', () => {
    expect(resolveMobilityMapForPage('explorer')).toBe('reach');
  });

  it('maps outlook and family-fit routes to reach layer', () => {
    expect(resolveMobilityMapForPage('outlook')).toBe('reach');
    expect(resolveMobilityMapForPage('family-fit')).toBe('reach');
  });

  it('maps map route to strategic network layer', () => {
    expect(resolveMobilityMapForPage('map')).toBe('strategicNetwork');
  });

  it('falls back to strategic network for unknown routes', () => {
    expect(resolveMobilityMapForPage('')).toBe('strategicNetwork');
    expect(resolveMobilityMapForPage('dashboard')).toBe('strategicNetwork');
  });

  it('builds share payload with mobility controls', () => {
    const shareState = buildDashboardShareState({
      page: 'map',
      lensKey: 'balanced',
      scenarioKey: 'oneParent',
      selectedCityKey: 'vienna-at',
      selectedYear: 2026,
      sortKey: 'score',
      verificationFilter: 'all',
      budgetFilter: 'all',
      mobilityFilter: 'all',
      airFilter: 'all',
      searchValue: 'vienna',
      shockType: 'heatwave',
      shockSeverity: 1.4,
      mobilityState: {
        timeWindowHours: 3,
        layerVisibility: {
          air: true,
          railHighSpeed: true,
          railRegional: false,
          road: false,
          connections: true,
          heat: false,
          isochrones: true,
        },
      },
    });

    expect(shareState).toMatchObject({
      page: 'map',
      city: 'vienna-at',
      year: 2026,
      search: 'vienna',
      shock: 'heatwave',
      shockSeverity: 1.4,
      mWindow: 3,
      mLayers: {
        air: true,
        railHighSpeed: true,
        railRegional: false,
        road: false,
        connections: true,
        heat: false,
        isochrones: true,
      },
    });
  });

  it('detects baseline share payload for clean URL mode', () => {
    const baseline = buildDashboardShareState({
      page: 'map',
      lensKey: 'balanced',
      scenarioKey: 'oneParent',
      selectedCityKey: null,
      selectedYear: 2026,
      sortKey: 'score',
      verificationFilter: 'all',
      budgetFilter: 'all',
      mobilityFilter: 'all',
      airFilter: 'all',
      searchValue: '',
      shockType: 'none',
      shockSeverity: 1,
      mobilityState: {
        timeWindowHours: 6,
        layerVisibility: {
          railHighSpeed: true,
          railRegional: true,
          air: true,
          road: false,
          redundancy: true,
          labels: true,
          connections: true,
          heat: true,
          isochrones: true,
        },
      },
    });

    expect(isDefaultDashboardShareState(baseline)).toBe(true);
    expect(isDefaultDashboardShareState({ ...baseline, search: 'vienna' })).toBe(false);
  });

  it('treats default explorer payload as clean-hash eligible', () => {
    const explorerBaseline = buildDashboardShareState({
      page: 'explorer',
      lensKey: 'balanced',
      scenarioKey: 'oneParent',
      selectedCityKey: null,
      selectedYear: 2026,
      sortKey: 'score',
      verificationFilter: 'all',
      budgetFilter: 'all',
      mobilityFilter: 'all',
      airFilter: 'all',
      searchValue: '',
      shockType: 'none',
      shockSeverity: 1,
      mobilityState: {
        timeWindowHours: 6,
        layerVisibility: {
          railHighSpeed: true,
          railRegional: true,
          air: true,
          road: false,
          redundancy: true,
          labels: true,
          connections: true,
          heat: true,
          isochrones: true,
        },
      },
    });

    expect(isDefaultDashboardShareState(explorerBaseline)).toBe(true);
    expect(isDefaultDashboardShareState({ ...explorerBaseline, city: 'vienna-at' })).toBe(false);
  });

  it('normalizes partial or invalid share payloads', () => {
    const normalized = readDashboardShareState({
      page: 'unknown',
      lens: 'invalidLens',
      scenario: 'invalidScenario',
      city: 77,
      year: 'bad',
      sort: 'bad-sort',
      verification: 'bad-verification',
      budget: 'bad-budget',
      mobility: 'bad-mobility',
      air: 'bad-air',
      search: 42,
      shock: 9,
      shockSeverity: 'bad-value',
    });

    expect(normalized).toEqual({
      page: 'map',
      lens: 'balanced',
      scenario: 'oneParent',
      city: null,
      year: 2026,
      sort: 'score',
      verification: 'all',
      budget: 'all',
      mobility: 'all',
      air: 'all',
      search: '',
      shock: 'none',
      shockSeverity: 1,
    });
  });

  it('accepts normalized outlook and family-fit pages from share payload', () => {
    expect(readDashboardShareState({ page: 'outlook' }).page).toBe('outlook');
    expect(readDashboardShareState({ page: 'family-fit' }).page).toBe('family-fit');
  });
});