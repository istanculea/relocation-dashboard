import { CityExplorerPanel } from './cityExplorerPanel.jsx';
import { useMobilityState } from '../application/atlas/mobilityState.jsx';
import { buildMobilitySyncChips } from '../utils/mobilitySyncStatus.js';

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
  onShare,
  onResetLink,
  isLinkCustomized,
  hasActiveSimulation,
  thresholds,
  onThresholdChange,
  onResetThresholds,
  hasActiveThresholds,
}) {
  const { layerVisibility, timeWindowHours } = useMobilityState();
  const syncChips = buildMobilitySyncChips({ timeWindowHours, layerVisibility });

  return (
    <div className="app-shell explorer-page-shell">
      <header className="ws-header">
        <div className="ws-header__brand">
          <span className="ws-header__title">European Strategic Atlas</span>
          <span className="ws-header__subtitle">City Explorer · Family relocation intelligence</span>
        </div>
        <div className="ws-header__divider" />
        <div className="explorer-sync-strip" role="status" aria-live="polite" aria-label="Mobility map synchronization state">
          {syncChips.map((chip) => (
            <span key={chip} className="explorer-sync-strip__chip">{chip}</span>
          ))}
        </div>
        <div style={{ flex: 1 }} />
        <div className="ws-header__actions">
          <span
            className={`ws-link-state ${isLinkCustomized ? 'ws-link-state--customized' : 'ws-link-state--clean'}`}
            role="status"
            aria-live="polite"
          >
            Link: {isLinkCustomized ? 'Customized' : 'Clean'}
          </span>
          {hasActiveSimulation && (
            <span className="ws-header__badge" role="status" aria-live="polite">
              Simulation Active
            </span>
          )}
          <button type="button" className="ws-icon-btn" onClick={onShare} title="Copy share link">
            Share
          </button>
          <button type="button" className="ws-icon-btn" onClick={onResetLink} title="Clear URL share payload">
            Reset Link
          </button>
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
          onThresholdChange={onThresholdChange}
          onResetThresholds={onResetThresholds}
          hasActiveThresholds={hasActiveThresholds}
        />
      </main>
    </div>
  );
};
