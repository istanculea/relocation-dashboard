/**
 * SimulationEngine.jsx — src/components/
 *
 * Interactive "What-If" lifestyle inflation simulator.
 *
 * Renders UI sliders for global cost-modifier variables (grocery inflation,
 * rent shift, etc.) and writes them to the global simulationModifiers context.
 * Any useMemo that depends on simulationModifiers will re-run automatically.
 *
 * ── Integration ──────────────────────────────────────────────────────────────
 * File: src/components/SimulationEngine.jsx
 *
 * Render inside App.jsx (e.g., below the StrategicBalanceMatrix section):
 *   import { SimulationEngine } from './components/SimulationEngine.jsx';
 *   <SimulationEngine />
 *
 * How filteredComparisonRows should consume simulationModifiers:
 * ─────────────────────────────────────────────────────────────
 * In App.jsx, import applySimulationModifiers from this file and apply it
 * inside the scoreRankingRows memo:
 *
 *   import { applySimulationModifiers } from './components/SimulationEngine.jsx';
 *   const { simulationModifiers } = useDashboardState();
 *
 *   const scoreRankingRows = useMemo(
 *     () =>
 *       buildRanking(lensKey).map((city) => {
 *         const base = { ...city, ... };
 *         return applySimulationModifiers(base, simulationModifiers, scenarioKey);
 *       }),
 *     [lensKey, scenarioKey, verifiedSnapshotByKey, simulationModifiers],
 *   );
 *
 * ── Zero API calls, zero external libraries ──────────────────────────────────
 */

import { useCallback } from 'react';
import { useSimulation } from '../context/DashboardContext.jsx';
export { applySimulationModifiers } from '../utils/simulationModifiers.js';

// ---------------------------------------------------------------------------
// Slider definitions
// ---------------------------------------------------------------------------

const SLIDERS = [
  {
    key:   'groceryInflation',
    label: 'Grocery inflation',
    unit:  '%',
    min:   -20,
    max:   +40,
    step:  1,
    zero:  0,
    hint:  'Global grocery price change applied to all cities (e.g. +10 = 10% more expensive).',
  },
  {
    key:   'rentShift',
    label: 'Rent shift',
    unit:  '%',
    min:   -20,
    max:   +40,
    step:  1,
    zero:  0,
    hint:  'Shifts rent mid-ranges up or down across all cities.',
  },
  {
    key:   'childcareShift',
    label: 'Childcare cost shift',
    unit:  '%',
    min:   -30,
    max:   +50,
    step:  1,
    zero:  0,
    hint:  'Models planned nursery fee increases or decreases.',
  },
  {
    key:   'transportShift',
    label: 'Transport cost shift',
    unit:  '%',
    min:   -10,
    max:   +30,
    step:  1,
    zero:  0,
    hint:  'Adjusts monthly transit pass and car costs.',
  },
  {
    key:   'healthcareShift',
    label: 'Private health cover shift',
    unit:  '%',
    min:   -10,
    max:   +40,
    step:  1,
    zero:  0,
    hint:  'Models private health insurance premium changes.',
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * SimulationEngine
 *
 * Renders a panel of cost-modifier sliders wired to DashboardContext.
 * No props required — reads and writes from context internally.
 */
export const SimulationEngine = () => {
  const { simulationModifiers, setMod, reset } = useSimulation();

  const isModified = Object.values(simulationModifiers).some((v) => v !== 0);

  const handleChange = useCallback(
    (key, e) => setMod(key, parseFloat(e.target.value)),
    [setMod],
  );

  return (
    <section className="simulation-engine panel" aria-label="What-If lifestyle inflation simulator">
      <header className="simulation-engine__header">
        <h3 className="simulation-engine__title">Scenario Stress Test</h3>
        <p className="simulation-engine__subtitle">
          Apply global cost shifts to pressure-test rankings and monthly budgets.
        </p>
        {isModified && (
          <button
            type="button"
            className="simulation-engine__reset"
            onClick={reset}
            aria-label="Reset all simulation modifiers to zero"
          >
            Reset all
          </button>
        )}
      </header>

      <div className="simulation-engine__sliders">
        {SLIDERS.map(({ key, label, unit, min, max, step, hint }) => {
          const value = simulationModifiers[key] ?? 0;
          const isActive = value !== 0;

          return (
            <div
              key={key}
              className={`sim-slider-row${isActive ? ' sim-slider-row--active' : ''}`}
            >
              <label className="sim-slider-row__label" htmlFor={`sim-slider-${key}`}>
                {label}
              </label>

              <div className="sim-slider-row__control">
                <input
                  id={`sim-slider-${key}`}
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => handleChange(key, e)}
                  className="sim-slider-row__input"
                  aria-valuetext={`${value >= 0 ? '+' : ''}${value}${unit}`}
                  aria-label={`${label}: ${value >= 0 ? '+' : ''}${value}${unit}`}
                />

                {/* Zero-anchor tick mark */}
                <span
                  className="sim-slider-zero-tick"
                  aria-hidden="true"
                  style={{
                    left: `${((0 - min) / (max - min)) * 100}%`,
                  }}
                />
              </div>

              <output
                className={`sim-slider-row__value${isActive ? (value > 0 ? ' sim-slider-row__value--up' : ' sim-slider-row__value--down') : ''}`}
                htmlFor={`sim-slider-${key}`}
                aria-live="polite"
              >
                {value >= 0 ? '+' : ''}{value}{unit}
              </output>

              <p className="sim-slider-row__hint">{hint}</p>
            </div>
          );
        })}
      </div>

      {isModified && (
        <p className="simulation-engine__notice" role="status" aria-live="polite">
          Simulation active: scores and budget midpoints include these modifiers.
        </p>
      )}
    </section>
  );
};
