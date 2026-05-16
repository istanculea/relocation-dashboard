/**
 * mcdaEngine.js — src/data/engines/
 *
 * MCDA engine: 15 pillars (0–100 each), final weighted score (0–100).
 *
 *   P1   EU Registration & Residency Pathway           W = 0.05
 *   P2   Diploma Recognition & Professional Accred.    W = 0.05
 *   P3   Real Estate & Healthy Housing                 W = 0.04
 *   P4   Rental Market                                 W = 0.10
 *   P5   Home Ownership                                W = 0.04
 *   P6   Location & Infrastructure                     W = 0.05
 *   P7   The 'Clean' Shopping Basket                   W = 0.05
 *   P8   Childcare & Educational Path                  W = 0.12
 *   P9   Health, Medical Access                        W = 0.08
 *   P10  Environment & Pollution                       W = 0.07
 *   P11  Criminality and Street Safeness               W = 0.08
 *   P12  Infrastructure, Mobility & Logistics          W = 0.07
 *   P13  Economy, Jobs, Taxes & Parity                 W = 0.10
 *   P14  Climate & Resilience                          W = 0.05
 *   P15  Social Capital & Work-Life Balance            W = 0.05
 *
 * Rental reference ceiling: maxRentEur (3000 EUR) is the soft upper bound used
 * in the P4 rentBuffer formula only. All cities are computed — expensive cities
 * naturally receive a low P4 score via the logarithmic buffer.
 *
 * Default profile: single_income
 */

// ---------------------------------------------------------------------------
// Default config
// ---------------------------------------------------------------------------

export const defaultMcdaConfig = {
  maxRentEur: 3000,
  exchangeRates: {
    EUR: 1.00,
    USD: 0.92,
    CHF: 1.04,
    GBP: 1.18,
    RON: 0.20,
  },
  pillarWeights: {
    W1:  0.05,
    W2:  0.05,
    W3:  0.04,
    W4:  0.10,
    W5:  0.04,
    W6:  0.05,
    W7:  0.05,
    W8:  0.12,
    W9:  0.08,
    W10: 0.07,
    W11: 0.08,
    W12: 0.07,
    W13: 0.10,
    W14: 0.05,
    W15: 0.05,
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a raw value to [0, 100].
 *   invert=true  → higher raw value → lower score (e.g. crime rate)
 */
export const normalize = (value, minVal, maxVal, invert = false) => {
  const range = maxVal - minVal;
  if (range === 0) return invert ? 0 : 100;

  let norm = (value - minVal) / range;
  norm = Math.max(0, Math.min(1, norm));

  return invert ? (1 - norm) * 100 : norm * 100;
};

/** Convert a monetary amount to EUR using the given rate table. */
export const convertToEuro = (amount, currencyIso, exchangeRates) => {
  const rate = exchangeRates[currencyIso] ?? 1.0;
  return amount * rate;
};

// ---------------------------------------------------------------------------
// Core engine
// ---------------------------------------------------------------------------

/**
 * computeMcdaScore(payload, profileType, config)
 *
 * @param {object} payload      — one entry from mcdaPayloads.js
 * @param {string} profileType  — 'single_income' | 'dual_income'
 * @param {object} [config]     — override defaultMcdaConfig
 * @returns {{
 *   status:     'CALCULATED',
 *   rentEur:    number,
 *   finalScore: number,   // 0–100
 *   pillars: {
 *     p1..p15: number,   // each 0–100
 *   },
 * }}
 */
export const computeMcdaScore = (payload, profileType = 'single_income', config = defaultMcdaConfig) => {
  const {
    maxRentEur,
    exchangeRates,
    pillarWeights: basePw,
  } = { ...defaultMcdaConfig, ...config };

  // Scenario-adjusted pillar weights for the final weighted score
  // dual_income: childcare & economy/jobs more critical; rental less dominant with combined income
  const pw = (() => {
    if (profileType !== 'dual_income') return basePw;
    const w = { ...basePw };
    w.W4  = basePw.W4  * 0.85;  // rental: less constraining with two incomes
    w.W8  = basePw.W8  * 1.20;  // childcare: full-time nursery cost is the top concern
    w.W13 = basePw.W13 * 1.15;  // economy/jobs: two career paths to support
    const total = Object.values(w).reduce((a, b) => a + b, 0);
    return Object.fromEntries(Object.entries(w).map(([k, v]) => [k, v / total]));
  })();

  const p = payload;

  // ── Currency conversion ─────────────────────────────────────────────────
  const rentEur = convertToEuro(p.raw_monthly_rent, p.currency_iso, exchangeRates);

  const clamp = (v) => Math.max(0, Math.min(100, v));

  // ── Shared derived values ──────────────────────────────────────────────────
  // dual_income: OECD dual-earner benchmark (100%+67%) → effective rent burden ~40% lower
  const incomeMultiplier = profileType === 'dual_income' ? 1.67 : 1.0;
  const effectiveRentEur = rentEur / incomeMultiplier;
  const rentBuffer = Math.max(0, Math.min(1, (maxRentEur - effectiveRentEur) / (maxRentEur - 400)));

  const taxRate    = profileType === 'dual_income' ? p.raw_tax_rate_dual  : p.raw_tax_rate_single;
  const taxBreaks  = profileType === 'dual_income' ? p.tax_breaks_dual    : p.tax_breaks_single;
  const itEngAvg   = (p.opp_it + p.opp_eng) / 2;
  const netTax     = Math.max(0, taxRate - taxBreaks * 0.5);
  const taxesScore = normalize(netTax, 0, 60, true);

  const benefits   = p.child_benefits * 0.70 + p.paperwork_online * 0.30;
  // dual_income: both IT/Cloud career + Psychotherapy practice; single_income: focused IT career
  const careers = profileType === 'dual_income'
    ? p.gen_employment * 0.25 + itEngAvg * 0.40 + p.opp_psych * 0.20 + p.work_life_balance * 0.15
    : p.gen_employment * 0.20 + itEngAvg * 0.65 + p.work_life_balance * 0.15;

  const aqi        = p.raw_air_aqi_yearly_avg;
  // Full linear normalization — no flat cap — preserves differentiation between all clean cities
  const airScore   = normalize(aqi, 10, 200, true);

  const safetyScore  = normalize(p.raw_crime_rate, 10, 90, true);
  const carDepScore  = normalize(p.raw_car_dependency_pct, 0, 100, true);

  // ── P1  — EU Registration & Residency Pathway ───────────────────────────
  // settling_ease captures bureaucratic ease; paperwork_online captures digital accessibility
  const p1 = p.settling_ease * 0.60 + p.paperwork_online * 0.40;

  // ── P2  — Diploma Recognition & Professional Accreditation ─────────────
  const p2 = p.degree_recognition * 0.70 + p.operating_psychotherapist * 0.30;

  // ── P3  — Real Estate & Healthy Housing ─────────────────────────────────
  // budget proxies property purchase affordability; infra + water + disaster cover housing quality
  const p3 = p.budget * 0.35 + p.urban_infra * 0.30 + p.raw_water_quality * 0.20 + p.disaster_safety * 0.15;

  // ── P4  — Rental Market ─────────────────────────────────────────────────
  // Logarithmic buffer: 100 × ln(1 + buffer × (e−1)) — buffer=1 → 100, buffer=0 → 0
  const p4 = 100 * Math.log1p(rentBuffer * 1.718);

  // ── P5  — Home Ownership ────────────────────────────────────────────────
  // paperwork_online replaces settling_ease — more relevant to property purchase admin
  // dual_income: combined purchasing power gives ~15% better buying capacity
  const budgetPurchase = profileType === 'dual_income' ? Math.min(100, p.budget * 1.15) : p.budget;
  const p5 = budgetPurchase * 0.55 + p.urban_infra * 0.30 + p.paperwork_online * 0.15;

  // ── P6  — Location & Infrastructure ─────────────────────────────────────
  const p6 = p.urban_infra * 0.50 + p.walkways * 0.30 + p.bike_paths * 0.20;

  // ── P7  — The 'Clean' Shopping Basket ────────────────────────────────────
  const p7 = p.grocery_restaurant_costs * 0.70 + p.raw_water_quality * 0.30;

  // ── P8  — Childcare & Educational Path ──────────────────────────────────
  const p8 = profileType === 'dual_income'
    // Both working: institutional childcare quality and state financial support are critical
    ? p.raising_children * 0.40 + p.places_to_gather * 0.10 + benefits * 0.50
    // One parent at home: neighborhood access and parenting environment matter more
    : p.raising_children * 0.60 + p.places_to_gather * 0.25 + benefits * 0.15;

  // ── P9  — Health, Medical Access ─────────────────────────────────────────
  // urban_infra proxies healthcare infrastructure; opp_psych captures healthcare professional density
  const p9 = p.urban_infra * 0.45 + p.raw_water_quality * 0.30 + p.opp_psych * 0.25;

  // ── P10 — Environment & Pollution ───────────────────────────────────────
  const p10 = airScore * 0.65 + p.disaster_safety * 0.35;

  // ── P11 — Criminality and Street Safeness ───────────────────────────────
  const p11 = safetyScore * 0.85 + p.animal_friendliness * 0.15;

  // ── P12 — Infrastructure, Mobility & Logistics ──────────────────────────
  // transit_pass_cost and driving_rules added to capture full mobility picture
  const p12 =
    p.transit_profile   * 0.20 +
    p.fare_system       * 0.15 +
    p.transit_pass_cost * 0.10 +
    p.car_free_index    * 0.20 +
    carDepScore         * 0.15 +
    p.bike_paths        * 0.10 +
    p.driving_rules     * 0.10;

  // ── P13 — Economy, Jobs, Taxes & Parity ─────────────────────────────────
  const p13 = careers * 0.45 + taxesScore * 0.35 + benefits * 0.20;

  // ── P14 — Climate & Resilience ──────────────────────────────────────────
  const p14 = p.climate_comfort * 0.55 + p.disaster_safety * 0.45;

  // ── P15 — Social Capital & Work-Life Balance ─────────────────────────────
  // paid_days replaces animal_friendliness (already in P11); paid leave is a direct work-life metric
  const p15 = profileType === 'dual_income'
    // Both working: paid parental leave and paid vacation days critical for household logistics
    ? p.work_life_balance * 0.30 + p.places_to_gather * 0.20 + p.parental_leave * 0.25 + p.paid_days * 0.25
    // One parent at home: community access more important (playgrounds, local social life)
    : p.work_life_balance * 0.30 + p.places_to_gather * 0.35 + p.parental_leave * 0.15 + p.paid_days * 0.20;

  // ── Final weighted score ─────────────────────────────────────────────────
  const finalScore =
    pw.W1  * p1  + pw.W2  * p2  + pw.W3  * p3  +
    pw.W4  * p4  + pw.W5  * p5  + pw.W6  * p6  +
    pw.W7  * p7  + pw.W8  * p8  + pw.W9  * p9  +
    pw.W10 * p10 + pw.W11 * p11 + pw.W12 * p12 +
    pw.W13 * p13 + pw.W14 * p14 + pw.W15 * p15;

  return {
    status: 'CALCULATED',
    rentEur,
    effectiveRentEur,
    finalScore: clamp(finalScore),
    pillars: {
      p1:  clamp(p1),  p2:  clamp(p2),  p3:  clamp(p3),
      p4:  clamp(p4),  p5:  clamp(p5),  p6:  clamp(p6),
      p7:  clamp(p7),  p8:  clamp(p8),  p9:  clamp(p9),
      p10: clamp(p10), p11: clamp(p11), p12: clamp(p12),
      p13: clamp(p13), p14: clamp(p14), p15: clamp(p15),
    },
  };
};
