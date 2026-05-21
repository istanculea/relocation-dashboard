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
import { priorityPresets, scenarioMeta, verificationWindow } from '../data/dashboardConfig.js';
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
  if (page === 'explorer' || page === 'outlook' || page === 'family-fit') {
    return 'reach';
  }

  if (page === 'map') {
    return 'strategicNetwork';
  }

  return 'strategicNetwork';
};

export const buildDashboardShareState = ({
  page,
  lensKey,
  scenarioKey,
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
}) => ({
  page,
  lens: lensKey,
  scenario: scenarioKey,
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
});

export const isDefaultDashboardShareState = (shareState) => {
  if (!shareState || typeof shareState !== 'object') {
    return true;
  }

  const mobilityLayers = shareState.mLayers ?? {};
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
    ([key, value]) => mobilityLayers[key] === value,
  );

  return (shareState.page === ''
    || shareState.page === 'map'
    || shareState.page === 'explorer'
    || shareState.page === 'outlook'
    || shareState.page === 'family-fit')
    && shareState.lens === 'balanced'
    && shareState.scenario === 'oneParent'
    && shareState.city == null
    && shareState.year === 2026
    && (shareState.sort == null || shareState.sort === 'score')
    && (shareState.verification == null || shareState.verification === 'all')
    && (shareState.budget == null || shareState.budget === 'all')
    && (shareState.mobility == null || shareState.mobility === 'all')
    && (shareState.air == null || shareState.air === 'all')
    && (shareState.search == null || shareState.search === '')
    && (shareState.shock == null || shareState.shock === 'none')
    && (shareState.shockSeverity == null || Number(shareState.shockSeverity) === 1)
    && (shareState.mapMode == null || shareState.mapMode === 'familyStability')
    && (shareState.mapPersona == null || shareState.mapPersona === 'internationalFamily')
    && (shareState.mapComparisonCity == null || shareState.mapComparisonCity === '')
    && (shareState.mapNeighborCount == null || Number(shareState.mapNeighborCount) === 3)
    && (shareState.mWindow == null || shareState.mWindow === 6)
    && hasDefaultLayers;
};

export const readDashboardShareState = (shareState) => {
  const state = shareState && typeof shareState === 'object' ? shareState : {};

  const page = state.page === ''
    || state.page === 'explorer'
    || state.page === 'map'
    || state.page === 'outlook'
    || state.page === 'family-fit'
    ? state.page
    : 'map';
  const lens = Object.hasOwn(priorityPresets, state.lens) ? state.lens : 'balanced';
  const scenario = Object.hasOwn(scenarioMeta, state.scenario) ? state.scenario : 'oneParent';
  const year = /^\d{4}$/.test(String(state.year)) ? Number(state.year) : 2026;

  return {
    page,
    lens,
    scenario,
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
  const [scenarioKey, setScenarioKey] = useState(() => {
    if (initialShareState?.scenario && Object.hasOwn(scenarioMeta, initialShareState.scenario)) {
      return initialShareState.scenario;
    }

    return readStoredValue(storageKeys.scenario, 'oneParent', (value) => Object.hasOwn(scenarioMeta, value));
  });
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
      || initialShareState?.page === 'outlook'
      || initialShareState?.page === 'family-fit'
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
  const hasActiveSimulation = hasActiveSimulationModifiers || shockType !== 'none';

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
    setScenarioKey(normalized.scenario);
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

      if (shockType !== 'none') {
        const shock = createSimulationShock({ type: shockType, severity: shockSeverity });

        return applyShockToRows(baseRows, shock, scenarioKey).map((row) => ({
          ...row,
          activeShock: shock,
        }));
      }

      return baseRows;
    },
    [
      buildFamilyFitRowsFn,
      buildRankingFn,
      buildTemporalOutlookRowsFn,
      familyFitByKey,
      lensKey,
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
          trustSourceDiversity: row.verificationProfile?.sourceDiversity ?? 0,
          trustFreshness: row.verificationProfile?.freshness ?? 0,
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
      selectedYear,
      selectedCityKey: selectedComparisonCity?.key ?? null,
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
      scenarioKey,
      searchValue,
      selectedComparisonCity,
      selectedYear,
      shockSeverity,
      shockType,
      sortKey,
      sortLabel,
      verificationFilter,
      verificationLabel,
      hasActiveSimulation,
    ],
  );

  useEffect(() => {
    persistStoredValue(storageKeys.lens, lensKey);
  }, [lensKey]);

  useEffect(() => {
    persistStoredValue(storageKeys.scenario, scenarioKey);
  }, [scenarioKey]);

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
    familyFitExplorerRows,
    filteredComparisonRows,
    futureOutlookRows,
    hasActiveSimulation,
    hasActiveThresholds,
    lensKey,
    mobilityFilter,
    navigateTo,
    page,
    resetThresholds,
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
    setScenarioKey,
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
    thresholds,
    verificationFilter,
    citySelectorOptions,
  };
};
