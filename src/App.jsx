import { lazy, startTransition, Suspense, useEffect, useMemo, useState } from 'react';
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
} from './utils/comparisonFilters.js';
import { priorityPresets, scenarioMeta, verificationWindow } from './data/dashboardConfig.js';
import { WorkstationLayout } from './components/WorkstationLayout.jsx';
import {
  buildCsvDocument,
  buildExportFileName,
  buildXlsDocument,
  downloadExportFile,
} from './utils/exportHelpers.js';
import { applySimulationModifiers } from './utils/simulationModifiers.js';
import { persistStoredValue, readStoredValue } from './utils/storagePersistence.js';
import { buildHashWithShareState, buildShareUrl, parseHashLocation, readShareStateFromHash } from './utils/urlState.js';
import { useDashboardState } from './context/DashboardContext.jsx';
import { useShortlist } from './context/DashboardContext.jsx';
import { DEFAULT_SIMULATION_MODIFIERS } from './context/DashboardContext.jsx';
import useTokenizedSearch from './hooks/useTokenizedSearch.js';
import usePillarThresholds from './hooks/usePillarThresholds.jsx';

const comparisonTitle = 'Strategic Relocation: The Balance Matrix';
const isBrowser = typeof window !== 'undefined';
const storageKeys = {
  lens: 'relocation-dashboard:lens',
  scenario: 'relocation-dashboard:scenario',
  city: 'relocation-dashboard:selected-city',
  year: 'relocation-dashboard:selected-year',
};

const LazyExplorerPage = lazy(async () => {
  const module = await import('./components/explorerPage.jsx');
  return { default: module.ExplorerPage };
});

const LazyCityMapPage = lazy(async () => {
  const module = await import('./components/CityMapPage.jsx');
  return { default: module.CityMapPage };
});

let dashboardDataPromise;

const loadDashboardData = () => {
  if (!dashboardDataPromise) {
    dashboardDataPromise = import('./relocationData.js');
  }

  return dashboardDataPromise;
};

const DashboardStatusPanel = function dashboardStatusPanel({ title, detail }) {
  return (
    <div className="app-shell">
      <main className="dashboard">
        <section className="panel stack-gap-lg" aria-live="polite">
          <h2>{title}</h2>
          <p>{detail}</p>
        </section>
      </main>
    </div>
  );
};

const pickAllowed = (value, options, fallback) => (
  options.some((option) => option.value === value) ? value : fallback
);

const App = function app() {
  // ── Context: simulationModifiers and shortlist from DashboardContext ──────
  const { simulationModifiers } = useDashboardState();
  const { shortlistedCityKeys } = useShortlist();
  const hasActiveSimulation = Object.keys(simulationModifiers).some(
    (k) => simulationModifiers[k] !== (DEFAULT_SIMULATION_MODIFIERS[k] ?? 0),
  );

  // ── Tokenized search & pillar thresholds (new engine hooks) ───────────────
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
  const [isPrinting, setIsPrinting] = useState(false);
  const [page, setPage] = useState(() => {
    if (!isBrowser) {
      return '';
    }

    if (initialShareState?.page === 'explorer' || initialShareState?.page === 'map') {
      return initialShareState.page;
    }

    return parseHashLocation(window.location.hash).route;
  });

  const navigateTo = (target) => {
    setPage(target);
    if (isBrowser) {
      window.location.hash = buildHashWithShareState(target, null);
      window.scrollTo(0, 0);
    }
  };
  const [sortKey, setSortKey] = useState(() => pickAllowed(initialShareState?.sort, sortOptions, 'score'));
  const [verificationFilter, setVerificationFilter] = useState(() => pickAllowed(initialShareState?.verification, verificationOptions, 'all'));
  const [budgetFilter, setBudgetFilter] = useState(() => pickAllowed(initialShareState?.budget, budgetOptions, 'all'));
  const [mobilityFilter, setMobilityFilter] = useState(() => pickAllowed(initialShareState?.mobility, mobilityOptions, 'all'));
  const [airFilter, setAirFilter] = useState(() => pickAllowed(initialShareState?.air, airOptions, 'all'));
  const cities = dashboardData?.cities ?? [];
  const benchmarkSources = dashboardData?.benchmarkSources ?? [];
  const buildRankingFn = dashboardData?.buildRanking ?? null;
  const buildVerifiedSnapshotRowsFn = dashboardData?.buildVerifiedSnapshotRows ?? null;
  const exportStamp = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const comparisonCities = useMemo(() => cities.map((city) => city.city).join(', '), [cities]);

  useEffect(() => {
    if (typeof initialShareState?.search === 'string' && initialShareState.search.length > 0) {
      setSearchValue(initialShareState.search);
    }
  }, [initialShareState?.search, setSearchValue]);

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
  const verifiedCountByCity = useMemo(
    () => new Map(verifiedSnapshotRows.map((row) => [row.key, row.verifiedDetails.length])),
    [verifiedSnapshotRows],
  );
  const strictRanking = useMemo(
    () =>
      [...cities].sort(
        (left, right) =>
          (verifiedCountByCity.get(right.key) ?? 0) - (verifiedCountByCity.get(left.key) ?? 0)
          || left.city.localeCompare(right.city),
      ),
    [cities, verifiedCountByCity],
  );
  const scoreRankingRows = useMemo(
    () => {
      if (!buildRankingFn) {
        return [];
      }

      return buildRankingFn(lensKey, scenarioKey).map((city) => {
        const verified = verifiedSnapshotByKey.get(city.key);

        const baseRow = {
          ...city,
          activeLens: lensKey,
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

        // Apply lifestyle simulation modifiers (no-op when all are zero)
        return applySimulationModifiers(baseRow, simulationModifiers, scenarioKey);
      });
    },
    // scenarioKey included so simulation modifiers recompute on scenario switch
    [buildRankingFn, lensKey, scenarioKey, verifiedSnapshotByKey, simulationModifiers],
  );

  const comparisonRows = useMemo(() => [...scoreRankingRows], [scoreRankingRows]);
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
  }, [comparisonRows, searchValue, thresholds, simulationModifiers, sortKey, verificationFilter, budgetFilter, mobilityFilter, airFilter]);
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
    () => selectedComparisonCity ?? comparisonRows.find((row) => row.key === selectedCityKey) ?? scoreRankingRows[0] ?? null,
    [comparisonRows, scoreRankingRows, selectedComparisonCity, selectedCityKey],
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

  // ── Explorer rows: always Balanced lens, independent of dashboard lensKey ─
  // Each city is scored on what it actually offers (9-pillar strategic balance).
  // simulationModifiers and scenarioKey still apply so budget context is correct.
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
      sortLabel,
      verificationLabel,
    ],
  );
  const exportPayload = useMemo(
    () => ({
      exportedAt: new Date().toISOString(),
      title: comparisonTitle,
      coverage: comparisonCities,
      activeLens: lensKey,
      scenario: scenarioKey,
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
        lastReviewed: row.lastReviewed,
        verifiedDetails: row.verifiedDetails,
      })),
    }),
    [
      activeFilters,
      activeFilterSummary,
      airFilter,
      airLabel,
      budgetFilter,
      budgetLabel,
      comparisonRows.length,
      filteredComparisonRows,
      lensKey,
      mobilityFilter,
      mobilityLabel,
      scenarioKey,
      searchValue,
      selectedComparisonCity,
      selectedYear,
      sortKey,
      sortLabel,
      verificationFilter,
      verificationLabel,
    ],
  );

  const handleJsonExport = async () => {
    try {
      let payload = exportPayload;

      if (filteredComparisonRows.some((row) => row.trends == null)) {
        const { loadCityTrendDetail } = await import('./data/city360DetailLoader.js');
        const trendEntries = await Promise.all(
          filteredComparisonRows.map(async (row) => [row.key, await loadCityTrendDetail(row.key)]),
        );
        const trendsByKey = new Map(trendEntries);

        payload = {
          ...exportPayload,
          cities: exportPayload.cities.map((city) => ({
            ...city,
            trends: trendsByKey.get(city.key) ?? city.trends ?? [],
          })),
        };
      }

      if (filteredComparisonRows.some((row) => row.verifiedDetails.some((detail) => detail.sources == null))) {
        const { default: verifiedSnapshotSummary } = await import('./data/verifiedSnapshotSummary.json');

        payload = {
          ...payload,
          cities: payload.cities.map((city) => ({
            ...city,
            verifiedDetails: verifiedSnapshotSummary[city.key]?.verifiedDetails ?? city.verifiedDetails,
          })),
        };
      }

      downloadExportFile(
        buildExportFileName(exportStamp, 'json'),
        `${JSON.stringify(payload, null, 2)}\n`,
        'application/json;charset=utf-8',
      );
    } catch {
      if (isBrowser) {
        window.alert('JSON export failed. Please retry.');
      }
    }
  };

  const handlePrint = () => {
    if (!isBrowser) return;
    setIsPrinting(true);
    // Double rAF ensures React has committed the "all charts visible" render before printing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          document.querySelectorAll('details').forEach((el) => { el.open = true; });
          window.print();
        } catch {
          window.alert('PDF print export could not be opened. Please retry.');
        } finally {
          setIsPrinting(false);
        }
      });
    });
  };

  const handleCsvExport = () => {
    try {
      downloadExportFile(
        buildExportFileName(exportStamp, 'csv'),
        buildCsvDocument(exportRows),
        'text/csv;charset=utf-8',
      );
    } catch {
      if (isBrowser) {
        window.alert('CSV export failed. Please retry.');
      }
    }
  };

  const handleXlsExport = () => {
    try {
      downloadExportFile(
        buildExportFileName(exportStamp, 'xls'),
        buildXlsDocument(filteredComparisonRows, {
          lensLabel: priorityPresets[lensKey].label,
          scenarioLabel: scenarioMeta[scenarioKey].label,
          selectedYear,
        }),
        'application/vnd.ms-excel;charset=utf-8',
      );
    } catch {
      if (isBrowser) {
        window.alert('XLS export failed. Please retry.');
      }
    }
  };

  const handleShare = async () => {
    if (!isBrowser) {
      return;
    }

    const shareState = {
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
    };
    const shareUrl = buildShareUrl({ route: page, shareState, locationObject: window.location });

    if (navigator.share) {
      try {
        await navigator.share({
          title: comparisonTitle,
          text: 'Relocation dashboard snapshot',
          url: shareUrl,
        });
        return;
      } catch {
        // Continue to clipboard fallback when share sheet is unavailable or cancelled.
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      window.prompt('Copy share link:', shareUrl);
    }
  };

  useEffect(() => {
    persistStoredValue(storageKeys.lens, lensKey);
  }, [lensKey]);

  useEffect(() => {
    persistStoredValue(storageKeys.scenario, scenarioKey);
  }, [scenarioKey]);

  // Selected city is intentionally not persisted — it resets to none on every page load.

  useEffect(() => {
    persistStoredValue(storageKeys.year, selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    if (page !== 'explorer' || !selectedCity?.key || cityExplorerDetails.has(selectedCity.key)) {
      return;
    }

    let cancelled = false;

    void (async () => {
      const module = await import('./data/city360DetailLoader.js');
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

  if (dashboardLoadError) {
    return (
      <DashboardStatusPanel
        title="Dashboard data could not load"
        detail="The relocation dataset failed to load. Refresh the page or rebuild the dashboard bundle to retry."
      />
    );
  }

  if (!dashboardData) {
    return (
      <DashboardStatusPanel
        title="Loading relocation data"
        detail="Preparing rankings, verified snapshots, and export surfaces."
      />
    );
  }

  if (page === 'explorer') {
    return (
      <Suspense
        fallback={
          <DashboardStatusPanel
            title="Loading city explorer"
            detail="Fetching the detailed explorer route and verification panels."
          />
        }
      >
        <LazyExplorerPage
          cityOptions={citySelectorOptions}
          selectedCity={selectedExplorerCity}
          selectedSnapshot={selectedVerifiedSnapshot}
          onSelectCity={setSelectedCityKey}
          scenarioKey={scenarioKey}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          rankingRows={explorerRankingRows}
          onBack={() => navigateTo('')}
          onShare={handleShare}
          hasActiveSimulation={hasActiveSimulation}
          thresholds={thresholds}
          onThresholdChange={setThreshold}
          onResetThresholds={resetThresholds}
          hasActiveThresholds={hasActiveThresholds}
        />
      </Suspense>
    );
  }

  if (page === 'map') {
    return (
      <Suspense
        fallback={
          <DashboardStatusPanel
            title="Loading city map"
            detail="Preparing geographic view of relocation cities."
          />
        }
      >
        <LazyCityMapPage
          cityOptions={citySelectorOptions}
          selectedCity={selectedExplorerCity}
          onSelectCity={setSelectedCityKey}
          onBack={() => navigateTo('')}
          onGoToExplorer={() => navigateTo('explorer')}
          onShare={handleShare}
        />
      </Suspense>
    );
  }

  return (
    <WorkstationLayout
      lensKey={lensKey}
      onLensChange={setLensKey}
      scenarioKey={scenarioKey}
      onScenarioChange={setScenarioKey}
      rows={comparisonRows}
      filteredRows={filteredComparisonRows}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      selectedCityKey={selectedCityKey}
      onSelectCity={setSelectedCityKey}
      activeFilters={activeFilters}
      onClearFilters={() => {
        setSearchValue('');
        setSortKey('score');
        setVerificationFilter('all');
        setBudgetFilter('all');
        setMobilityFilter('all');
        setAirFilter('all');
      }}
      onExportPdf={handlePrint}
      onExportXls={handleXlsExport}
      onExportCsv={handleCsvExport}
      onExportJson={handleJsonExport}
      onGoToExplorer={() => navigateTo('explorer')}
      onGoToMap={() => navigateTo('map')}
      onShare={handleShare}
    />
  );
};

export default App;