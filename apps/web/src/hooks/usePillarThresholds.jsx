/**
 * usePillarThresholds.js — src/hooks/
 *
 * Manages "At Least" minimum threshold state for the 5 classic scoring pillars.
 * Cities failing any threshold are excluded from the filtered comparison rows.
 *
 * Usage
 * ─────
 *   const { thresholds, setThreshold, resetThresholds, matchesThresholds }
 *     = usePillarThresholds();
 *
 *   // In filteredComparisonRows memo:
 *   const filteredRows = useMemo(
 *     () => rows.filter(row => matchesThresholds(row) && matchesSearch(row) && ...),
 *     [rows, matchesThresholds, ...],
 *   );
 *
 * Notes
 * ─────
 * • Default threshold for every pillar is 0 (no filtering).
 * • Each slider should emit values on [0, 100] (mapped from 0-10 score scale internally).
 * • matchesThresholds is memoised and stable — it only invalidates when a threshold changes.
 * • Pillar scores on city rows live under `row.scores.{pillar}` (0-10 scale).
 */

import { useCallback, useMemo, useState } from 'react';

// ---------------------------------------------------------------------------
// Pillar definitions
// ---------------------------------------------------------------------------

export const THRESHOLD_PILLARS = [
  { key: 'housing',     label: 'Housing',     path: (row) => row.scores?.housing     ?? 0 },
  { key: 'environment', label: 'Environment', path: (row) => row.scores?.environment ?? 0 },
  { key: 'childcare',   label: 'Childcare',   path: (row) => row.scores?.childcare   ?? 0 },
  { key: 'safety',      label: 'Safety',      path: (row) => row.scores?.safety      ?? 0 },
  { key: 'healthcare',  label: 'Healthcare',  path: (row) => row.scores?.healthcare  ?? 0 },
];

const INITIAL_THRESHOLDS = Object.fromEntries(
  THRESHOLD_PILLARS.map(({ key }) => [key, 0]),
);

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * usePillarThresholds()
 *
 * @returns {{
 *   thresholds:        Record<string, number>,  // 0-10 scale
 *   setThreshold:      (key: string, value: number) => void,
 *   resetThresholds:   () => void,
 *   matchesThresholds: (row: object) => boolean,
 *   hasActiveThresholds: boolean,
 * }}
 */
const usePillarThresholds = () => {
  const [thresholds, setThresholds] = useState({ ...INITIAL_THRESHOLDS });

  const setThreshold = useCallback((key, value) => {
    setThresholds((prev) => ({ ...prev, [key]: Number(value) }));
  }, []);

  const resetThresholds = useCallback(() => {
    setThresholds({ ...INITIAL_THRESHOLDS });
  }, []);

  // Stable predicate; only changes when thresholds object changes
  const matchesThresholds = useCallback(
    (row) => {
      for (const { key, path } of THRESHOLD_PILLARS) {
        const min = thresholds[key] ?? 0;

        if (min <= 0) continue; // no constraint set for this pillar

        const score = path(row);

        if (score < min) return false;
      }

      return true;
    },
    [thresholds],
  );

  const hasActiveThresholds = useMemo(
    () => THRESHOLD_PILLARS.some(({ key }) => (thresholds[key] ?? 0) > 0),
    [thresholds],
  );

  return {
    thresholds,
    setThreshold,
    resetThresholds,
    matchesThresholds,
    hasActiveThresholds,
  };
};

export default usePillarThresholds;

// ---------------------------------------------------------------------------
// PillarThresholdSliders — a ready-to-use UI block
// ---------------------------------------------------------------------------

/**
 * PillarThresholdSliders
 *
 * Renders a compact column of labelled range sliders (0-10) for each pillar.
 * Drop this inside the primary workstation filter section.
 *
 * Integration in WorkstationLayout.jsx:
 *   import { PillarThresholdSliders } from '../hooks/usePillarThresholds.js';
 *
 *   <PillarThresholdSliders
 *     thresholds={thresholds}
 *     onThresholdChange={setThreshold}
 *     onReset={resetThresholds}
 *     hasActive={hasActiveThresholds}
 *   />
 */
export const PillarThresholdSliders = ({
  thresholds,
  onThresholdChange,
  onReset,
  hasActive,
}) => (
  <div className="threshold-sliders" aria-label="Minimum pillar score filters">
    <div className="threshold-sliders__header">
      <span className="threshold-sliders__title">Minimum Score Gates</span>
      {hasActive && (
        <button
          type="button"
          className="threshold-sliders__reset"
          onClick={onReset}
        >
          Reset Gates
        </button>
      )}
    </div>

    {THRESHOLD_PILLARS.map(({ key, label }) => {
      const value = thresholds[key] ?? 0;

      return (
        <label key={key} className="threshold-slider-row">
          <span className="threshold-slider-row__label">{label}</span>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={value}
            onChange={(e) => onThresholdChange(key, parseFloat(e.target.value))}
            className="threshold-slider-row__input"
            aria-label={`Minimum ${label} score: ${value}`}
          />
          <span className="threshold-slider-row__value">
            {value > 0 ? `≥ ${value.toFixed(1)}` : 'Off'}
          </span>
        </label>
      );
    })}
  </div>
);
