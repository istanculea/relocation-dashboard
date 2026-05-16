import { CityExplorerPanel } from './cityExplorerPanel.jsx';

export const ExplorerPage = function explorerPage({
  cityOptions,
  selectedCity,
  selectedSnapshot,
  onSelectCity,
  scenarioKey,
  selectedYear,
  onYearChange,
  rankingRows,
  onBack,
  thresholds,
}) {
  return (
    <div className="app-shell explorer-page-shell">
      <header className="ws-header">
        <div className="ws-header__brand">
          <span className="ws-header__title">City Detail Explorer</span>
          <span className="ws-header__subtitle">City Detail Explorer · Europe 2025–2026</span>
        </div>
        <div className="ws-header__divider" />
        <div style={{ flex: 1 }} />
        <div className="ws-header__actions">
          <button type="button" className="ws-icon-btn" onClick={onBack} title="Back to Dashboard">
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="dashboard">
        <CityExplorerPanel
          cityOptions={cityOptions}
          selectedCity={selectedCity}
          selectedSnapshot={selectedSnapshot}
          onSelectCity={onSelectCity}
          scenarioKey={scenarioKey}
          selectedYear={selectedYear}
          onYearChange={onYearChange}
          rankingRows={rankingRows}
          thresholds={thresholds}
        />
      </main>
    </div>
  );
};
