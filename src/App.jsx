import { Suspense, useState } from 'react';
import { priorityPresets, scenarioMeta } from './data/dashboardConfig.js';
import { WorkstationLayout } from './components/WorkstationLayout.jsx';
import { useDashboardState } from './context/DashboardContext.jsx';
import {
  exportCsvSnapshot,
  exportJsonSnapshot,
  exportXlsSnapshot,
  printDashboardSnapshot,
  shareDashboardSnapshot,
} from './app/exportActions.js';
import DashboardStatusPanel from './components/DashboardStatusPanel.jsx';
import {
  LazyCityMapPage,
  LazyExplorerPage,
  comparisonTitle,
  isBrowser,
} from './app/appShellUtils.js';
import { useDashboardOrchestration } from './app/useDashboardOrchestration.js';

const App = function app() {
  const { simulationModifiers } = useDashboardState();
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
    setSearchValue,
    setSelectedCityKey,
    setSelectedYear,
    setSortKey,
    setThreshold,
    setVerificationFilter,
    sortKey,
    thresholds,
    verificationFilter,
  } = useDashboardOrchestration({ simulationModifiers });

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
      comparisonTitle,
    });
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