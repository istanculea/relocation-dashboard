/**
 * financingEngine.js — src/data/engines/
 *
 * Dynamic financing engine: sector salary matrix → tax deductions →
 * discretionary income → Tier-1 housing/affordability score adjustment.
 *
 * This module is PURE (no side effects, no imports from React).
 * It is called from relocationData.js (or inside a useMemo block in App.jsx)
 * to augment the strategicBalance.pillars[0] ("Housing & Living Costs") score
 * with a discretionary-income signal derived from the user's sector and salary.
 *
 * ── Integration ──────────────────────────────────────────────────────────────
 * In App.jsx, call applyFinancingAdjustment(cityRow, { sector, grossSalary })
 * for each row inside scoreRankingRows to get an adjusted copy.
 *
 * ── Salary matrix ────────────────────────────────────────────────────────────
 * Each city carries a `sectorSalaries` field (static data, authored in the city
 * expansion wave or added as a supplementary module). If the field is absent,
 * the engine falls back to a conservative EU baseline per sector.
 *
 * Salary matrix shape (per city, optional):
 *   sectorSalaries: {
 *     Tech:        { p25: 3200, median: 4500, p75: 6200 },  // gross monthly EUR
 *     Healthcare:  { p25: 2200, median: 3000, p75: 4200 },
 *     Education:   { p25: 1800, median: 2400, p75: 3400 },
 *     Finance:     { p25: 3000, median: 4200, p75: 6000 },
 *     Service:     { p25: 1400, median: 1900, p75: 2800 },
 *   }
 */

// ---------------------------------------------------------------------------
// Sector baseline salaries (EU fallback if city has no sectorSalaries data)
// Gross monthly EUR figures at median percentile.
// ---------------------------------------------------------------------------

export const SECTOR_BASELINES = {
  Tech:        { p25: 3000, median: 4200, p75: 5800 },
  Healthcare:  { p25: 2000, median: 2900, p75: 4000 },
  Education:   { p25: 1700, median: 2300, p75: 3200 },
  Finance:     { p25: 2800, median: 4000, p75: 5600 },
  Service:     { p25: 1300, median: 1800, p75: 2600 },
  Other:       { p25: 2000, median: 2800, p75: 4000 },
};

export const SECTOR_KEYS = Object.keys(SECTOR_BASELINES);

const COUNTRY_TAX_BRACKETS = [
  {
    countries: ['germany', 'austria'],
    brackets: [[1500, 0.25], [2500, 0.35], [4000, 0.42], [6000, 0.48], [Infinity, 0.52]],
  },
  {
    countries: ['spain'],
    brackets: [[1500, 0.20], [2500, 0.28], [4000, 0.35], [6000, 0.42], [Infinity, 0.47]],
  },
  {
    countries: ['italy'],
    brackets: [[1500, 0.23], [2500, 0.31], [4000, 0.38], [6000, 0.45], [Infinity, 0.50]],
  },
  {
    countries: ['romania'],
    brackets: [[Infinity, 0.33]],
  },
  {
    countries: ['ireland'],
    brackets: [[2000, 0.22], [3500, 0.30], [6000, 0.42], [Infinity, 0.48]],
  },
  {
    countries: ['portugal'],
    brackets: [[1500, 0.19], [2500, 0.27], [4000, 0.34], [Infinity, 0.43]],
  },
];

const DEFAULT_TAX_BRACKETS = [[2000, 0.24], [3500, 0.33], [5000, 0.40], [Infinity, 0.46]];

// ---------------------------------------------------------------------------
// Tax approximation
// ---------------------------------------------------------------------------

/**
 * Estimate effective combined income tax + social contribution rate
 * for a given gross monthly salary and country context.
 *
 * This is a deliberately simplified model for scoring purposes only.
 * It is NOT financial advice.
 *
 * @param {number} grossMonthly  — gross monthly salary in EUR
 * @param {string} country       — city country name
 * @returns {number}             — effective rate as a decimal (0–1)
 */
export const estimateEffectiveTaxRate = (grossMonthly, country = '') => {
  const gross = Number(grossMonthly) || 0;
  const normalizedCountry = country.toLowerCase();
  const brackets = COUNTRY_TAX_BRACKETS.find(({ countries }) =>
    countries.some((name) => normalizedCountry.includes(name)))?.brackets ?? DEFAULT_TAX_BRACKETS;
  const rate = brackets.find(([limit]) => gross < limit)?.[1] ?? DEFAULT_TAX_BRACKETS[DEFAULT_TAX_BRACKETS.length - 1][1];

  return Math.min(0.65, Math.max(0, rate));
};

/**
 * Compute net monthly take-home from gross.
 */
export const computeNetSalary = (grossMonthly, country) => {
  const rate = estimateEffectiveTaxRate(grossMonthly, country);

  return Math.round(grossMonthly * (1 - rate));
};

// ---------------------------------------------------------------------------
// Discretionary income
// ---------------------------------------------------------------------------

/**
 * computeDiscretionaryIncome(netSalary, budgetMidpoint)
 *
 * Returns: net monthly salary minus the city's living-cost midpoint.
 * Positive = surplus (comfortable); negative = deficit (unsustainable).
 */
export const computeDiscretionaryIncome = (netSalary, budgetMidpoint) =>
  Math.round(netSalary - budgetMidpoint);

// ---------------------------------------------------------------------------
// Housing & Living Costs score adjustment
// ---------------------------------------------------------------------------

/**
 * discretionaryScoreAdjustment(discretionaryIncome)
 *
 * Converts a discretionary income figure into a score delta applied
 * to the Tier-1 "Housing & Living Costs" pillar.
 *
 * Scale is deliberately conservative (±1.5 max) to prevent the salary
 * signal from completely overriding the absolute housing cost signal.
 *
 * @param {number} discretionaryIncome  — monthly surplus / deficit in EUR
 * @returns {number}                    — score delta (−1.5 to +1.5)
 */
export const discretionaryScoreAdjustment = (discretionaryIncome) => {
  if (discretionaryIncome >= 2000) return  1.5;
  if (discretionaryIncome >= 1000) return  1.0;
  if (discretionaryIncome >=  500) return  0.5;
  if (discretionaryIncome >=  100) return  0.2;
  if (discretionaryIncome >=    0) return  0.0;
  if (discretionaryIncome >= -300) return -0.3;
  if (discretionaryIncome >= -700) return -0.7;
  if (discretionaryIncome >= -1200) return -1.1;
  return -1.5;
};

const clamp = (v, lo = 1, hi = 10) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * getMedianSalaryForSector(city, sector)
 *
 * Returns the best available gross monthly median salary for a sector in a city.
 * Falls back to the EU baseline if city-level data is absent.
 */
export const getMedianSalaryForSector = (city, sector) => {
  const cityData = city?.sectorSalaries?.[sector];

  if (cityData?.median) return cityData.median;

  return SECTOR_BASELINES[sector]?.median ?? SECTOR_BASELINES.Other.median;
};

/**
 * applyFinancingAdjustment(cityRow, { sector, grossSalary, scenarioKey, grossSalary2 })
 *
 * Returns a shallow copy of cityRow with an augmented strategicBalance:
 *   • strategicBalance.pillars[0].score adjusted by discretionary income delta
 *   • strategicBalance.weightedScore recomputed
 *   • financing object attached for display: { grossSalary, netSalary, budget,
 *       discretionaryIncome, effectiveTaxRate, sector, adjusted }
 *
 * When grossSalary2 is provided (dual-income mode), both net salaries are
 * combined and the bothWorking budget is used automatically.
 *
 * This function is idempotent — applying it twice does not compound adjustments.
 *
 * @param {object} cityRow
 * @param {{ sector: string, grossSalary: number, scenarioKey?: string, grossSalary2?: number }} opts
 * @returns {object}  — shallow-cloned city row with updated strategicBalance
 */
export const applyFinancingAdjustment = (cityRow, { sector, grossSalary, scenarioKey = 'oneParent', grossSalary2 }) => {
  if (!grossSalary || !cityRow?.strategicBalance?.pillars?.length) {
    return cityRow;
  }

  const isDual        = typeof grossSalary2 === 'number' && grossSalary2 > 0;
  const resolvedKey   = isDual ? 'bothWorking' : scenarioKey;

  const gross         = Number(grossSalary);
  const country       = cityRow.country ?? '';
  const netSalary     = computeNetSalary(gross, country);
  const netSalary2    = isDual ? computeNetSalary(Number(grossSalary2), country) : 0;
  const combinedNet   = netSalary + netSalary2;
  const budgetMidpoint = cityRow.budgets?.[resolvedKey]?.midpoint ?? 3000;
  const discretionary = computeDiscretionaryIncome(combinedNet, budgetMidpoint);
  const delta         = discretionaryScoreAdjustment(discretionary);
  const effectiveTaxRate = estimateEffectiveTaxRate(gross, country);

  // Clone pillars, adjust Tier-1 (Housing & Living Costs)
  const adjustedPillars = cityRow.strategicBalance.pillars.map((pillar, idx) => {
    if (idx !== 0) return pillar; // only Tier-1

    const newScore = clamp(Number(pillar.score) + delta);

    return { ...pillar, score: newScore, _financingAdjusted: true };
  });

  // Recompute weighted score
  const newWeightedScore = adjustedPillars.reduce(
    (sum, p) => sum + (p.score * (p.weight ?? 0)),
    0,
  );

  return {
    ...cityRow,
    strategicBalance: {
      ...cityRow.strategicBalance,
      pillars:       adjustedPillars,
      weightedScore: clamp(newWeightedScore, 0, 10),
    },
    financing: {
      sector,
      grossSalary:       gross,
      netSalary,
      netSalary2:        isDual ? netSalary2 : null,
      combinedNet:       isDual ? combinedNet : netSalary,
      grossSalary2:      isDual ? Number(grossSalary2) : null,
      isDual,
      budgetMidpoint,
      discretionaryIncome: discretionary,
      effectiveTaxRate:  Math.round(effectiveTaxRate * 100),
      adjusted:          Math.abs(delta) > 0.01,
    },
  };
};
