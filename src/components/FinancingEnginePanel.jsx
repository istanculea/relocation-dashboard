/**
 * FinancingEnginePanel.jsx — src/components/
 *
 * Interactive affordability calculator supporting:
 *   • Single-income mode — one salary vs oneParent living costs
 *   • Dual-income mode   — two salaries combined vs bothWorking living costs
 *
 * Derives estimated net take-home (after tax + social contributions),
 * monthly discretionary income (surplus / deficit), and a Housing & Living
 * Costs pillar score adjustment (±1.5 max).
 */

import { useState, useMemo } from 'react';
import {
  SECTOR_BASELINES,
  SECTOR_KEYS,
  computeNetSalary,
  computeDiscretionaryIncome,
  applyFinancingAdjustment,
} from '../data/engines/financingEngine.js';

/* ─── helpers ───────────────────────────────────────────────────────────── */

const fmt = (n) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtDelta = (delta) =>
  delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

const fmtPct = (rate) => `${rate}%`;

/* ─── sub-components ────────────────────────────────────────────────────── */

function SurplusBar({ discretionary }) {
  const MAX = 3000;
  const pct = Math.abs(discretionary) / MAX;
  const capped = Math.min(pct, 1);
  const positive = discretionary >= 0;

  return (
    <div className="fin-bar" aria-label={`Discretionary income: ${fmt(discretionary)}`}>
      <div className={`fin-bar__track fin-bar__track--${positive ? 'surplus' : 'deficit'}`}>
        <div
          className={`fin-bar__fill fin-bar__fill--${positive ? 'surplus' : 'deficit'}`}
          style={{ width: `${capped * 100}%` }}
        />
      </div>
      <span className={`fin-bar__label fin-bar__label--${positive ? 'surplus' : 'deficit'}`}>
        {positive ? 'Surplus' : 'Deficit'} {fmt(Math.abs(discretionary))} / mo
      </span>
    </div>
  );
}

function ScoreDeltaBadge({ delta }) {
  if (Math.abs(delta) < 0.05) {
    return <span className="fin-badge fin-badge--neutral">Score unchanged</span>;
  }
  const positive = delta > 0;
  return (
    <span className={`fin-badge fin-badge--${positive ? 'positive' : 'negative'}`}>
      Housing score {fmtDelta(delta)} pts
    </span>
  );
}

function SalaryInputGroup({ label, sector, grossSalary, onSectorChange, onSalaryChange, country }) {
  const handleSectorChange = (e) => {
    const next = e.target.value;
    onSectorChange(next);
    onSalaryChange(SECTOR_BASELINES[next]?.median ?? 3000);
  };

  const netSalary = computeNetSalary(grossSalary, country);
  const effectiveRate = Math.round(
    ((grossSalary - netSalary) / Math.max(grossSalary, 1)) * 100,
  );

  return (
    <div className="fin-salary-group">
      <p className="fin-salary-group__label">{label}</p>
      <div className="fin-controls">
        <label className="selector-field fin-field">
          <span>Sector</span>
          <select value={sector} onChange={handleSectorChange}>
            {SECTOR_KEYS.map((key) => (
              <option key={key} value={key}>{key}</option>
            ))}
          </select>
        </label>

        <label className="selector-field fin-field">
          <span>Gross monthly (€)</span>
          <input
            type="number"
            min="500"
            max="20000"
            step="100"
            value={grossSalary}
            onChange={(e) => onSalaryChange(Number(e.target.value) || 0)}
            className="fin-input"
          />
        </label>

        <label className="selector-field fin-field">
          <span>Salary preset</span>
          <div className="fin-presets">
            {['p25', 'median', 'p75'].map((band) => (
              <button
                key={band}
                type="button"
                className="toggle toggle--secondary fin-preset"
                onClick={() => onSalaryChange(SECTOR_BASELINES[sector]?.[band] ?? 3000)}
              >
                {band === 'p25' ? 'P25' : band === 'median' ? 'Median' : 'P75'}
              </button>
            ))}
          </div>
        </label>
      </div>
      <p className="fin-inline-net">
        Est. net: <strong>{fmt(netSalary)}</strong>
        <span className="fin-tax-note">({fmtPct(effectiveRate)} effective rate)</span>
      </p>
    </div>
  );
}

/* ─── main component ────────────────────────────────────────────────────── */

export const FinancingEnginePanel = function financingEnginePanel({ city, scenarioKey = 'oneParent' }) {
  if (!city) return null;

  const [incomeMode, setIncomeMode] = useState('single');

  const [sector1, setSector1] = useState('Tech');
  const [grossSalary1, setGrossSalary1] = useState(
    () => SECTOR_BASELINES['Tech']?.median ?? 3000,
  );

  const [sector2, setSector2] = useState('Tech');
  const [grossSalary2, setGrossSalary2] = useState(
    () => SECTOR_BASELINES['Tech']?.median ?? 3000,
  );

  const isDual = incomeMode === 'dual';
  const budgetKey = isDual ? 'bothWorking' : 'oneParent';

  const result = useMemo(() => {
    const row = { ...city, scenarioBudget: city.budgets?.[budgetKey]?.midpoint ?? 3000 };
    return applyFinancingAdjustment(row, {
      sector: sector1,
      grossSalary: grossSalary1,
      scenarioKey: budgetKey,
      grossSalary2: isDual ? grossSalary2 : undefined,
    });
  }, [city, sector1, grossSalary1, sector2, grossSalary2, isDual, budgetKey]);

  const country = city.country ?? '';
  const net1 = computeNetSalary(grossSalary1, country);
  const net2 = isDual ? computeNetSalary(grossSalary2, country) : 0;
  const combinedNet = net1 + net2;
  const budgetMidpoint = city.budgets?.[budgetKey]?.midpoint ?? 3000;
  const discretionary = computeDiscretionaryIncome(combinedNet, budgetMidpoint);

  const originalPillar = city.strategicBalance?.pillars?.[0]?.score ?? 0;
  const adjustedPillar = result.strategicBalance?.pillars?.[0]?.score ?? originalPillar;
  const delta = adjustedPillar - originalPillar;

  return (
    <section className="panel financing-panel" aria-label={`Affordability calculator for ${city.city}`}>
      <div className="section-title">
        <p>Affordability Calculator</p>
        <h3>Salary → Discretionary Income — {city.city}</h3>
        <span>
          Enter your salary details to see your estimated take-home, monthly surplus or deficit
          against this city&apos;s living costs, and the resulting housing score adjustment.
        </span>
      </div>

      {/* Income mode toggle */}
      <div className="fin-mode-toggle" role="group" aria-label="Income mode">
        <button
          type="button"
          className={`fin-mode-btn${!isDual ? ' fin-mode-btn--active' : ''}`}
          onClick={() => setIncomeMode('single')}
        >
          Single income
        </button>
        <button
          type="button"
          className={`fin-mode-btn${isDual ? ' fin-mode-btn--active' : ''}`}
          onClick={() => setIncomeMode('dual')}
        >
          Dual income
        </button>
      </div>

      {/* Salary inputs */}
      <SalaryInputGroup
        label={isDual ? 'Person 1' : 'Your salary'}
        sector={sector1}
        grossSalary={grossSalary1}
        onSectorChange={setSector1}
        onSalaryChange={setGrossSalary1}
        country={country}
      />

      {isDual && (
        <SalaryInputGroup
          label="Person 2"
          sector={sector2}
          grossSalary={grossSalary2}
          onSectorChange={setSector2}
          onSalaryChange={setGrossSalary2}
          country={country}
        />
      )}

      {/* Results */}
      <div className="fin-results">
        {isDual ? (
          <>
            <div className="fin-stat">
              <span>Combined gross</span>
              <strong>{fmt(grossSalary1 + grossSalary2)}</strong>
            </div>
            <div className="fin-stat">
              <span>Person 1 net</span>
              <strong>{fmt(net1)}</strong>
            </div>
            <div className="fin-stat">
              <span>Person 2 net</span>
              <strong>{fmt(net2)}</strong>
            </div>
            <div className="fin-stat">
              <span>Combined net</span>
              <strong>{fmt(combinedNet)}</strong>
            </div>
          </>
        ) : (
          <>
            <div className="fin-stat">
              <span>Gross monthly</span>
              <strong>{fmt(grossSalary1)}</strong>
            </div>
            <div className="fin-stat">
              <span>Est. net take-home</span>
              <strong>{fmt(net1)}</strong>
            </div>
          </>
        )}
        <div className="fin-stat">
          <span>City costs ({isDual ? 'dual household' : 'single income'})</span>
          <strong>{fmt(budgetMidpoint)}</strong>
        </div>
        <div className="fin-stat fin-stat--highlight">
          <span>Monthly discretionary</span>
          <strong className={discretionary >= 0 ? 'fin-positive' : 'fin-negative'}>
            {fmt(discretionary)}
          </strong>
        </div>
      </div>

      <SurplusBar discretionary={discretionary} />
      <ScoreDeltaBadge delta={delta} />

      <p className="fin-disclaimer">
        Tax model is a simplified bracket approximation for illustrative purposes only — not financial or legal advice.
        Effective rates vary by individual circumstances.
      </p>
    </section>
  );
};
