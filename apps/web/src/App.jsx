import { Suspense, useState } from 'react';
import { priorityPresets, scenarioMeta } from './data/dashboardConfig.js';
import { WorkstationLayout } from './components/WorkstationLayout.jsx';
import { ACTIONS, useDashboardDispatch, useDashboardState } from './application/compare/dashboardState.jsx';
import { useMobilityDispatch, useMobilityState } from './application/atlas/mobilityState.jsx';
import {
  exportCsvSnapshot,
  exportJsonSnapshot,
  exportXlsSnapshot,
  printDashboardSnapshot,
  shareDashboardSnapshot,
} from '../../../packages/exports/index.js';
import DashboardStatusPanel from './components/DashboardStatusPanel.jsx';
import {
  LazyCityMapPage,
  LazyExplorerPage,
  LazyFamilyFitPage,
  LazyFutureOutlookPage,
  comparisonTitle,
  isBrowser,
} from './app/appShellUtils.js';
import {
  buildDashboardShareState,
  isDefaultDashboardShareState,
  useDashboardOrchestration,
} from './app/useDashboardOrchestration.js';
import { buildRouteHash } from './utils/urlState.js';

const App = function app() {
  const { simulationModifiers } = useDashboardState();
  const dashboardDispatch = useDashboardDispatch();
  const { layerVisibility, timeWindowHours } = useMobilityState();
  const mobilityDispatch = useMobilityDispatch();
  const mobilityState = { layerVisibility, timeWindowHours };
  const [, setIsPrinting] = useState(false);
  const {
    activeFilters,
    airFilter,
    budgetFilter,
    citySelectorOptions,
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
    thresholds,
    verificationFilter,
  } = useDashboardOrchestration({ simulationModifiers, mobilityDispatch, mobilityState });

  const currentShareState = buildDashboardShareState({
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
    mobilityState,
  });
  const isLinkCustomized = !isDefaultDashboardShareState(currentShareState);

  const handleJsonExport = async () => {
    try {
      await exportJsonSnapshot({ exportPayload, filteredComparisonRows, exportStamp });
    } catch {
      if (isBrowser) {
        window.alert('JSON export failed. Please retry.');
      }
    }
  };

  const handlePrint = () => {
    try {
      printDashboardSnapshot({ setIsPrinting });
    } catch {
      if (isBrowser) {
        window.alert('PDF print export could not be opened. Please retry.');
      }
    }
  };

  const handleCsvExport = () => {
    try {
      exportCsvSnapshot({ exportRows, exportStamp });
    } catch {
      if (isBrowser) {
        window.alert('CSV export failed. Please retry.');
      }
    }
  };

  const handleXlsExport = () => {
    try {
      exportXlsSnapshot({
        filteredComparisonRows,
        exportStamp,
        lensLabel: priorityPresets[lensKey].label,
        scenarioLabel: scenarioMeta[scenarioKey].label,
        selectedYear,
      });
    } catch {
      if (isBrowser) {
        window.alert('XLS export failed. Please retry.');
      }
    }
  };

  const handleShare = async () => {
    await shareDashboardSnapshot({
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
      comparisonTitle,
      timeWindowHours,
      layerVisibility,
    });
  };

  const handleResetLink = () => {
    if (!isBrowser) {
      return;
    }

    setLensKey('balanced');
    setScenarioKey('oneParent');
    setSelectedCityKey(null);
    setSelectedYear(2026);
    setSortKey('score');
    setVerificationFilter('all');
    setBudgetFilter('all');
    setMobilityFilter('all');
    setAirFilter('all');
    setShockType('none');
    setShockSeverity(1);
    setSearchValue('');

    dashboardDispatch({ type: ACTIONS.RESET_SIMULATION });
    dashboardDispatch({ type: ACTIONS.CLEAR_SHORTLIST });
    mobilityDispatch({ type: 'RESET_MOBILITY_STATE' });

    window.history.replaceState(null, '', buildRouteHash(page));
  };

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
          onResetLink={handleResetLink}
          isLinkCustomized={isLinkCustomized}
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
          onResetLink={handleResetLink}
          isLinkCustomized={isLinkCustomized}
        />
      </Suspense>
    );
  }

  if (page === 'outlook') {
    return (
      <Suspense
        fallback={
          <DashboardStatusPanel
            title="Loading future outlook"
            detail="Preparing temporal projections and volatility insights."
          />
        }
      >
        <LazyFutureOutlookPage
          rows={futureOutlookRows}
          selectedYear={selectedYear}
          onYearChange={setSelectedYear}
          onBack={() => navigateTo('')}
          onShare={handleShare}
          onResetLink={handleResetLink}
          isLinkCustomized={isLinkCustomized}
          shockType={shockType}
          shockSeverity={shockSeverity}
          onShockTypeChange={setShockType}
          onShockSeverityChange={setShockSeverity}
        />
      </Suspense>
    );
  }

  if (page === 'family-fit') {
    return (
      <Suspense
        fallback={
          <DashboardStatusPanel
            title="Loading family fit explorer"
            detail="Computing rhythm-based family relocation matches."
          />
        }
      >
        <LazyFamilyFitPage
          rows={familyFitExplorerRows}
          onBack={() => navigateTo('')}
          onShare={handleShare}
          onResetLink={handleResetLink}
          isLinkCustomized={isLinkCustomized}
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
      onGoToOutlook={() => navigateTo('outlook')}
      onGoToFamilyFit={() => navigateTo('family-fit')}
      onShare={handleShare}
      onResetLink={handleResetLink}
      isLinkCustomized={isLinkCustomized}
    />
  );
};

export default App;