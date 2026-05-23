import { describe, expect, it } from 'vitest';
import { DEFAULT_HOUSEHOLD_PROFILE } from '../data/dashboardConfig.js';
import {
  addScenarioLabRun,
  buildEvidenceCenterExportBlock,
  buildDashboardShareState,
  deleteScenarioLabRunById,
  findScenarioLabRunById,
  hydrateScenarioLabStateFromRun,
  inferEvidenceRiskTier,
  isDefaultDashboardShareState,
  readDashboardShareState,
  resolveMobilityMapForPage,
} from './useDashboardOrchestration.js';

describe('resolveMobilityMapForPage', () => {
  it('maps explorer route to reach layer', () => {
    expect(resolveMobilityMapForPage('explorer')).toBe('reach');
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
      householdProfile: {
        ...DEFAULT_HOUSEHOLD_PROFILE,
        kidsCount: 2,
        hasPets: true,
        remoteWorkRatio: 0.7,
      },
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
      mapMode: 'careerAcceleration',
      mapPersona: 'startupFounder',
      mapComparisonCity: 'bologna-it',
      mapNeighborCount: 5,
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
      mapMode: 'careerAcceleration',
      mapPersona: 'startupFounder',
      mapComparisonCity: 'bologna-it',
      mapNeighborCount: 5,
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
      householdProfile: {
        ...DEFAULT_HOUSEHOLD_PROFILE,
        kidsCount: 2,
        hasPets: true,
        remoteWorkRatio: 0.7,
      },
    });
  });

  it('detects baseline share payload for clean URL mode', () => {
    const baseline = buildDashboardShareState({
      page: 'map',
      lensKey: 'balanced',
      scenarioKey: 'oneParent',
      householdProfile: DEFAULT_HOUSEHOLD_PROFILE,
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
      mapMode: 'familyStability',
      mapPersona: 'internationalFamily',
      mapComparisonCity: '',
      mapNeighborCount: 3,
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
      householdProfile: DEFAULT_HOUSEHOLD_PROFILE,
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
      mapMode: 'familyStability',
      mapPersona: 'internationalFamily',
      mapComparisonCity: '',
      mapNeighborCount: 3,
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
    expect(isDefaultDashboardShareState({ ...explorerBaseline, mapMode: 'careerAcceleration' })).toBe(false);
    expect(isDefaultDashboardShareState({ ...explorerBaseline, mapNeighborCount: 5 })).toBe(false);
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
      mapMode: 7,
      mapPersona: null,
      mapComparisonCity: 5,
      mapNeighborCount: 9,
    });

    expect(normalized).toEqual({
      page: 'map',
      lens: 'balanced',
      scenario: 'oneParent',
      householdProfile: {
        kidsCount: 1,
        hasPets: false,
        remoteWorkRatio: 0.35,
        languageLevel: 'intermediate',
        budgetSensitivity: 'balanced',
        commuteTolerance: 'moderate',
        riskAppetite: 'balanced',
      },
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
      mapMode: 'familyStability',
      mapPersona: 'internationalFamily',
      mapComparisonCity: '',
      mapNeighborCount: 3,
    });
  });

  it('normalizes unsupported pages to map', () => {
    expect(readDashboardShareState({ page: 'outlook' }).page).toBe('map');
    expect(readDashboardShareState({ page: 'family-fit' }).page).toBe('map');
  });

  it('derives household profile from legacy scenario-only payloads', () => {
    const normalized = readDashboardShareState({ scenario: 'twoKids' });

    expect(normalized.scenario).toBe('twoKids');
    expect(normalized.householdProfile.kidsCount).toBe(2);
    expect(normalized.householdProfile.remoteWorkRatio).toBe(0.6);
  });
});

describe('scenario lab run orchestration helpers', () => {
  it('adds a run at the top and keeps newest first', () => {
    const existing = [
      { id: 'run-a', name: 'A' },
      { id: 'run-b', name: 'B' },
    ];
    const next = { id: 'run-c', name: 'C' };

    expect(addScenarioLabRun(existing, next).map((run) => run.id)).toEqual(['run-c', 'run-a', 'run-b']);
  });

  it('loads/deletes run records by id', () => {
    const runs = [
      { id: 'run-a', name: 'A', selectedCityKey: 'vienna-at', selectedYear: 2028, shockType: 'none', shockSeverity: 1 },
      { id: 'run-b', name: 'B', selectedCityKey: 'milan-it', selectedYear: 2029, shockType: 'heatwave', shockSeverity: 1.4 },
    ];

    expect(findScenarioLabRunById(runs, 'run-b')?.name).toBe('B');
    expect(findScenarioLabRunById(runs, 'missing')).toBeNull();
    expect(deleteScenarioLabRunById(runs, 'run-a').map((run) => run.id)).toEqual(['run-b']);
  });

  it('hydrates scenario state from a saved run snapshot', () => {
    const hydrated = hydrateScenarioLabStateFromRun({
      id: 'run-z',
      selectedCityKey: 'vienna-at',
      selectedYear: 2030,
      shockType: 'railStrike',
      shockSeverity: 1.3,
    });

    expect(hydrated).toEqual({
      selectedCityKey: 'vienna-at',
      selectedYear: 2030,
      shockType: 'railStrike',
      shockSeverity: 1.3,
    });
  });
});

describe('evidence center export helpers', () => {
  it('builds exact evidenceCenter export block shape for selected city', () => {
    const selectedCity = {
      key: 'vienna-at',
      verificationProfile: {
        confidence: 0.81,
        evidenceClass: 'sourceBacked',
        sourceCount: 9,
        sourceDiversityScore: 0.75,
        freshnessDays: 42,
        freshnessDecay: 0.92,
      },
    };

    expect(buildEvidenceCenterExportBlock(selectedCity)).toEqual({
      selectedCityKey: 'vienna-at',
      confidence: 0.81,
      evidenceClass: 'sourceBacked',
      sourceCount: 9,
      sourceDiversityScore: 0.75,
      freshnessDays: 42,
      freshnessDecay: 0.92,
      riskTier: 'low',
    });
  });

  it('maps risk tier thresholds for low, medium, and high evidence risk', () => {
    expect(inferEvidenceRiskTier({ confidence: 0.8, freshnessDays: 120 })).toBe('low');
    expect(inferEvidenceRiskTier({ confidence: 0.6, freshnessDays: 320 })).toBe('medium');
    expect(inferEvidenceRiskTier({ confidence: 0.4, freshnessDays: 600 })).toBe('high');
  });
});