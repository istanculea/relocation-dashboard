/**
 * ComparisonTray.jsx — src/components/
 *
 * Sticky side-by-side overlay that renders up to 3 pinned (shortlisted) cities
 * in parallel columns, colour-coding min/max values per strategic pillar.
 *
 * ── Integration points ──────────────────────────────────────────────────────
 * • Import and render inside App.jsx, placed just before </div> of .app-shell.
 * • Reads shortlistedCityKeys from DashboardContext (useShortlist hook).
 * • Receives `allRows` (scoreRankingRows from App.jsx) to look up city data.
 *
 * Example usage in App.jsx:
 *   import { ComparisonTray } from './components/ComparisonTray.jsx';
 *   // inside JSX:
 *   <ComparisonTray allRows={scoreRankingRows} />
 *
 * ── Pin toggle on row tables ─────────────────────────────────────────────────
 * Add a <PinToggle cityKey={row.key} /> anywhere inside a row component.
 * It reads/writes shortlistedCityKeys through the DashboardContext.
 */

import { useMemo } from 'react';
import { useShortlist } from '../context/DashboardContext.jsx';

// ---------------------------------------------------------------------------
// PinToggle — inline checkbox used on row/card components
// ---------------------------------------------------------------------------

/**
 * PinToggle
 *
 * Renders a "Pin to Compare" checkbox. Place inside any city row or card.
 *
 * @param {{ cityKey: string, label?: string }} props
 */
export const PinToggle = ({ cityKey, label = 'Pin' }) => {
  const { shortlistedCityKeys, toggle, isFull } = useShortlist();
  const isPinned = shortlistedCityKeys.includes(cityKey);

  return (
    <label
      className={`pin-toggle${isPinned ? ' pin-toggle--active' : ''}${
        isFull && !isPinned ? ' pin-toggle--disabled' : ''
      }`}
      title={
        isPinned
          ? 'Remove from comparison tray'
          : isFull
            ? 'Comparison tray is full (max 3)'
            : 'Add to comparison tray'
      }
      role="button"
      aria-pressed={isPinned}
    >
      <input
        type="checkbox"
        checked={isPinned}
        disabled={isFull && !isPinned}
        onChange={() => toggle(cityKey)}
        className="pin-toggle__input"
        aria-label={`${isPinned ? 'Unpin' : 'Pin'} ${label} for side-by-side comparison`}
      />
      <span className="pin-toggle__icon" aria-hidden="true">
        {isPinned ? '📌' : '⊕'}
      </span>
      <span className="pin-toggle__label">{isPinned ? 'Pinned' : label}</span>
    </label>
  );
};

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const PILLAR_KEYS = [
  'euRegistration',
  'diplomaRecognition',
  'realEstateHousing',
  'rentalMarket',
  'homeOwnership',
  'locationInfra',
  'cleanBasket',
  'childcareEducation',
  'healthMedical',
  'envPollution',
  'criminalityStreetSafe',
  'mobilityLogistics',
  'economyJobsTaxes',
  'climateResilience',
  'socialCapital',
];

const PILLAR_LABELS = {
  euRegistration:        'Residency',
  diplomaRecognition:    'Diploma',
  realEstateHousing:     'Real Estate',
  rentalMarket:          'Rental',
  homeOwnership:         'Ownership',
  locationInfra:         'Location',
  cleanBasket:           'Basket',
  childcareEducation:    'Childcare',
  healthMedical:         'Healthcare',
  envPollution:          'Pollution',
  criminalityStreetSafe: 'Safety',
  mobilityLogistics:     'Mobility',
  economyJobsTaxes:      'Economy',
  climateResilience:     'Climate',
  socialCapital:         'Social',
};

/** Extract pillar score map from a city row's strategicBalance */
const getPillarMap = (row) => {
  const pillars = row?.strategicBalance?.pillars ?? [];
  const map = new Map();

  for (const p of pillars) {
    if (p.key && PILLAR_KEYS.includes(p.key)) {
      map.set(p.key, Number(p.score) || 0);
    }
  }

  return map;
};

/** Compute per-pillar min/max indices across the pinned city set */
const buildMinMaxMap = (pinnedRows) => {
  const result = {};

  for (const key of PILLAR_KEYS) {
    const scores = pinnedRows.map((row) => getPillarMap(row).get(key) ?? 0);
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    result[key] = { max, min, tied: max === min };
  }

  return result;
};

const scoreColour = (score, key, minMaxMap) => {
  const { max, min, tied } = minMaxMap[key] ?? {};
  if (tied) return 'tray-cell--neutral';
  if (score >= max) return 'tray-cell--best';
  if (score <= min) return 'tray-cell--worst';
  return 'tray-cell--mid';
};

const formatScore = (v) => (Number.isFinite(v) ? Number(v).toFixed(1) : '—');

// ---------------------------------------------------------------------------
// ComparisonTray
// ---------------------------------------------------------------------------

/**
 * ComparisonTray
 *
 * Sticky overlay panel showing pinned cities side-by-side.
 * Slides in from the bottom when shortlistedCityKeys has at least 1 entry.
 *
 * @param {{ allRows: object[] }} props  allRows = scoreRankingRows from App.jsx
 */
export const ComparisonTray = ({ allRows = [] }) => {
  const { shortlistedCityKeys, clear, toggle } = useShortlist();

  const pinnedRows = useMemo(
    () =>
      shortlistedCityKeys
        .map((k) => allRows.find((r) => r.key === k))
        .filter(Boolean),
    [shortlistedCityKeys, allRows],
  );

  const minMaxMap = useMemo(() => buildMinMaxMap(pinnedRows), [pinnedRows]);

  if (!pinnedRows.length) return null;

  return (
    <div
      className={`comparison-tray${pinnedRows.length ? ' comparison-tray--visible' : ''}`}
      role="region"
      aria-label="Side-by-side city comparison tray"
    >
      {/* ── Tray header ──────────────────────────────────────────────── */}
      <div className="comparison-tray__header">
        <span className="comparison-tray__title">
          Comparing {pinnedRows.length} {pinnedRows.length === 1 ? 'city' : 'cities'}
        </span>
        <span className="comparison-tray__legend">
          <span className="tray-legend tray-legend--best">Best</span>
          <span className="tray-legend tray-legend--worst">Worst</span>
        </span>
        <button
          type="button"
          className="comparison-tray__clear"
          onClick={clear}
          aria-label="Clear all pinned cities"
        >
          Clear all
        </button>
      </div>

      {/* ── Column grid ─────────────────────────────────────────────── */}
      <div
        className="comparison-tray__grid"
        style={{ gridTemplateColumns: `minmax(120px,1fr) repeat(${pinnedRows.length}, minmax(140px,1fr))` }}
      >
        {/* Row-label column */}
        <div className="comparison-tray__col comparison-tray__col--labels">
          <div className="tray-cell tray-cell--head">&nbsp;</div>
          <div className="tray-cell tray-cell--sub">Overall</div>
          <div className="tray-cell tray-cell--sub">Budget / mo</div>
          {PILLAR_KEYS.map((key) => (
            <div key={key} className="tray-cell tray-cell--pillar-label">
              {PILLAR_LABELS[key]}
            </div>
          ))}
        </div>

        {/* One data column per pinned city */}
        {pinnedRows.map((row) => {
          const pillarMap = getPillarMap(row);
          const overall   = row.activeWeightedScore ?? row.strategicBalance?.weightedScore ?? 0;
          const budget    = row.scenarioBudget;

          return (
            <div key={row.key} className="comparison-tray__col">
              {/* City name + unpin button */}
              <div className="tray-cell tray-cell--head">
                <span className="tray-city-name">{row.city}</span>
                <button
                  type="button"
                  className="tray-unpin"
                  onClick={() => toggle(row.key)}
                  aria-label={`Unpin ${row.city}`}
                  title="Remove from tray"
                >
                  ✕
                </button>
              </div>

              {/* Overall score */}
              <div className="tray-cell tray-cell--score">
                {formatScore(overall)}
              </div>

              {/* Budget */}
              <div className="tray-cell tray-cell--budget">
                {budget ? `€${Number(budget).toLocaleString('en-IE')}` : '—'}
              </div>

              {/* Pillar scores with colour coding */}
              {PILLAR_KEYS.map((key) => {
                const score = pillarMap.get(key) ?? 0;

                return (
                  <div
                    key={key}
                    className={`tray-cell tray-cell--pillar ${scoreColour(score, key, minMaxMap)}`}
                    title={`${PILLAR_LABELS[key]}: ${formatScore(score)}`}
                  >
                    {/* Inline SVG bar for visual weight */}
                    <span className="tray-bar-wrap" aria-hidden="true">
                      <svg viewBox="0 0 60 8" className="tray-bar">
                        <rect x="0" y="0" width="60" height="8" className="tray-bar__track" rx="3" />
                        <rect
                          x="0"
                          y="0"
                          width={Math.max(2, (score / 10) * 60)}
                          height="8"
                          className="tray-bar__fill"
                          rx="3"
                        />
                      </svg>
                    </span>
                    <span className="tray-score-val">{formatScore(score)}</span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
