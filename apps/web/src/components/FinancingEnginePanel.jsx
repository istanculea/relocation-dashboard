/**
 * FinancingEnginePanel.jsx - src/components/
 *
 * Interactive affordability calculator supporting:
 *   - Single-income mode: one salary vs oneParent living costs
 *   - Dual-income mode: two salaries combined vs bothWorking living costs
 */

import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_FINANCING_ASSUMPTIONS,
  SECTOR_BASELINES,
  SECTOR_KEYS,
  computeNetSalary,
  computeDiscretionaryIncome,
  computeAssumptionAdjustedBudget,
  applyFinancingAdjustment,
} from '../data/engines/financingEngine.js';
import { computeSalaryEquivalence } from '../data/engines/salaryEquivalenceEngine.js';

const fmt = (n) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

const fmtDelta = (delta) => (delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1));
const fmtPct = (rate) => `${rate}%`;

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
  const handleSectorChange = (event) => {
    const next = event.target.value;
    onSectorChange(next);
    onSalaryChange(SECTOR_BASELINES[next]?.median ?? 3000);
  };

  const netSalary = computeNetSalary(grossSalary, country);
  const effectiveRate = Math.round(((grossSalary - netSalary) / Math.max(grossSalary, 1)) * 100);

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
          <span>Gross monthly (EUR)</span>
          <input
            type="number"
            min="500"
            max="20000"
            step="100"
            value={grossSalary}
            onChange={(event) => onSalaryChange(Number(event.target.value) || 0)}
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

function FinancingAssumptionsPanel({ assumptions, onAssumptionChange, onResetAssumptions }) {
  return (
    <div className="fin-assumptions" aria-label="Financing assumptions">
      <div className="fin-assumptions__header">
        <p className="fin-salary-group__label">Assumptions</p>
        <button type="button" className="ws-icon-btn" onClick={onResetAssumptions}>Reset assumptions</button>
      </div>

      <div className="fin-controls">
        <label className="selector-field fin-field">
          <span>Tax relief (%)</span>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={assumptions.taxReliefPct}
            onChange={(event) => onAssumptionChange('taxReliefPct', Number(event.target.value))}
            className="fin-input"
          />
          <small>{assumptions.taxReliefPct}%</small>
        </label>

        <label className="selector-field fin-field">
          <span>Social contribution add-on (%)</span>
          <input
            type="range"
            min="0"
            max="12"
            step="1"
            value={assumptions.socialContributionPct}
            onChange={(event) => onAssumptionChange('socialContributionPct', Number(event.target.value))}
            className="fin-input"
          />
          <small>{assumptions.socialContributionPct}%</small>
        </label>

        <label className="selector-field fin-field">
          <span>Relocation buffer (%)</span>
          <input
            type="range"
            min="0"
            max="25"
            step="1"
            value={assumptions.relocationBufferPct}
            onChange={(event) => onAssumptionChange('relocationBufferPct', Number(event.target.value))}
            className="fin-input"
          />
          <small>{assumptions.relocationBufferPct}%</small>
        </label>

        <label className="selector-field fin-field">
          <span>Childcare support (%)</span>
          <input
            type="range"
            min="0"
            max="35"
            step="1"
            value={assumptions.childcareSupportPct}
            onChange={(event) => onAssumptionChange('childcareSupportPct', Number(event.target.value))}
            className="fin-input"
          />
          <small>{assumptions.childcareSupportPct}%</small>
        </label>
      </div>
    </div>
  );
}

function SalaryEquivalencePanel({ city, scenarioKey, rankingRows, assumptions }) {
  const sourceCities = useMemo(
    () => rankingRows.filter((row) => row.key !== city.key).sort((left, right) => left.city.localeCompare(right.city)),
    [city.key, rankingRows],
  );

  const [sourceCityKey, setSourceCityKey] = useState(() => sourceCities[0]?.key ?? city.key);
  const selectedSourceCity = useMemo(
    () => sourceCities.find((row) => row.key === sourceCityKey) ?? sourceCities[0] ?? null,
    [sourceCities, sourceCityKey],
  );

  const [sourceNetSpend, setSourceNetSpend] = useState(
    () => selectedSourceCity?.budgets?.[scenarioKey]?.midpoint ?? 0,
  );

  useEffect(() => {
    if (selectedSourceCity?.key !== sourceCityKey) {
      setSourceCityKey(selectedSourceCity?.key ?? city.key);
    }
  }, [city.key, selectedSourceCity, sourceCityKey]);

  useEffect(() => {
    setSourceNetSpend(selectedSourceCity?.budgets?.[scenarioKey]?.midpoint ?? 0);
  }, [selectedSourceCity, scenarioKey]);

  const equivalence = useMemo(
    () =>
      computeSalaryEquivalence({
        sourceCity: selectedSourceCity,
        targetCity: city,
        scenarioKey,
        sourceNetSpend,
        assumptions,
      }),
    [assumptions, city, scenarioKey, selectedSourceCity, sourceNetSpend],
  );

  if (!selectedSourceCity) {
    return <p className="fin-disclaimer">Add at least two cities to run salary equivalence.</p>;
  }

  return (
    <div className="fin-equivalence-block">
      <div className="fin-controls">
        <label className="selector-field fin-field">
          <span>Current city</span>
          <select value={selectedSourceCity.key} onChange={(event) => setSourceCityKey(event.target.value)}>
            {sourceCities.map((row) => (
              <option key={`eq-${row.key}`} value={row.key}>{row.city}, {row.country}</option>
            ))}
          </select>
        </label>

        <label className="selector-field fin-field">
          <span>Current net monthly spend (EUR)</span>
          <input
            type="number"
            min="500"
            max="30000"
            step="50"
            value={sourceNetSpend}
            onChange={(event) => setSourceNetSpend(Number(event.target.value) || 0)}
            className="fin-input"
          />
        </label>

        <label className="selector-field fin-field">
          <span>Quick fill</span>
          <div className="fin-presets">
            <button
              type="button"
              className="toggle toggle--secondary fin-preset"
              onClick={() => setSourceNetSpend(selectedSourceCity.budgets?.[scenarioKey]?.min ?? sourceNetSpend)}
            >
              Min
            </button>
            <button
              type="button"
              className="toggle toggle--secondary fin-preset"
              onClick={() => setSourceNetSpend(selectedSourceCity.budgets?.[scenarioKey]?.midpoint ?? sourceNetSpend)}
            >
              Midpoint
            </button>
            <button
              type="button"
              className="toggle toggle--secondary fin-preset"
              onClick={() => setSourceNetSpend(selectedSourceCity.budgets?.[scenarioKey]?.comfortable ?? sourceNetSpend)}
            >
              Comfortable
            </button>
          </div>
        </label>
      </div>

      {equivalence ? (
        <div className="fin-results">
          <div className="fin-stat">
            <span>{selectedSourceCity.city} budget midpoint</span>
            <strong>{fmt(equivalence.sourceBudget)}</strong>
          </div>
          <div className="fin-stat">
            <span>{city.city} budget midpoint</span>
            <strong>{fmt(equivalence.targetBudget)}</strong>
          </div>
          <div className="fin-stat">
            <span>Source discretionary buffer</span>
            <strong className={equivalence.discretionary >= 0 ? 'fin-positive' : 'fin-negative'}>
              {fmt(equivalence.discretionary)}
            </strong>
          </div>
          <div className="fin-stat fin-stat--highlight">
            <span>Required target net</span>
            <strong>{fmt(equivalence.requiredTargetNet)}</strong>
          </div>
          <div className="fin-stat fin-stat--highlight">
            <span>Equivalent target gross</span>
            <strong>{fmt(equivalence.equivalentTargetGross)}</strong>
          </div>
          <div className="fin-stat">
            <span>Net delta vs source spend</span>
            <strong className={equivalence.deltaAbsolute <= 0 ? 'fin-positive' : 'fin-negative'}>
              {fmt(equivalence.deltaAbsolute)} ({equivalence.deltaPercent.toFixed(1)}%)
            </strong>
          </div>
        </div>
      ) : (
        <p className="fin-disclaimer">Enter a valid monthly spend to compute salary equivalence.</p>
      )}
    </div>
  );
}

export const FinancingEnginePanel = function financingEnginePanel({ city, scenarioKey = 'oneParent', rankingRows = [] }) {
  if (!city) return null;

  const [calculatorMode, setCalculatorMode] = useState('affordability');
  const [incomeMode, setIncomeMode] = useState('single');

  const [sector1, setSector1] = useState('Tech');
  const [grossSalary1, setGrossSalary1] = useState(() => SECTOR_BASELINES.Tech?.median ?? 3000);

  const [sector2, setSector2] = useState('Tech');
  const [grossSalary2, setGrossSalary2] = useState(() => SECTOR_BASELINES.Tech?.median ?? 3000);
  const [assumptions, setAssumptions] = useState(() => ({ ...DEFAULT_FINANCING_ASSUMPTIONS }));

  const isDual = incomeMode === 'dual';
  const budgetKey = isDual ? 'bothWorking' : 'oneParent';

  const result = useMemo(() => {
    const row = { ...city, scenarioBudget: city.budgets?.[budgetKey]?.midpoint ?? 3000 };

    return applyFinancingAdjustment(row, {
      sector: sector1,
      grossSalary: grossSalary1,
      scenarioKey: budgetKey,
      grossSalary2: isDual ? grossSalary2 : undefined,
      assumptions,
    });
  }, [city, sector1, grossSalary1, grossSalary2, isDual, budgetKey, assumptions]);

  const country = city.country ?? '';
  const net1 = computeNetSalary(grossSalary1, country, assumptions);
  const net2 = isDual ? computeNetSalary(grossSalary2, country, assumptions) : 0;
  const combinedNet = net1 + net2;
  const budgetMidpoint = computeAssumptionAdjustedBudget(city, budgetKey, assumptions);
  const discretionary = computeDiscretionaryIncome(combinedNet, budgetMidpoint);

  const originalPillar = city.strategicBalance?.pillars?.[0]?.score ?? 0;
  const adjustedPillar = result.strategicBalance?.pillars?.[0]?.score ?? originalPillar;
  const delta = adjustedPillar - originalPillar;

  const handleAssumptionChange = (key, value) => {
    setAssumptions((previous) => ({ ...previous, [key]: value }));
  };

  return (
    <section className="panel financing-panel" aria-label={`Affordability calculator for ${city.city}`}>
      <div className="section-title">
        <p>Affordability Calculator</p>
        <h3>Salary and Equivalence Engine - {city.city}</h3>
        <span>
          Run direct affordability checks for this city, or compare source-city spending to see
          the required target salary for equivalent lifestyle room.
        </span>
      </div>

      <div className="fin-mode-toggle" role="group" aria-label="Calculator mode">
        <button
          type="button"
          className={`fin-mode-btn${calculatorMode === 'affordability' ? ' fin-mode-btn--active' : ''}`}
          onClick={() => setCalculatorMode('affordability')}
        >
          Affordability
        </button>
        <button
          type="button"
          className={`fin-mode-btn${calculatorMode === 'equivalence' ? ' fin-mode-btn--active' : ''}`}
          onClick={() => setCalculatorMode('equivalence')}
        >
          Salary equivalence
        </button>
      </div>

      {calculatorMode === 'equivalence' ? (
        <SalaryEquivalencePanel city={city} scenarioKey={scenarioKey} rankingRows={rankingRows} assumptions={assumptions} />
      ) : (
        <>
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

          <SalaryInputGroup
            label={isDual ? 'Person 1' : 'Your salary'}
            sector={sector1}
            grossSalary={grossSalary1}
            onSectorChange={setSector1}
            onSalaryChange={setGrossSalary1}
            country={country}
          />

          {isDual ? (
            <SalaryInputGroup
              label="Person 2"
              sector={sector2}
              grossSalary={grossSalary2}
              onSectorChange={setSector2}
              onSalaryChange={setGrossSalary2}
              country={country}
            />
          ) : null}

          <FinancingAssumptionsPanel
            assumptions={assumptions}
            onAssumptionChange={handleAssumptionChange}
            onResetAssumptions={() => setAssumptions({ ...DEFAULT_FINANCING_ASSUMPTIONS })}
          />

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
        </>
      )}

      <p className="fin-disclaimer">
        Tax model is a simplified bracket approximation for illustrative purposes only and not financial advice.
        Effective rates vary by household and legal status.
      </p>
    </section>
  );
};
