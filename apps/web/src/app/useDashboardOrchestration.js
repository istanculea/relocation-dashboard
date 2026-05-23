import { startTransition, useEffect, useMemo, useState } from 'react';
import {
  airOptions,
  budgetOptions,
  matchesAirFilter,
  matchesBudgetFilter,
  matchesMobilityFilter,
  matchesVerificationFilter,
  mobilityOptions,
  sortOptions,
  sortRows,
  verificationOptions,
} from '../utils/comparisonFilters.js';
import {
  DEFAULT_HOUSEHOLD_PROFILE,
  deriveScenarioKeyFromHousehold,
  priorityPresets,
  scenarioMeta,
  verificationWindow,
} from '../data/dashboardConfig.js';
import { applySimulationModifiers } from '../utils/simulationModifiers.js';
import { persistStoredValue, readStoredValue } from '../utils/storagePersistence.js';
import { buildHashWithShareState, parseHashLocation, readShareStateFromHash } from '../utils/urlState.js';
import { DEFAULT_SIMULATION_MODIFIERS } from '../application/compare/dashboardState.jsx';
import { buildMobilityShareState, readMobilityShareState } from '../utils/mobilityShareState.js';
import useTokenizedSearch from '../hooks/useTokenizedSearch.js';
import usePillarThresholds from '../hooks/usePillarThresholds.jsx';
import { applyShockToRows, createSimulationShock } from '../../../../packages/simulation/index.js';
import { isBrowser, loadDashboardData, pickAllowed, storageKeys } from './appShellUtils.js';

const MOBILITY_ACTION_TYPES = {
  setSelectedCity: 'SET_SELECTED_CITY',
  setActiveMap: 'SET_ACTIVE_MAP',
  setTimeWindowHours: 'SET_TIME_WINDOW_HOURS',
  setLayerVisibility: 'SET_LAYER_VISIBILITY',
};

export const resolveMobilityMapForPage = (page) => {
  if (page === 'explorer') {
    return 'reach';
  }

  if (page === 'map') {
    return 'strategicNetwork';
  }

  return 'strategicNetwork';
};

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

const SCENARIO_LAB_PRESETS = [
  {
    key: 'baseline-2028',
    label: 'Baseline 2028',
    selectedYear: 2028,
    shockType: 'none',
    shockSeverity: 1,
  },
  {
    key: 'inflation-stress-2029',
    label: 'Inflation Stress 2029',
    selectedYear: 2029,
    shockType: 'inflationWave',
    shockSeverity: 1.4,
  },
  {
    key: 'rail-disruption-2028',
    label: 'Rail Disruption 2028',
    selectedYear: 2028,
    shockType: 'railStrike',
    shockSeverity: 1.3,
  },
  {
    key: 'heatwave-2030',
    label: 'Heatwave 2030',
    selectedYear: 2030,
    shockType: 'heatwave',
    shockSeverity: 1.5,
  },
];

const MAX_SCENARIO_LAB_RUNS = 8;

const normalizeScenarioLabRun = (run) => {
  if (!run || typeof run !== 'object') {
    return null;
  }

  const id = typeof run.id === 'string' && run.id.length > 0
    ? run.id
    : null;
  const selectedYear = clampNumber(Number(run.selectedYear) || 2028, 2026, 2031);
  const shockSeverity = clampNumber(Number(run.shockSeverity) || 1, 0.5, 2);
  const name = typeof run.name === 'string' && run.name.trim().length > 0
    ? run.name.trim().slice(0, 80)
    : null;

  if (!id) {
    return null;
  }

  return {
    id,
    name,
    selectedCityKey: typeof run.selectedCityKey === 'string' ? run.selectedCityKey : null,
    selectedYear,
    shockType: typeof run.shockType === 'string' ? run.shockType : 'none',
    shockSeverity,
    createdAt: typeof run.createdAt === 'string' ? run.createdAt : new Date(0).toISOString(),
  };
};

const formatScenarioLabRunName = ({ selectedCityKey, selectedYear, shockType, shockSeverity }) => {
  const cityLabel = selectedCityKey || 'focus-city';
  if (shockType === 'none') {
    return `${cityLabel} · ${selectedYear} baseline`;
  }
  return `${cityLabel} · ${selectedYear} ${shockType} x${shockSeverity.toFixed(1)}`;
};

export const inferEvidenceRiskTier = (verificationProfile) => {
  const confidence = verificationProfile?.confidence ?? 0;
  const freshnessDays = verificationProfile?.freshnessDays ?? 365;

  if (confidence >= 0.75 && freshnessDays <= 180) {
    return 'low';
  }

  if (confidence >= 0.55 && freshnessDays <= 365) {
    return 'medium';
  }

  return 'high';
};

export const buildEvidenceCenterExportBlock = (selectedCity) => ({
  selectedCityKey: selectedCity?.key ?? null,
  confidence: selectedCity?.verificationProfile?.confidence ?? null,
  evidenceClass: selectedCity?.verificationProfile?.evidenceClass ?? null,
  sourceCount: selectedCity?.verificationProfile?.sourceCount ?? 0,
  sourceDiversityScore: selectedCity?.verificationProfile?.sourceDiversityScore ?? null,
  freshnessDays: selectedCity?.verificationProfile?.freshnessDays ?? null,
  freshnessDecay: selectedCity?.verificationProfile?.freshnessDecay ?? null,
  riskTier: inferEvidenceRiskTier(selectedCity?.verificationProfile),
});

export const addScenarioLabRun = (previousRuns, nextRun) => [nextRun, ...previousRuns].slice(0, MAX_SCENARIO_LAB_RUNS);

export const deleteScenarioLabRunById = (previousRuns, runId) => previousRuns.filter((run) => run.id !== runId);

export const findScenarioLabRunById = (runs, runId) => runs.find((run) => run.id === runId) ?? null;

export const hydrateScenarioLabStateFromRun = (run) => {
  if (!run) {
    return null;
  }

  return {
    selectedCityKey: run.selectedCityKey,
    selectedYear: run.selectedYear,
    shockType: run.shockType,
    shockSeverity: run.shockSeverity,
  };
};

const normalizeHouseholdProfile = (profile) => {
  const source = profile && typeof profile === 'object' ? profile : {};

  return {
    kidsCount: clampNumber(Number(source.kidsCount) || DEFAULT_HOUSEHOLD_PROFILE.kidsCount, 0, 4),
    hasPets: Boolean(source.hasPets),
    remoteWorkRatio: clampNumber(Number(source.remoteWorkRatio) || DEFAULT_HOUSEHOLD_PROFILE.remoteWorkRatio, 0, 1),
    languageLevel: ['beginner', 'intermediate', 'fluent'].includes(source.languageLevel)
      ? source.languageLevel
      : DEFAULT_HOUSEHOLD_PROFILE.languageLevel,
    budgetSensitivity: ['strict', 'balanced', 'flexible'].includes(source.budgetSensitivity)
      ? source.budgetSensitivity
      : DEFAULT_HOUSEHOLD_PROFILE.budgetSensitivity,
    commuteTolerance: ['low', 'moderate', 'high'].includes(source.commuteTolerance)
      ? source.commuteTolerance
      : DEFAULT_HOUSEHOLD_PROFILE.commuteTolerance,
    riskAppetite: ['low', 'balanced', 'high'].includes(source.riskAppetite)
      ? source.riskAppetite
      : DEFAULT_HOUSEHOLD_PROFILE.riskAppetite,
  };
};

const deriveHouseholdProfileFromScenario = (scenarioKey) => {
  switch (scenarioKey) {
    case 'bothWorking':
      return { ...DEFAULT_HOUSEHOLD_PROFILE, kidsCount: 1, remoteWorkRatio: 0.65 };
    case 'twoKids':
      return { ...DEFAULT_HOUSEHOLD_PROFILE, kidsCount: 2, remoteWorkRatio: 0.6 };
    case 'oneIncTwoKids':
      return { ...DEFAULT_HOUSEHOLD_PROFILE, kidsCount: 2, remoteWorkRatio: 0.35 };
    case 'oneParent':
    default:
      return { ...DEFAULT_HOUSEHOLD_PROFILE, kidsCount: 1, remoteWorkRatio: 0.35 };
  }
};

const buildPillarScoreAccessor = (row) => {
  const pillars = new Map((row.strategicBalance?.pillars ?? []).map((pillar) => [pillar.key, pillar.score]));
  return (pillarKey) => pillars.get(pillarKey) ?? 5;
};

const computeKidsDelta = (profile, scoreOf) => (
  profile.kidsCount >= 2
    ? (scoreOf('childcareEducation') - 5) * 0.08
    : 0
);

const computePetsDelta = (profile, scoreOf) => (
  profile.hasPets
    ? ((scoreOf('envPollution') - 5) * 0.04) + ((scoreOf('socialCapital') - 5) * 0.03)
    : 0
);

const computeRemoteDelta = (profile, scoreOf) => (
  profile.remoteWorkRatio * (((scoreOf('economyJobsTaxes') - 5) * 0.06) + ((scoreOf('socialCapital') - 5) * 0.04))
);

const computeLanguageDelta = (profile, scoreOf) => {
  const languageAdjustments = {
    beginner: (scoreOf('euRegistration') - 5) * 0.05,
    fluent: (scoreOf('socialCapital') - 5) * 0.03,
  };

  return languageAdjustments[profile.languageLevel] ?? 0;
};

const computeCommuteDelta = (profile, scoreOf) => {
  const commuteAdjustments = {
    low: (scoreOf('mobilityLogistics') - 5) * 0.07,
    high: (scoreOf('locationInfra') - 5) * 0.03,
  };

  return commuteAdjustments[profile.commuteTolerance] ?? 0;
};

const computeRiskDelta = (profile, scoreOf) => {
  const riskAdjustments = {
    low: ((scoreOf('criminalityStreetSafe') - 5) * 0.07) + ((scoreOf('climateResilience') - 5) * 0.04),
    high: (scoreOf('economyJobsTaxes') - 5) * 0.03,
  };

  return riskAdjustments[profile.riskAppetite] ?? 0;
};

const computeBudgetSensitivityDelta = (profile, scenarioBudget) => {
  if (!Number.isFinite(scenarioBudget)) {
    return 0;
  }

  const budgetAdjustments = {
    strict: clampNumber((3000 - scenarioBudget) / 900, -0.45, 0.45),
    flexible: clampNumber((scenarioBudget - 3200) / 1200, -0.2, 0.2),
  };

  return budgetAdjustments[profile.budgetSensitivity] ?? 0;
};

const applyHouseholdProfileToScore = (row, profile, scenarioBudget) => {
  const normalized = normalizeHouseholdProfile(profile);
  const scoreOf = buildPillarScoreAccessor(row);

  const delta = computeKidsDelta(normalized, scoreOf)
    + computePetsDelta(normalized, scoreOf)
    + computeRemoteDelta(normalized, scoreOf)
    + computeLanguageDelta(normalized, scoreOf)
    + computeCommuteDelta(normalized, scoreOf)
    + computeRiskDelta(normalized, scoreOf)
    + computeBudgetSensitivityDelta(normalized, scenarioBudget);

  return clampNumber(row.activeWeightedScore + delta, 1, 10);
};

export const buildDashboardShareState = ({
  page,
  lensKey,
  scenarioKey,
  householdProfile,
  selectedCityKey,
  selectedYear,
  sortKey,
  verificationFilter,
  budgetFilter,
  mobilityFilter,
  airFilter,
  searchValue,
  shockType,
  shockSeverity,
  mapMode,
  mapPersona,
  mapComparisonCity,
  mapNeighborCount,
  mobilityState,
}) => {
  const normalizedHouseholdProfile = normalizeHouseholdProfile(householdProfile);
  const normalizedScenarioKey = scenarioKey ?? deriveScenarioKeyFromHousehold(normalizedHouseholdProfile);

  return {
    page,
    lens: lensKey,
    scenario: normalizedScenarioKey,
    householdProfile: normalizedHouseholdProfile,
    city: selectedCityKey,
    year: selectedYear,
    sort: sortKey,
    verification: verificationFilter,
    budget: budgetFilter,
    mobility: mobilityFilter,
    air: airFilter,
    search: searchValue,
    shock: shockType,
    shockSeverity,
    mapMode,
    mapPersona,
    mapComparisonCity,
    mapNeighborCount,
    ...buildMobilityShareState({
      timeWindowHours: mobilityState?.timeWindowHours,
      layerVisibility: mobilityState?.layerVisibility,
    }),
  };
};

export const isDefaultDashboardShareState = (shareState) => {
  if (!shareState || typeof shareState !== 'object') {
    return true;
  }

  const matchesOptionalString = (value, expected) => value == null || value === expected;
  const matchesOptionalNumber = (value, expected) => value == null || Number(value) === expected;
  const hasAllowedPage = ['', 'map', 'explorer'].includes(shareState.page);
  const hasDefaultHouseholdProfile = JSON.stringify(normalizeHouseholdProfile(shareState.householdProfile))
    === JSON.stringify(normalizeHouseholdProfile(DEFAULT_HOUSEHOLD_PROFILE));

  const defaultMobilityLayers = {
    railHighSpeed: true,
    railRegional: true,
    air: true,
    road: false,
    redundancy: true,
    labels: true,
    connections: true,
    heat: true,
    isochrones: true,
  };
  const hasDefaultLayers = Object.entries(defaultMobilityLayers).every(
    ([key, expected]) => (shareState.mLayers ?? {})[key] === expected,
  );

  const optionalStringDefaults = [
    ['sort', 'score'],
    ['verification', 'all'],
    ['budget', 'all'],
    ['mobility', 'all'],
    ['air', 'all'],
    ['search', ''],
    ['shock', 'none'],
    ['mapMode', 'familyStability'],
    ['mapPersona', 'internationalFamily'],
    ['mapComparisonCity', ''],
  ];
  const optionalNumberDefaults = [
    ['shockSeverity', 1],
    ['mapNeighborCount', 3],
    ['mWindow', 6],
  ];
  const hasDefaultOptionalStrings = optionalStringDefaults.every(
    ([field, expected]) => matchesOptionalString(shareState[field], expected),
  );
  const hasDefaultOptionalNumbers = optionalNumberDefaults.every(
    ([field, expected]) => matchesOptionalNumber(shareState[field], expected),
  );

  return hasAllowedPage
    && shareState.lens === 'balanced'
    && shareState.scenario === 'oneParent'
    && hasDefaultHouseholdProfile
    && shareState.city == null
    && shareState.year === 2026
    && hasDefaultOptionalStrings
    && hasDefaultOptionalNumbers
    && hasDefaultLayers;
};

export const readDashboardShareState = (shareState) => {
  const state = shareState && typeof shareState === 'object' ? shareState : {};

  const page = state.page === ''
    || state.page === 'explorer'
    || state.page === 'map'
    ? state.page
    : 'map';
  const lens = Object.hasOwn(priorityPresets, state.lens) ? state.lens : 'balanced';
  const legacyScenario = Object.hasOwn(scenarioMeta, state.scenario) ? state.scenario : null;
  const householdProfile = normalizeHouseholdProfile(
    state.householdProfile ?? (legacyScenario ? deriveHouseholdProfileFromScenario(legacyScenario) : DEFAULT_HOUSEHOLD_PROFILE),
  );
  const scenario = legacyScenario
    ? state.scenario
    : deriveScenarioKeyFromHousehold(householdProfile);
  const year = /^\d{4}$/.test(String(state.year)) ? Number(state.year) : 2026;

  return {
    page,
    lens,
    scenario,
    householdProfile,
    city: typeof state.city === 'string' ? state.city : null,
    year,
    sort: pickAllowed(state.sort, sortOptions, 'score'),
    verification: pickAllowed(state.verification, verificationOptions, 'all'),
    budget: pickAllowed(state.budget, budgetOptions, 'all'),
    mobility: pickAllowed(state.mobility, mobilityOptions, 'all'),
    air: pickAllowed(state.air, airOptions, 'all'),
    search: typeof state.search === 'string' ? state.search : '',
    shock: typeof state.shock === 'string' ? state.shock : 'none',
    shockSeverity: Number.isFinite(Number(state.shockSeverity)) ? Number(state.shockSeverity) : 1,
    mapMode: typeof state.mapMode === 'string' ? state.mapMode : 'familyStability',
    mapPersona: typeof state.mapPersona === 'string' ? state.mapPersona : 'internationalFamily',
    mapComparisonCity: typeof state.mapComparisonCity === 'string' ? state.mapComparisonCity : '',
    mapNeighborCount: [2, 3, 4, 5].includes(Number(state.mapNeighborCount)) ? Number(state.mapNeighborCount) : 3,
  };
};

export const useDashboardOrchestration = ({
  simulationModifiers,
  mobilityDispatch = () => {},
  mobilityState = null,
}) => {

  const hasActiveSimulationModifiers = Object.keys(simulationModifiers).some(
    (key) => simulationModifiers[key] !== (DEFAULT_SIMULATION_MODIFIERS[key] ?? 0),
  );

  const {
    searchValue,
    setSearchValue,
    matchesSearch,
  } = useTokenizedSearch();

  const {
    thresholds,
    setThreshold,
    resetThresholds,
    matchesThresholds,
    hasActiveThresholds,
  } = usePillarThresholds();

  const [dashboardData, setDashboardData] = useState(null);
  const [dashboardLoadError, setDashboardLoadError] = useState(null);
  const [cityExplorerDetails, setCityExplorerDetails] = useState(() => new Map());

  const initialShareState = useMemo(
    () => (isBrowser ? readShareStateFromHash(window.location.hash) : null),
    [],
  );

  const initialMobilityShareState = useMemo(
    () => readMobilityShareState(initialShareState),
    [initialShareState],
  );

  const [lensKey, setLensKey] = useState(() => {
    if (initialShareState?.lens && Object.hasOwn(priorityPresets, initialShareState.lens)) {
      return initialShareState.lens;
    }

    return readStoredValue(storageKeys.lens, 'balanced', (value) => Object.hasOwn(priorityPresets, value));
  });
  const [householdProfile, setHouseholdProfile] = useState(() => {
    if (initialShareState?.householdProfile) {
      return normalizeHouseholdProfile(initialShareState.householdProfile);
    }

    const stored = readStoredValue(storageKeys.householdProfile, '', (value) => typeof value === 'string');
    if (!stored) {
      return DEFAULT_HOUSEHOLD_PROFILE;
    }

    try {
      return normalizeHouseholdProfile(JSON.parse(stored));
    } catch {
      return DEFAULT_HOUSEHOLD_PROFILE;
    }
  });
  const scenarioKey = useMemo(
    () => deriveScenarioKeyFromHousehold(householdProfile),
    [householdProfile],
  );
  const [selectedCityKey, setSelectedCityKey] = useState(() => initialShareState?.city ?? null);
  const [selectedYear, setSelectedYear] = useState(() => {
    if (initialShareState?.year && /^\d{4}$/.test(String(initialShareState.year))) {
      return Number(initialShareState.year);
    }

    const storedYear = Number(readStoredValue(storageKeys.year, '2026', (value) => /^\d{4}$/.test(value)));

    return Number.isFinite(storedYear) ? storedYear : 2026;
  });
  const [page, setPage] = useState(() => {
    if (!isBrowser) {
      return '';
    }

    if (
      initialShareState?.page === 'explorer'
      || initialShareState?.page === 'map'
    ) {
      return initialShareState.page;
    }

    return parseHashLocation(window.location.hash).route;
  });

  const [sortKey, setSortKey] = useState(() => pickAllowed(initialShareState?.sort, sortOptions, 'score'));
  const [verificationFilter, setVerificationFilter] = useState(() => pickAllowed(initialShareState?.verification, verificationOptions, 'all'));
  const [budgetFilter, setBudgetFilter] = useState(() => pickAllowed(initialShareState?.budget, budgetOptions, 'all'));
  const [mobilityFilter, setMobilityFilter] = useState(() => pickAllowed(initialShareState?.mobility, mobilityOptions, 'all'));
  const [airFilter, setAirFilter] = useState(() => pickAllowed(initialShareState?.air, airOptions, 'all'));
  const [shockType, setShockType] = useState(() => (typeof initialShareState?.shock === 'string' ? initialShareState.shock : 'none'));
  const [shockSeverity, setShockSeverity] = useState(() => (Number.isFinite(Number(initialShareState?.shockSeverity)) ? Number(initialShareState.shockSeverity) : 1));
  const [mapMode, setMapMode] = useState(() => (typeof initialShareState?.mapMode === 'string' ? initialShareState.mapMode : 'familyStability'));
  const [mapPersona, setMapPersona] = useState(() => (typeof initialShareState?.mapPersona === 'string' ? initialShareState.mapPersona : 'internationalFamily'));
  const [mapComparisonCity, setMapComparisonCity] = useState(() => (typeof initialShareState?.mapComparisonCity === 'string' ? initialShareState.mapComparisonCity : ''));
  const [mapNeighborCount, setMapNeighborCount] = useState(() => ([2, 3, 4, 5].includes(Number(initialShareState?.mapNeighborCount)) ? Number(initialShareState.mapNeighborCount) : 3));
  const [savedScenarioLabRuns, setSavedScenarioLabRuns] = useState(() => {
    const stored = readStoredValue(storageKeys.scenarioLabRuns, '[]', (value) => typeof value === 'string');

    try {
      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map(normalizeScenarioLabRun)
        .filter(Boolean)
        .slice(0, MAX_SCENARIO_LAB_RUNS);
    } catch {
      return [];
    }
  });
  const [activeScenarioLabRunId, setActiveScenarioLabRunId] = useState(null);
  const hasActiveSimulation = hasActiveSimulationModifiers || shockType !== 'none';
  const activeScenarioLabRun = useMemo(
    () => findScenarioLabRunById(savedScenarioLabRuns, activeScenarioLabRunId),
    [activeScenarioLabRunId, savedScenarioLabRuns],
  );

  const selectedScenarioLabPresetKey = useMemo(
    () => SCENARIO_LAB_PRESETS.find((preset) => (
      preset.selectedYear === selectedYear
      && preset.shockType === shockType
      && preset.shockSeverity === shockSeverity
    ))?.key ?? 'custom',
    [selectedYear, shockSeverity, shockType],
  );

  const applyScenarioLabPreset = (presetKey) => {
    const preset = SCENARIO_LAB_PRESETS.find((candidate) => candidate.key === presetKey);
    if (!preset) {
      return;
    }

    setSelectedYear(preset.selectedYear);
    setShockType(preset.shockType);
    setShockSeverity(preset.shockSeverity);
    setActiveScenarioLabRunId(null);
  };

  const loadScenarioLabRun = (runId) => {
    const selectedRun = findScenarioLabRunById(savedScenarioLabRuns, runId);
    if (!selectedRun) {
      return;
    }

    const runState = hydrateScenarioLabStateFromRun(selectedRun);
    setSelectedCityKey(runState.selectedCityKey);
    setSelectedYear(runState.selectedYear);
    setShockType(runState.shockType);
    setShockSeverity(runState.shockSeverity);
    setActiveScenarioLabRunId(selectedRun.id);
  };

  const saveScenarioLabRun = (name) => {
    const nextRun = normalizeScenarioLabRun({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      selectedCityKey,
      selectedYear,
      shockType,
      shockSeverity,
      createdAt: new Date().toISOString(),
    });

    if (!nextRun) {
      return;
    }

    const withFallbackName = {
      ...nextRun,
      name: nextRun.name ?? formatScenarioLabRunName(nextRun),
    };

    setSavedScenarioLabRuns((previousRuns) => addScenarioLabRun(previousRuns, withFallbackName));
    setActiveScenarioLabRunId(withFallbackName.id);
  };

  const deleteScenarioLabRun = (runId) => {
    setSavedScenarioLabRuns((previousRuns) => deleteScenarioLabRunById(previousRuns, runId));
    if (activeScenarioLabRunId === runId) {
      setActiveScenarioLabRunId(null);
    }
  };

  const applyMobilityShareState = (shareStatePayload) => {
    const mobilityShareState = readMobilityShareState(shareStatePayload);

    if (!mobilityShareState) {
      mobilityDispatch({ type: 'RESET_MOBILITY_STATE' });
      return;
    }

    if (typeof mobilityShareState.timeWindowHours === 'number') {
      mobilityDispatch({
        type: MOBILITY_ACTION_TYPES.setTimeWindowHours,
        payload: mobilityShareState.timeWindowHours,
      });
    }

    Object.entries(mobilityShareState.layerVisibility).forEach(([key, value]) => {
      mobilityDispatch({
        type: MOBILITY_ACTION_TYPES.setLayerVisibility,
        payload: { key, value },
      });
    });
  };

  const applyDashboardShareState = (shareStatePayload) => {
    const normalized = readDashboardShareState(shareStatePayload);

    setPage(normalized.page);
    setLensKey(normalized.lens);
    setHouseholdProfile(normalized.householdProfile);
    setSelectedCityKey(normalized.city);
    setSelectedYear(normalized.year);
    setSortKey(normalized.sort);
    setVerificationFilter(normalized.verification);
    setBudgetFilter(normalized.budget);
    setMobilityFilter(normalized.mobility);
    setAirFilter(normalized.air);
    setShockType(normalized.shock);
    setShockSeverity(normalized.shockSeverity);
    setMapMode(normalized.mapMode);
    setMapPersona(normalized.mapPersona);
    setMapComparisonCity(normalized.mapComparisonCity);
    setMapNeighborCount(normalized.mapNeighborCount);
    setActiveScenarioLabRunId(null);
    setSearchValue(normalized.search);

    mobilityDispatch({
      type: MOBILITY_ACTION_TYPES.setActiveMap,
      payload: resolveMobilityMapForPage(normalized.page),
    });
    applyMobilityShareState(shareStatePayload);
  };

  const navigateTo = (target) => {
    setPage(target);
    mobilityDispatch({
      type: MOBILITY_ACTION_TYPES.setActiveMap,
      payload: resolveMobilityMapForPage(target),
    });

    if (isBrowser) {
      const shareState = buildDashboardShareState({
        page: target,
        lensKey,
        scenarioKey,
        householdProfile,
        selectedCityKey,
        selectedYear,
        sortKey,
        verificationFilter,
        budgetFilter,
        mobilityFilter,
        airFilter,
        searchValue,
        shockType,
        shockSeverity,
        mapMode,
        mapPersona,
        mapComparisonCity,
        mapNeighborCount,
        mobilityState,
      });
      const hashShareState = isDefaultDashboardShareState(shareState) ? null : shareState;
      window.location.hash = buildHashWithShareState(target, hashShareState);
      window.scrollTo(0, 0);
    }
  };

  const cities = dashboardData?.cities ?? [];
  const benchmarkSources = dashboardData?.benchmarkSources ?? [];
  const buildRankingFn = dashboardData?.buildRanking ?? null;
  const buildTemporalOutlookRowsFn = dashboardData?.buildTemporalOutlookRows ?? null;
  const buildFamilyFitRowsFn = dashboardData?.buildFamilyFitRows ?? null;
  const buildVerifiedSnapshotRowsFn = dashboardData?.buildVerifiedSnapshotRows ?? null;
  const exportStamp = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const comparisonCities = useMemo(() => cities.map((city) => city.city).join(', '), [cities]);

  useEffect(() => {
    if (typeof initialShareState?.search === 'string' && initialShareState.search.length > 0) {
      setSearchValue(initialShareState.search);
    }
  }, [initialShareState?.search, setSearchValue]);

  useEffect(() => {
    if (!isBrowser) {
      return undefined;
    }

    const onHashChange = () => {
      const { route } = parseHashLocation(window.location.hash);
      const sharedPayload = readShareStateFromHash(window.location.hash);

      if (sharedPayload) {
        applyDashboardShareState(sharedPayload);
        return;
      }

      setPage(route);
      mobilityDispatch({
        type: MOBILITY_ACTION_TYPES.setActiveMap,
        payload: resolveMobilityMapForPage(route),
      });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [mobilityDispatch, setSearchValue]);

  useEffect(() => {
    if (!isBrowser) {
      return;
    }

    const shareState = buildDashboardShareState({
      page,
      lensKey,
      scenarioKey,
      householdProfile,
      selectedCityKey,
      selectedYear,
      sortKey,
      verificationFilter,
      budgetFilter,
      mobilityFilter,
      airFilter,
      searchValue,
      shockType,
      shockSeverity,
      mapMode,
      mapPersona,
      mapComparisonCity,
      mapNeighborCount,
      mobilityState,
    });
    const hashShareState = isDefaultDashboardShareState(shareState) ? null : shareState;
    const nextHash = buildHashWithShareState(page, hashShareState);

    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash);
    }
  }, [
    airFilter,
    budgetFilter,
    lensKey,
    mobilityFilter,
    mobilityState,
    page,
    scenarioKey,
    searchValue,
    shockSeverity,
    shockType,
    mapMode,
    mapPersona,
    mapComparisonCity,
    mapNeighborCount,
    householdProfile,
    selectedCityKey,
    selectedYear,
    sortKey,
    verificationFilter,
  ]);

  useEffect(() => {
    if (initialMobilityShareState) {
      applyMobilityShareState(initialShareState);
    }
  }, [initialMobilityShareState, mobilityDispatch]);

  useEffect(() => {
    if (!activeScenarioLabRun) {
      return;
    }

    const isStillMatching = activeScenarioLabRun.selectedCityKey === selectedCityKey
      && activeScenarioLabRun.selectedYear === selectedYear
      && activeScenarioLabRun.shockType === shockType
      && activeScenarioLabRun.shockSeverity === shockSeverity;

    if (!isStillMatching) {
      setActiveScenarioLabRunId(null);
    }
  }, [activeScenarioLabRun, selectedCityKey, selectedYear, shockSeverity, shockType]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const module = await loadDashboardData();

      if (cancelled) {
        return;
      }

      startTransition(() => {
        setDashboardData({
          benchmarkSources: module.benchmarkSources,
          buildRanking: module.buildRanking,
          buildTemporalOutlookRows: module.buildTemporalOutlookRows,
          buildFamilyFitRows: module.buildFamilyFitRows,
          buildVerifiedSnapshotRows: module.buildVerifiedSnapshotRows,
          cities: module.cities,
        });
      });
    })()
      .catch((error) => {
        if (!cancelled) {
          setDashboardLoadError(error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const verifiedSnapshotRows = useMemo(() => {
    if (!buildVerifiedSnapshotRowsFn) {
      return [];
    }

    return buildVerifiedSnapshotRowsFn().sort(
      (left, right) =>
        right.verifiedDetails.length - left.verifiedDetails.length || left.city.localeCompare(right.city),
    );
  }, [buildVerifiedSnapshotRowsFn]);

  const verifiedSnapshotByKey = useMemo(
    () => new Map(verifiedSnapshotRows.map((row) => [row.key, row])),
    [verifiedSnapshotRows],
  );

  const temporalOutlookRows = useMemo(() => {
    if (!buildTemporalOutlookRowsFn) {
      return [];
    }

    return buildTemporalOutlookRowsFn();
  }, [buildTemporalOutlookRowsFn]);

  const temporalOutlookByKey = useMemo(
    () => new Map(temporalOutlookRows.map((row) => [row.key, row.indicators])),
    [temporalOutlookRows],
  );

  const familyFitRows = useMemo(() => {
    if (!buildFamilyFitRowsFn) {
      return [];
    }

    return buildFamilyFitRowsFn();
  }, [buildFamilyFitRowsFn]);

  const familyFitByKey = useMemo(
    () => new Map(familyFitRows.map((row) => [row.key, row])),
    [familyFitRows],
  );

  const scoreRankingRows = useMemo(
    () => {
      if (!buildRankingFn) {
        return [];
      }

      const baseRows = buildRankingFn(lensKey, scenarioKey).map((city) => {
        const verified = verifiedSnapshotByKey.get(city.key);

        const baseRow = {
          ...city,
          activeLens: lensKey,
          auditOverall: city.audit.overall,
          lastReviewed: verified?.lastReviewed ?? city.audit.lastReviewed,
          pm25: city.mobility.pm25,
          primaryCon: city.comparison?.cons?.[0] ?? '',
          primaryPro: city.comparison?.pros?.[0] ?? '',
          scenarioBudget: city.budgets[scenarioKey].midpoint,
          verifiedChildcare: verified?.childcare ?? null,
          verifiedCount: verified?.verifiedDetails.length ?? 0,
          verifiedDetails: verified?.verifiedDetails ?? [],
          verifiedSourceSummary: verified?.verifiedSourceSummary ?? 'None',
          verifiedFamilyBenefits: verified?.familyBenefits ?? null,
          verifiedMobility: verified?.mobility ?? null,
          verificationProfile: verified?.verificationProfile ?? city.verificationProfile,
          verifiedSections: verified?.verifiedSections ?? [],
          strategicBalance: city.strategicBalance,
          temporalOutlook: temporalOutlookByKey.get(city.key) ?? [],
          familyFitProfile: familyFitByKey.get(city.key) ?? null,
        };

        return applySimulationModifiers(baseRow, simulationModifiers, scenarioKey);
      });

      const profileAdjustedRows = baseRows.map((row) => ({
        ...row,
        activeWeightedScore: applyHouseholdProfileToScore(row, householdProfile, row.scenarioBudget),
      }));

      if (shockType !== 'none') {
        const shock = createSimulationShock({ type: shockType, severity: shockSeverity });

        return applyShockToRows(profileAdjustedRows, shock, scenarioKey).map((row) => ({
          ...row,
          activeShock: shock,
          activeWeightedScore: applyHouseholdProfileToScore(row, householdProfile, row.scenarioBudget),
        }));
      }

      return profileAdjustedRows;
    },
    [
      buildFamilyFitRowsFn,
      buildRankingFn,
      buildTemporalOutlookRowsFn,
      familyFitByKey,
      lensKey,
      householdProfile,
      scenarioKey,
      shockSeverity,
      shockType,
      simulationModifiers,
      temporalOutlookByKey,
      verifiedSnapshotByKey,
    ],
  );

  const comparisonRows = useMemo(() => [...scoreRankingRows], [scoreRankingRows]);

  const futureOutlookRows = useMemo(
    () => scoreRankingRows.map((row) => ({
      key: row.key,
      city: row.city,
      country: row.country,
      indicators: row.temporalOutlook ?? [],
    })),
    [scoreRankingRows],
  );

  const familyFitExplorerRows = useMemo(
    () => scoreRankingRows.map((row) => ({
      key: row.key,
      city: row.city,
      country: row.country,
      familyRhythm: row.familyFitProfile?.familyRhythm ?? 5,
      psychologicalRhythm: row.familyFitProfile?.psychologicalRhythm ?? 5,
      environmentalRhythm: row.familyFitProfile?.environmentalRhythm ?? 5,
      narrative: row.familyFitProfile?.narrative ?? row.narrativeBrief?.summary ?? '',
    })),
    [scoreRankingRows],
  );

  const filteredComparisonRows = useMemo(() => {
    const matchingRows = comparisonRows.filter((row) =>
      matchesSearch(row)
        && matchesThresholds(row)
        && matchesVerificationFilter(row, verificationFilter)
        && matchesBudgetFilter(row, budgetFilter)
        && matchesMobilityFilter(row, mobilityFilter)
        && matchesAirFilter(row, airFilter),
    );

    return sortRows(matchingRows, sortKey);
  }, [comparisonRows, matchesSearch, matchesThresholds, simulationModifiers, sortKey, verificationFilter, budgetFilter, mobilityFilter, airFilter]);

  const sortLabel = useMemo(
    () => sortOptions.find((option) => option.key === sortKey)?.label ?? sortOptions[0].label,
    [sortKey],
  );

  const verificationLabel = useMemo(
    () =>
      verificationOptions.find((option) => option.key === verificationFilter)?.label
      ?? verificationOptions[0].label,
    [verificationFilter],
  );

  const budgetLabel = useMemo(
    () => budgetOptions.find((option) => option.key === budgetFilter)?.label ?? budgetOptions[0].label,
    [budgetFilter],
  );

  const mobilityLabel = useMemo(
    () => mobilityOptions.find((option) => option.key === mobilityFilter)?.label ?? mobilityOptions[0].label,
    [mobilityFilter],
  );

  const airLabel = useMemo(
    () => airOptions.find((option) => option.key === airFilter)?.label ?? airOptions[0].label,
    [airFilter],
  );

  const activeFilters = useMemo(
    () =>
      [
        searchValue ? `Search: ${searchValue}` : null,
        sortKey !== 'score' ? sortLabel : null,
        verificationFilter !== 'all' ? verificationLabel : null,
        budgetFilter !== 'all' ? budgetLabel : null,
        mobilityFilter !== 'all' ? mobilityLabel : null,
        airFilter !== 'all' ? airLabel : null,
      ].filter(Boolean),
    [
      airFilter,
      airLabel,
      budgetFilter,
      budgetLabel,
      mobilityFilter,
      mobilityLabel,
      searchValue,
      sortKey,
      sortLabel,
      verificationFilter,
      verificationLabel,
    ],
  );

  const activeFilterSummary = useMemo(
    () => activeFilters.join(' | ') || 'No extra shortlist filters',
    [activeFilters],
  );

  const selectedComparisonCity = useMemo(
    () => filteredComparisonRows.find((row) => row.key === selectedCityKey) ?? filteredComparisonRows[0] ?? null,
    [filteredComparisonRows, selectedCityKey],
  );

  const selectedCity = useMemo(
    () => {
      if (!filteredComparisonRows.length) {
        return null;
      }

      return selectedComparisonCity ?? comparisonRows.find((row) => row.key === selectedCityKey) ?? scoreRankingRows[0] ?? null;
    },
    [comparisonRows, filteredComparisonRows, scoreRankingRows, selectedComparisonCity, selectedCityKey],
  );

  const selectedExplorerCity = useMemo(() => {
    if (!selectedCity) {
      return null;
    }

    const explorerDetail = cityExplorerDetails.get(selectedCity.key);

    return {
      ...selectedCity,
      audit: explorerDetail?.audit ?? selectedCity.audit,
      city360: explorerDetail?.city360 ?? selectedCity.city360,
      sources: explorerDetail?.sources ?? {},
      trends: explorerDetail?.trends ?? [],
    };
  }, [cityExplorerDetails, selectedCity]);

  const selectedVerifiedSnapshot = useMemo(
    () => (selectedCity ? verifiedSnapshotByKey.get(selectedCity.key) ?? null : null),
    [selectedCity, verifiedSnapshotByKey],
  );

  const citySelectorOptions = useMemo(
    () => [...scoreRankingRows].sort((left, right) => left.city.localeCompare(right.city)),
    [scoreRankingRows],
  );

  const explorerRankingRows = useMemo(
    () => {
      if (!buildRankingFn) {
        return [];
      }

      return buildRankingFn('balanced', scenarioKey).map((city) => {
        const verified = verifiedSnapshotByKey.get(city.key);
        const baseRow = {
          ...city,
          activeLens: 'balanced',
          auditOverall: city.audit.overall,
          lastReviewed: verified?.lastReviewed ?? city.audit.lastReviewed,
          pm25: city.mobility.pm25,
          primaryCon: city.comparison.pros ? city.comparison.cons[0] : '',
          primaryPro: city.comparison.pros ? city.comparison.pros[0] : '',
          scenarioBudget: city.budgets[scenarioKey].midpoint,
          verifiedChildcare: verified?.childcare ?? null,
          verifiedCount: verified?.verifiedDetails.length ?? 0,
          verifiedDetails: verified?.verifiedDetails ?? [],
          verifiedSourceSummary: verified?.verifiedSourceSummary ?? 'None',
          verifiedFamilyBenefits: verified?.familyBenefits ?? null,
          verifiedMobility: verified?.mobility ?? null,
          verifiedSections: verified?.verifiedSections ?? [],
          strategicBalance: city.strategicBalance,
        };
        return applySimulationModifiers(baseRow, simulationModifiers, scenarioKey);
      });
    },
    [buildRankingFn, scenarioKey, verifiedSnapshotByKey, simulationModifiers],
  );

  useEffect(() => {
    if (selectedCityKey && filteredComparisonRows.length && !filteredComparisonRows.some((row) => row.key === selectedCityKey)) {
      setSelectedCityKey(null);
    }
  }, [filteredComparisonRows, selectedCityKey]);

  useEffect(() => {
    mobilityDispatch({
      type: MOBILITY_ACTION_TYPES.setSelectedCity,
      payload: selectedCityKey,
    });
  }, [mobilityDispatch, selectedCityKey]);

  useEffect(() => {
    mobilityDispatch({
      type: MOBILITY_ACTION_TYPES.setActiveMap,
      payload: resolveMobilityMapForPage(page),
    });
  }, [mobilityDispatch, page]);

  const exportRows = useMemo(
    () =>
      filteredComparisonRows.length
        ? filteredComparisonRows.map((row, index) => ({
          filteredRank: index + 1,
          city: row.city,
          country: row.country,
          activeLensKey: lensKey,
          activeLens: priorityPresets[lensKey].label,
          cityPersonality: row.city360.personality,
          fittingIn: row.city360.fittingIn,
          overallScore: row.activeWeightedScore.toFixed(2),
          balancedDecisionScore: row.strategicBalance.weightedScore.toFixed(2),
          stayAwayIf: row.city360.stayAwayIf,
          scenarioKey,
          scenario: scenarioMeta[scenarioKey].label,
          householdProfile,
          selectedYear,
          selectedCity: selectedComparisonCity ? `${selectedComparisonCity.city}, ${selectedComparisonCity.country}` : 'None',
          searchTerm: searchValue || 'All cities',
          sortOrder: sortLabel,
          verificationFilter: verificationLabel,
          budgetFilter: budgetLabel,
          mobilityFilter: mobilityLabel,
          airFilter: airLabel,
          shockType,
          shockSeverity,
          activeFilterSummary,
          filteredResultCount: filteredComparisonRows.length,
          totalComparedCities: comparisonRows.length,
          scenarioBudget: row.scenarioBudget,
          strategicBreakdown: row.strategicBalance.pillars.map((pillar) => `${pillar.label}: ${pillar.score.toFixed(2)}`).join(' | '),
          topPerks: row.city360.honestTruth.good.join(' | '),
          topDealBreakers: row.city360.honestTruth.bad.join(' | '),
          pm25: row.pm25,
          primaryPro: row.primaryPro,
          primaryCon: row.primaryCon,
          moveHereIf: row.city360.moveHereIf,
          verifiedSectionCount: row.verifiedDetails.length,
          verifiedSections: row.verifiedSections.join(' | ') || 'None',
          childcare: row.verifiedChildcare ?? 'Withheld pending source',
          mobility: row.verifiedMobility ?? 'Withheld pending source',
          familyBenefits: row.verifiedFamilyBenefits ?? 'Withheld pending source',
          verifiedSources: row.verifiedSourceSummary ?? 'None',
          trustConfidence: row.verificationProfile?.confidence ?? null,
          trustEvidenceClass: row.verificationProfile?.evidenceClass ?? 'mixed',
          trustSourceDiversity: row.verificationProfile?.sourceDiversityScore ?? 0,
          trustFreshnessDecay: row.verificationProfile?.freshnessDecay ?? 0,
          trustFreshnessDays: row.verificationProfile?.freshnessDays ?? null,
          trustRiskTier: inferEvidenceRiskTier(row.verificationProfile),
          lastReviewed: row.lastReviewed,
        }))
        : [
          {
            activeLensKey: lensKey,
            activeLens: priorityPresets[lensKey].label,
            scenarioKey,
            scenario: scenarioMeta[scenarioKey].label,
            selectedYear,
            selectedCity: 'None',
            searchTerm: searchValue || 'All cities',
            sortOrder: sortLabel,
            verificationFilter: verificationLabel,
            budgetFilter: budgetLabel,
            mobilityFilter: mobilityLabel,
            airFilter: airLabel,
            shockType,
            shockSeverity,
            activeFilterSummary,
            filteredResultCount: 0,
            totalComparedCities: comparisonRows.length,
            status: 'No cities matched the active filter set.',
          },
        ],
    [
      activeFilterSummary,
      airLabel,
      budgetLabel,
      comparisonRows.length,
      filteredComparisonRows,
      lensKey,
      mobilityLabel,
      scenarioKey,
      searchValue,
      selectedComparisonCity,
      selectedYear,
      shockSeverity,
      shockType,
      sortLabel,
      verificationLabel,
    ],
  );

  const exportPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      title: 'Strategic Relocation: The Balance Matrix',
      coverage: comparisonCities,
      activeLens: lensKey,
      scenario: scenarioKey,
      simulation: {
        hasActiveSimulation,
        shockType,
        shockSeverity,
      },
      scenarioLab: {
        presetKey: selectedScenarioLabPresetKey,
        savedRunsCount: savedScenarioLabRuns.length,
        activeRun: activeScenarioLabRun
          ? {
            id: activeScenarioLabRun.id,
            name: activeScenarioLabRun.name,
            createdAt: activeScenarioLabRun.createdAt,
            selectedCityKey: activeScenarioLabRun.selectedCityKey,
            selectedYear: activeScenarioLabRun.selectedYear,
            shockType: activeScenarioLabRun.shockType,
            shockSeverity: activeScenarioLabRun.shockSeverity,
          }
          : null,
      },
      selectedYear,
      selectedCityKey: selectedComparisonCity?.key ?? null,
      evidenceCenter: buildEvidenceCenterExportBlock(selectedExplorerCity),
      filteredResultCount: filteredComparisonRows.length,
      totalComparedCities: comparisonRows.length,
      dashboardView: {
        activeLens: {
          key: lensKey,
          label: priorityPresets[lensKey].label,
        },
        scenario: {
          key: scenarioKey,
          label: scenarioMeta[scenarioKey].label,
        },
        selectedYear,
        selectedCity: selectedComparisonCity
          ? {
            key: selectedComparisonCity.key,
            city: selectedComparisonCity.city,
            country: selectedComparisonCity.country,
          }
          : null,
        filters: {
          searchValue,
          sort: {
            key: sortKey,
            label: sortLabel,
          },
          verification: {
            key: verificationFilter,
            label: verificationLabel,
          },
          budget: {
            key: budgetFilter,
            label: budgetLabel,
          },
          mobility: {
            key: mobilityFilter,
            label: mobilityLabel,
          },
          air: {
            key: airFilter,
            label: airLabel,
          },
          shock: {
            type: shockType,
            severity: shockSeverity,
          },
          activeFilters,
          activeFilterSummary,
          filteredResultCount: filteredComparisonRows.length,
          totalComparedCities: comparisonRows.length,
        },
      },
      verificationWindow,
      benchmarkSources,
      cities: filteredComparisonRows.map((row, index) => ({
        filteredRank: index + 1,
        key: row.key,
        city: row.city,
        country: row.country,
        activeWeightedScore: row.activeWeightedScore,
        budgets: row.budgets,
        city360: row.city360,
        comparison: row.comparison,
        trends: row.trends,
        childcare: row.verifiedChildcare,
        mobility: row.verifiedMobility,
        familyBenefits: row.verifiedFamilyBenefits,
        scenarioBudget: row.scenarioBudget,
        pm25: row.pm25,
        strategicBalance: row.strategicBalance,
        verificationProfile: row.verificationProfile ?? null,
        lastReviewed: row.lastReviewed,
        verifiedDetails: row.verifiedDetails,
      })),
    }),
    [
      activeFilters,
      activeFilterSummary,
      airFilter,
      airLabel,
      benchmarkSources,
      budgetFilter,
      budgetLabel,
      comparisonCities,
      comparisonRows.length,
      filteredComparisonRows,
      lensKey,
      mobilityFilter,
      mobilityLabel,
      householdProfile,
      scenarioKey,
      searchValue,
      selectedComparisonCity,
      selectedExplorerCity,
      selectedScenarioLabPresetKey,
      selectedYear,
      savedScenarioLabRuns.length,
      shockSeverity,
      shockType,
      sortKey,
      sortLabel,
      verificationFilter,
      verificationLabel,
      hasActiveSimulation,
      activeScenarioLabRun,
    ],
  );

  useEffect(() => {
    persistStoredValue(storageKeys.lens, lensKey);
  }, [lensKey]);

  useEffect(() => {
    persistStoredValue(storageKeys.householdProfile, JSON.stringify(householdProfile));
  }, [householdProfile]);

  useEffect(() => {
    persistStoredValue(storageKeys.scenarioLabRuns, JSON.stringify(savedScenarioLabRuns));
  }, [savedScenarioLabRuns]);

  useEffect(() => {
    persistStoredValue(storageKeys.year, selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (page !== 'explorer' || !selectedCity?.key || cityExplorerDetails.has(selectedCity.key)) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const module = await import('../data/city360DetailLoader.js');
      const explorerDetail = await module.loadCityExplorerDetail(selectedCity.key);

      if (cancelled || !explorerDetail) {
        return;
      }

      startTransition(() => {
        setCityExplorerDetails((previousDetails) => {
          if (previousDetails.has(selectedCity.key)) {
            return previousDetails;
          }

          const nextDetails = new Map(previousDetails);
          nextDetails.set(selectedCity.key, explorerDetail);
          return nextDetails;
        });
      });
    })()
      .catch(() => {
        // Fall back to the compact summary so explorer navigation still works.
      });

    return () => {
      cancelled = true;
    };
  }, [cityExplorerDetails, page, selectedCity]);

  return {
    activeFilters,
    airFilter,
    budgetFilter,
    comparisonRows,
    dashboardData,
    dashboardLoadError,
    exportPayload,
    exportRows,
    exportStamp,
    explorerRankingRows,
    futureOutlookRows,
    filteredComparisonRows,
    hasActiveSimulation,
    hasActiveThresholds,
    lensKey,
    mobilityFilter,
    navigateTo,
    page,
    resetThresholds,
    householdProfile,
    scenarioKey,
    searchValue,
    selectedCityKey,
    selectedExplorerCity,
    selectedVerifiedSnapshot,
    selectedYear,
    setAirFilter,
    setBudgetFilter,
    setLensKey,
    setMapComparisonCity,
    setMapMode,
    setMapNeighborCount,
    setMapPersona,
    setMobilityFilter,
    setHouseholdProfile,
    setShockSeverity,
    setShockType,
    setSearchValue,
    setSelectedCityKey,
    setSelectedYear,
    setSortKey,
    setThreshold,
    setVerificationFilter,
    sortKey,
    shockSeverity,
    shockType,
    mapComparisonCity,
    mapNeighborCount,
    mapMode,
    mapPersona,
    scenarioLabPresets: SCENARIO_LAB_PRESETS,
    selectedScenarioLabPresetKey,
    savedScenarioLabRuns,
    activeScenarioLabRun,
    applyScenarioLabPreset,
    saveScenarioLabRun,
    loadScenarioLabRun,
    deleteScenarioLabRun,
    thresholds,
    verificationFilter,
    citySelectorOptions,
  };
};
