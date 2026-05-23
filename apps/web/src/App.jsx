import { Suspense, useState } from 'react';
import { DEFAULT_HOUSEHOLD_PROFILE, priorityPresets, scenarioMeta } from './data/dashboardConfig.js';
import { WorkstationLayout } from './components/WorkstationLayout.jsx';
import { ACTIONS, useDashboardDispatch, useDashboardState } from './application/compare/dashboardState.jsx';
import { useMobilityDispatch, useMobilityState } from './application/atlas/mobilityState.jsx';
import {
  publishExportArtifactsWithTelemetry,
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
    filteredComparisonRows,
    futureOutlookRows,
    hasActiveSimulation,
    hasActiveThresholds,
    householdProfile,
    lensKey,
    mapComparisonCity,
    mapMode,
    mapNeighborCount,
    mapPersona,
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
    selectedScenarioLabPresetKey,
    scenarioLabPresets,
    savedScenarioLabRuns,
    activeScenarioLabRun,
    applyScenarioLabPreset,
    saveScenarioLabRun,
    loadScenarioLabRun,
    deleteScenarioLabRun,
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
    thresholds,
    verificationFilter,
  } = useDashboardOrchestration({ simulationModifiers, mobilityDispatch, mobilityState });

  const currentShareState = buildDashboardShareState({
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
  const isLinkCustomized = !isDefaultDashboardShareState(currentShareState);

  const alertIfBrowser = (message) => {
    if (isBrowser) {
      window.alert(message);
    }
  };

  const handleJsonExport = () => exportJsonSnapshot({ exportPayload, filteredComparisonRows, exportStamp })
    .then(() => publishExportArtifactsWithTelemetry({ exportPayload, exportFormat: 'json' }).catch(() => []))
    .catch(() => {
      alertIfBrowser('JSON export failed. Please retry.');
    });

  const handlePrint = () => Promise.resolve()
    .then(() => {
      printDashboardSnapshot({ setIsPrinting });
      return publishExportArtifactsWithTelemetry({ exportPayload, exportFormat: 'pdf' }).catch(() => []);
    })
    .catch(() => {
      alertIfBrowser('PDF print export could not be opened. Please retry.');
    });

  const handleCsvExport = () => Promise.resolve()
    .then(() => {
      exportCsvSnapshot({ exportRows, exportStamp });
      return publishExportArtifactsWithTelemetry({ exportPayload, exportFormat: 'csv' }).catch(() => []);
    })
    .catch(() => {
      alertIfBrowser('CSV export failed. Please retry.');
    });

  const handleXlsExport = () => Promise.resolve()
    .then(() => {
      exportXlsSnapshot({
        filteredComparisonRows,
        exportStamp,
        lensLabel: priorityPresets[lensKey].label,
        scenarioLabel: scenarioMeta[scenarioKey].label,
        selectedYear,
      });
      return publishExportArtifactsWithTelemetry({ exportPayload, exportFormat: 'xls' }).catch(() => []);
    })
    .catch(() => {
      alertIfBrowser('XLS export failed. Please retry.');
    });

  const handleShare = async () => {
    await shareDashboardSnapshot({
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
    setHouseholdProfile(DEFAULT_HOUSEHOLD_PROFILE);
    setSelectedCityKey(null);
    setSelectedYear(2026);
    setSortKey('score');
    setVerificationFilter('all');
    setBudgetFilter('all');
    setMobilityFilter('all');
    setAirFilter('all');
    setShockType('none');
    setShockSeverity(1);
    setMapComparisonCity('');
    setMapMode('familyStability');
    setMapNeighborCount(3);
    setMapPersona('internationalFamily');
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
          comparisonCityKey={mapComparisonCity}
          onComparisonCityChange={setMapComparisonCity}
          nearestNeighborCount={mapNeighborCount}
          onNearestNeighborCountChange={setMapNeighborCount}
          selectedModeKey={mapMode}
          onModeChange={setMapMode}
          selectedPersonaKey={mapPersona}
          onPersonaChange={setMapPersona}
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
      householdProfile={householdProfile}
      onHouseholdProfileChange={setHouseholdProfile}
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
      onGoToMap={() => {
        if (isBrowser) {
          const target = window.document.getElementById('sec-map-intel');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            return;
          }
        }
        navigateTo('map');
      }}
      cityOptions={citySelectorOptions}
      selectedExplorerCity={selectedExplorerCity}
      selectedVerifiedSnapshot={selectedVerifiedSnapshot}
      mapComparisonCity={mapComparisonCity}
      onMapComparisonCityChange={setMapComparisonCity}
      mapNeighborCount={mapNeighborCount}
      onMapNeighborCountChange={setMapNeighborCount}
      mapMode={mapMode}
      onMapModeChange={setMapMode}
      mapPersona={mapPersona}
      onMapPersonaChange={setMapPersona}
      futureOutlookRows={futureOutlookRows}
      selectedYear={selectedYear}
      onSelectedYearChange={setSelectedYear}
      shockType={shockType}
      onShockTypeChange={setShockType}
      shockSeverity={shockSeverity}
      onShockSeverityChange={setShockSeverity}
      scenarioLabPresets={scenarioLabPresets}
      selectedScenarioLabPresetKey={selectedScenarioLabPresetKey}
      onScenarioLabPresetChange={applyScenarioLabPreset}
      savedScenarioLabRuns={savedScenarioLabRuns}
      activeScenarioLabRun={activeScenarioLabRun}
      onScenarioLabSaveRun={saveScenarioLabRun}
      onScenarioLabLoadRun={loadScenarioLabRun}
      onScenarioLabDeleteRun={deleteScenarioLabRun}
      onShare={handleShare}
      onResetLink={handleResetLink}
      isLinkCustomized={isLinkCustomized}
    />
  );
};

export default App;