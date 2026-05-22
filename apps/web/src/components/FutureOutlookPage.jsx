import { useMemo } from 'react';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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

export const OUTLOOK_INDICATOR_LABELS = {
  affordabilityPressure: 'Affordability',
  familyReadiness: 'Family readiness',
  healthcareResilience: 'Healthcare resilience',
  safetyStability: 'Safety stability',
  environmentalStress: 'Environmental resilience',
};

const OUTLOOK_SHOCK_EFFECTS = {
  none: {},
  inflationWave: { affordabilityPressure: -0.85, familyReadiness: -0.25 },
  railStrike: { affordabilityPressure: -0.25, familyReadiness: -0.2, safetyStability: -0.1 },
  heatwave: { environmentalStress: -0.9, healthcareResilience: -0.65, familyReadiness: -0.2 },
  airportClosure: { affordabilityPressure: -0.18, safetyStability: -0.12 },
  healthcareOverload: { healthcareResilience: -1.1, familyReadiness: -0.3, safetyStability: -0.2 },
};

export const getIndicatorForecastForYear = (indicator, selectedYear, shockType = 'none', shockSeverity = 1) => {
  const forecastPoint = indicator?.forecast?.find((entry) => entry.year === selectedYear)
    ?? indicator?.forecast?.[indicator.forecast.length - 1]
    ?? { year: selectedYear, value: indicator?.current ?? 0, lower: indicator?.current ?? 0, upper: indicator?.current ?? 0 };

  const shockAdjustment = (OUTLOOK_SHOCK_EFFECTS[shockType]?.[indicator?.indicatorKey] ?? 0) * shockSeverity;
  const adjustedValue = clamp((forecastPoint.value ?? indicator?.current ?? 0) + shockAdjustment, 0, 10);

  return {
    year: forecastPoint.year,
    value: Number(adjustedValue.toFixed(2)),
    lower: Number(clamp((forecastPoint.lower ?? forecastPoint.value ?? 0) + shockAdjustment, 0, 10).toFixed(2)),
    upper: Number(clamp((forecastPoint.upper ?? forecastPoint.value ?? 0) + shockAdjustment, 0, 10).toFixed(2)),
    shockAdjustment: Number(shockAdjustment.toFixed(2)),
  };
};

export const summarizeOutlookRow = (row, selectedYear, shockType = 'none', shockSeverity = 1) => {
  const indicators = Array.isArray(row?.indicators) ? row.indicators : [];

  if (indicators.length === 0) {
    return {
      averageCurrent: 0,
      averageProjected: 0,
      delta: 0,
      confidence: 0,
      improvingCount: 0,
      projectedIndicators: [],
    };
  }

  const projectedIndicators = indicators.map((indicator) => {
    const projected = getIndicatorForecastForYear(indicator, selectedYear, shockType, shockSeverity);
    return {
      ...indicator,
      label: OUTLOOK_INDICATOR_LABELS[indicator.indicatorKey] ?? indicator.indicatorKey,
      projected,
      delta: Number((projected.value - (indicator.current ?? 0)).toFixed(2)),
    };
  });

  const averageCurrent = indicators.reduce((sum, indicator) => sum + (indicator.current ?? 0), 0) / indicators.length;
  const averageProjected = projectedIndicators.reduce((sum, indicator) => sum + indicator.projected.value, 0) / indicators.length;
  const confidence = indicators.reduce((sum, indicator) => sum + (indicator.confidence ?? 0), 0) / indicators.length;

  return {
    averageCurrent: Number(averageCurrent.toFixed(2)),
    averageProjected: Number(averageProjected.toFixed(2)),
    delta: Number((averageProjected - averageCurrent).toFixed(2)),
    confidence: Number(confidence.toFixed(2)),
    improvingCount: indicators.filter((indicator) => indicator.trend === 'improving').length,
    projectedIndicators,
  };
};

export const FutureOutlookPage = function futureOutlookPage({
  rows,
  cityOptions,
  selectedCityKey,
  onSelectCity,
  selectedYear,
  onYearChange,
  onBack,
  onGoToMap,
  onGoToFamilyFit,
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
    summary: summarizeOutlookRow(row, selectedYear, shockType, shockSeverity),
  })).sort((left, right) => right.summary.averageProjected - left.summary.averageProjected), [rows, selectedYear, shockSeverity, shockType]);

  const selectedRow = cityRows.find((row) => row.key === selectedCityKey) ?? cityRows[0] ?? null;
  const selectedCityMeta = cityOptions.find((city) => city.key === selectedRow?.key) ?? null;
  const comparisonRows = cityRows.filter((row) => row.key !== selectedRow?.key).slice(0, 3);

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
          <button type="button" className="ws-icon-btn" onClick={onGoToMap}>Map</button>
          <button type="button" className="ws-icon-btn" onClick={onGoToFamilyFit}>Family Fit</button>
          <button type="button" className="ws-icon-btn" onClick={onBack}>← Dashboard</button>
        </div>
      </header>

      <main className="dashboard route-dashboard route-dashboard--outlook">
        <section className="ws-pane route-pane route-pane--first">
          <div className="ws-pane__header"><span className="ws-pane__title">Scenario Controls</span></div>
          <div className="ws-pane__body route-controls-grid">
            <label>
              Focus City
              <select className="ws-select" value={selectedRow?.key ?? ''} onChange={(event) => onSelectCity(event.target.value || null)}>
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
        </section>

        {selectedRow && (
          <section className="ws-atlas-deck" aria-label="Selected city outlook summary">
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
          </section>
        )}

        <section className="route-split-grid route-split-grid--outlook">
          <section className="ws-pane route-split-grid__pane route-split-grid__pane--primary">
            <div className="ws-pane__header"><span className="ws-pane__title">Signal Outlook</span></div>
            <div className="ws-pane__body route-card-stack">
              {selectedRow?.summary.projectedIndicators.map((indicator) => (
                <article key={`${selectedRow.key}-${indicator.indicatorKey}`} className="ws-atlas-deck__card">
                  <span className="ws-atlas-deck__label">{indicator.label}</span>
                  <strong>{indicator.projected.value.toFixed(2)} in {selectedYear}</strong>
                  <small>
                    Current {indicator.current.toFixed(2)} · {trendDirection(indicator)} · {confidenceLabel(indicator.confidence)}
                  </small>
                  <div className="route-chip-row">
                    <span>{indicator.delta >= 0 ? '+' : ''}{indicator.delta.toFixed(2)} delta</span>
                    <span>Band {indicator.projected.lower.toFixed(2)}–{indicator.projected.upper.toFixed(2)}</span>
                    {indicator.projected.shockAdjustment !== 0 && <span>Shock {indicator.projected.shockAdjustment >= 0 ? '+' : ''}{indicator.projected.shockAdjustment.toFixed(2)}</span>}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="ws-pane route-split-grid__pane route-split-grid__pane--secondary">
            <div className="ws-pane__header"><span className="ws-pane__title">Top Projected Cities</span></div>
            <div className="ws-pane__body route-card-stack">
              {cityRows.slice(0, 8).map((row) => (
                <button key={row.key} type="button" className="ws-atlas-deck__card route-card-button" onClick={() => onSelectCity(row.key)}>
                  <span className="ws-atlas-deck__label">{row.city}, {row.country}</span>
                  <strong>{row.summary.averageProjected.toFixed(2)} projected score</strong>
                  <small>Current {row.summary.averageCurrent.toFixed(2)} · {confidenceLabel(row.summary.confidence)}</small>
                </button>
              ))}
            </div>
          </section>
        </section>

        <section className="ws-pane route-pane">
          <div className="ws-pane__header"><span className="ws-pane__title">Closest Alternatives</span></div>
          <div className="ws-pane__body route-grid-cards">
            {comparisonRows.map((row) => (
              <article key={row.key} className="ws-atlas-deck__card">
                <span className="ws-atlas-deck__label">{row.city}, {row.country}</span>
                <strong>{row.summary.averageProjected.toFixed(2)} projected score</strong>
                <small>{row.summary.delta >= 0 ? '+' : ''}{row.summary.delta.toFixed(2)} vs current · {confidenceLabel(row.summary.confidence)}</small>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
