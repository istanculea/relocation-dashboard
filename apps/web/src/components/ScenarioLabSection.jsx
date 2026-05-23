import { useMemo, useState } from 'react';
import { summarizeOutlookRow } from './FutureOutlookPage.jsx';

const confidenceLabel = (value) => {
  if (value >= 0.8) return 'High confidence';
  if (value >= 0.6) return 'Medium confidence';
  return 'Low confidence';
};

export const ScenarioLabSection = function scenarioLabSection({
  rows,
  cityOptions,
  selectedCityKey,
  onSelectCity,
  selectedYear,
  onYearChange,
  shockType,
  shockSeverity,
  onShockTypeChange,
  onShockSeverityChange,
  presets = [],
  selectedPresetKey = 'custom',
  onApplyPreset = () => {},
  savedRuns = [],
  activeRun = null,
  onSaveRun = () => {},
  onLoadRun = () => {},
  onDeleteRun = () => {},
}) {
  const [runName, setRunName] = useState('');
  const [selectedRunId, setSelectedRunId] = useState('');

  const cityRows = useMemo(() => rows.map((row) => ({
    ...row,
    summary: summarizeOutlookRow(row, selectedYear, shockType, shockSeverity),
  })).sort((left, right) => right.summary.averageProjected - left.summary.averageProjected), [rows, selectedYear, shockSeverity, shockType]);

  const selectedRow = cityRows.find((row) => row.key === selectedCityKey) ?? cityRows[0] ?? null;
  const selectedCityMeta = cityOptions.find((city) => city.key === selectedRow?.key) ?? null;
  const activeRunCity = cityOptions.find((city) => city.key === activeRun?.selectedCityKey) ?? null;
  const activeRunDate = activeRun?.createdAt ? new Date(activeRun.createdAt) : null;
  const activeRunDateLabel = activeRunDate && Number.isFinite(activeRunDate.getTime())
    ? activeRunDate.toLocaleString()
    : 'Unknown time';

  if (!selectedRow) {
    return (
      <section className="ws-pane ws-pane--scenario-lab" id="sec-scenario-lab" aria-label="Scenario lab">
        <div className="ws-pane__header">
          <span className="ws-pane__title">Scenario Lab</span>
        </div>
        <div className="ws-pane__body">
          <p className="ws-control-hint">No forecast rows available yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ws-pane ws-pane--scenario-lab" id="sec-scenario-lab" aria-label="Scenario lab">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Scenario Lab</span>
      </div>
      <div className="ws-pane__body ws-scenario-lab">
        <div className="ws-scenario-lab__controls">
          <label>
            Preset
            <select
              className="ws-select"
              value={selectedPresetKey}
              onChange={(event) => onApplyPreset(event.target.value)}
              aria-label="Scenario lab preset"
            >
              <option value="custom">Custom</option>
              {presets.map((preset) => (
                <option key={preset.key} value={preset.key}>{preset.label}</option>
              ))}
            </select>
          </label>
          <label>
            Focus City
            <select className="ws-select" value={selectedRow.key} onChange={(event) => onSelectCity(event.target.value || null)}>
              {cityRows.map((row) => (
                <option key={row.key} value={row.key}>{row.city}, {row.country}</option>
              ))}
            </select>
          </label>
          <label>
            Projection Year
            <input type="range" min="2026" max="2031" step="1" value={selectedYear} onChange={(event) => onYearChange(Number(event.target.value))} />
            <div>{selectedYear}</div>
          </label>
          <label>
            Strategic Event
            <select className="ws-select" value={shockType} onChange={(event) => onShockTypeChange(event.target.value)}>
              <option value="none">No event shock</option>
              <option value="inflationWave">Inflation wave</option>
              <option value="railStrike">Rail strike</option>
              <option value="heatwave">Heatwave</option>
              <option value="airportClosure">Airport closure</option>
              <option value="healthcareOverload">Healthcare overload</option>
            </select>
          </label>
          <label>
            Shock Severity
            <input type="range" min="0.5" max="2" step="0.1" value={shockSeverity} onChange={(event) => onShockSeverityChange(Number(event.target.value))} />
            <div>{shockSeverity.toFixed(1)}x</div>
          </label>
        </div>

        <div className="ws-scenario-lab__controls">
          <label>
            Save Current Run
            <input
              className="ws-input"
              type="text"
              value={runName}
              maxLength={80}
              placeholder="Optional run label"
              aria-label="Scenario run label"
              onChange={(event) => setRunName(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="ws-chip-button"
            onClick={() => {
              onSaveRun(runName);
              setRunName('');
            }}
          >
            Save Run
          </button>
          <label>
            Saved Runs
            <select
              className="ws-select"
              value={selectedRunId}
              onChange={(event) => setSelectedRunId(event.target.value)}
              aria-label="Scenario saved runs"
            >
              <option value="">Select saved run</option>
              {savedRuns.map((run) => (
                <option key={run.id} value={run.id}>{run.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="ws-chip-button"
            onClick={() => {
              if (selectedRunId) {
                onLoadRun(selectedRunId);
              }
            }}
            disabled={!selectedRunId}
          >
            Load Run
          </button>
          <button
            type="button"
            className="ws-chip-button ws-chip-button--danger"
            onClick={() => {
              if (selectedRunId) {
                onDeleteRun(selectedRunId);
                setSelectedRunId('');
              }
            }}
            disabled={!selectedRunId}
          >
            Delete Run
          </button>
        </div>

        <div className="ws-atlas-deck" aria-label="Scenario lab summary">
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Focus City</span>
            <strong>{selectedRow.city}, {selectedRow.country}</strong>
            <small>{selectedCityMeta?.activeLensLabel ?? 'Balanced'} lens</small>
          </article>
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Projected Score</span>
            <strong>{selectedRow.summary.averageProjected.toFixed(2)}</strong>
            <small>{selectedYear} outlook · {selectedRow.summary.delta >= 0 ? '+' : ''}{selectedRow.summary.delta.toFixed(2)} vs current</small>
          </article>
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Confidence</span>
            <strong>{confidenceLabel(selectedRow.summary.confidence)}</strong>
            <small>{(selectedRow.summary.confidence * 100).toFixed(0)}% evidence confidence</small>
          </article>
          <article className="ws-atlas-deck__card">
            <span className="ws-atlas-deck__label">Improving Signals</span>
            <strong>{selectedRow.summary.improvingCount}/{selectedRow.summary.projectedIndicators.length}</strong>
            <small>{shockType === 'none' ? 'Baseline forecast' : `${shockType} stress scenario`}</small>
          </article>
        </div>

        {activeRun && (
          <div className="ws-scenario-lab__run-chips" aria-label="Scenario active run context">
            <span className="ws-scenario-lab__run-chip">Run: {activeRun.name}</span>
            <span className="ws-scenario-lab__run-chip">Saved: {activeRunDateLabel}</span>
            <span className="ws-scenario-lab__run-chip">
              City: {activeRunCity ? `${activeRunCity.city}, ${activeRunCity.country}` : (activeRun.selectedCityKey ?? 'None')}
            </span>
          </div>
        )}

        <div className="ws-scenario-lab__signals">
          {selectedRow.summary.projectedIndicators.map((indicator) => (
            <article key={`${selectedRow.key}-${indicator.indicatorKey}`} className="ws-atlas-deck__card ws-scenario-lab__signal-card">
              <span className="ws-atlas-deck__label">{indicator.label}</span>
              <strong>{indicator.projected.value.toFixed(2)} in {selectedYear}</strong>
              <small>
                Current {indicator.current.toFixed(2)} · {indicator.trend} trend · {confidenceLabel(indicator.confidence)}
              </small>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
