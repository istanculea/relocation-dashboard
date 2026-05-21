import { useMemo } from 'react';

const confidenceLabel = (value) => {
  if (value >= 0.8) return 'High confidence';
  if (value >= 0.6) return 'Medium confidence';
  return 'Low confidence';
};

const trendDirection = (indicator) => {
  if (indicator.trend === 'improving') return 'Improving';
  if (indicator.trend === 'worsening') return 'Worsening';
  return 'Stable';
};

const summarizeCityProjection = (indicators) => {
  if (!Array.isArray(indicators) || indicators.length === 0) {
    return { averageCurrent: 0, averageProjected: 0, confidence: 0 };
  }

  const currentAvg = indicators.reduce((sum, indicator) => sum + (indicator.current ?? 0), 0) / indicators.length;
  const projectedAvg = indicators.reduce((sum, indicator) => {
    const projected = indicator.forecast?.[indicator.forecast.length - 1]?.value ?? indicator.current ?? 0;
    return sum + projected;
  }, 0) / indicators.length;
  const confidence = indicators.reduce((sum, indicator) => sum + (indicator.confidence ?? 0), 0) / indicators.length;

  return {
    averageCurrent: Number(currentAvg.toFixed(2)),
    averageProjected: Number(projectedAvg.toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
  };
};

export const FutureOutlookPage = function futureOutlookPage({
  rows,
  selectedYear,
  onYearChange,
  onBack,
  onShare,
  onResetLink,
  isLinkCustomized,
  shockType,
  shockSeverity,
  onShockTypeChange,
  onShockSeverityChange,
}) {
  const cityRows = useMemo(() => rows.map((row) => ({
    ...row,
    summary: summarizeCityProjection(row.indicators),
  })).sort((left, right) => right.summary.averageProjected - left.summary.averageProjected), [rows]);

  return (
    <div className="app-shell explorer-page-shell">
      <header className="ws-header">
        <div className="ws-header__brand">
          <span className="ws-header__title">Future Outlook</span>
          <span className="ws-header__subtitle">Temporal intelligence, volatility bands, and confidence-aware projections</span>
        </div>
        <div className="ws-header__divider" />
        <div className="ws-header__actions">
          <span className={`ws-link-state ${isLinkCustomized ? 'ws-link-state--customized' : 'ws-link-state--clean'}`}>
            Link: {isLinkCustomized ? 'Customized' : 'Clean'}
          </span>
          <button type="button" className="ws-icon-btn" onClick={onShare}>Share</button>
          <button type="button" className="ws-icon-btn" onClick={onResetLink}>Reset Link</button>
          <button type="button" className="ws-icon-btn" onClick={onBack}>← Dashboard</button>
        </div>
      </header>

      <main className="dashboard" style={{ padding: '1rem 1.25rem' }}>
        <section className="ws-pane" style={{ marginBottom: '0.9rem' }}>
          <div className="ws-pane__header"><span className="ws-pane__title">Scenario Controls</span></div>
          <div className="ws-pane__body" style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
        </section>

        <section className="ws-pane">
          <div className="ws-pane__header"><span className="ws-pane__title">Top Projected Stability</span></div>
          <div className="ws-pane__body" style={{ display: 'grid', gap: '0.75rem' }}>
            {cityRows.slice(0, 12).map((row) => (
              <article key={row.key} className="ws-atlas-deck__card">
                <span className="ws-atlas-deck__label">{row.city}, {row.country}</span>
                <strong>{row.summary.averageProjected.toFixed(2)} projected score</strong>
                <small>Current {row.summary.averageCurrent.toFixed(2)} · {confidenceLabel(row.summary.confidence)}</small>
                <div style={{ marginTop: '0.4rem', display: 'grid', gap: '0.2rem' }}>
                  {row.indicators.slice(0, 3).map((indicator) => (
                    <span key={`${row.key}-${indicator.indicatorKey}`}>{indicator.indicatorKey}: {trendDirection(indicator)} · {indicator.forecast?.[indicator.forecast.length - 1]?.value?.toFixed(2) ?? 'n/a'}</span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
