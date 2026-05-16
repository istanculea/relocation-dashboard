/**
 * scoringFormulas.js — engines/
 *
 * Computes the classic 5-pillar weighted score dynamically from raw city data.
 * Raw city objects should carry only objective facts; this module owns the
 * formula so that dashboardConfig.js remains the single source of truth for
 * weights and city files stay free of pre-computed totals.
 *
 * Integration: import computeClassicScore from this module inside relocationData.js
 * (or during city assembly) to replace the hard-coded `scores.weighted` field.
 */

import { scoreWeights } from '../dashboardConfig.js';

// ---------------------------------------------------------------------------
// Internal score normalisation helpers (all return 0-10, clamped)
// ---------------------------------------------------------------------------

const clamp = (v, lo = 0, hi = 10) => Math.max(lo, Math.min(hi, v));

/**
 * Derive a 0-10 housing score from raw city housing data.
 * Logic: start from rent range midpoint vs benchmark, adjust for tax burden.
 */
const deriveHousingScore = (city) => {
  // If a pre-scored value already exists, trust it as the primary signal.
  if (Number.isFinite(city.scores?.housing)) {
    return clamp(city.scores.housing);
  }

  // Fallback: derive from rent string if available
  const rentText = String(city.housing?.rentSafe2Bed ?? '');
  const nums = [...rentText.matchAll(/\d+/g)].map((m) => Number(m[0])).filter(Boolean);

  if (nums.length >= 2) {
    const midRent = (nums[0] + nums[nums.length - 1]) / 2;
    if (midRent <= 1200) return 8.5;
    if (midRent <= 1600) return 7.5;
    if (midRent <= 2000) return 6.5;
    if (midRent <= 2600) return 5.5;
    return 4.5;
  }

  return 5.5; // baseline default
};

/**
 * Derive a 0-10 environment score from air quality data.
 */
const deriveEnvironmentScore = (city) => {
  if (Number.isFinite(city.scores?.environment)) {
    return clamp(city.scores.environment);
  }

  const pm25 = city.mobility?.pm25;

  if (Number.isFinite(pm25)) {
    if (pm25 <= 8)  return 9.5;
    if (pm25 <= 10) return 9.0;
    if (pm25 <= 12) return 8.2;
    if (pm25 <= 15) return 7.2;
    if (pm25 <= 18) return 6.2;
    if (pm25 <= 22) return 5.2;
    return 4.0;
  }

  return 6.0; // baseline default
};

/**
 * Derive a 0-10 childcare score from audit confidence + cost data.
 */
const deriveChildcareScore = (city) => {
  if (Number.isFinite(city.scores?.childcare)) {
    return clamp(city.scores.childcare);
  }

  const auditStatus = city.audit?.sections?.childcareCosts;

  if (auditStatus === 'verified') return 8.0;
  if (auditStatus === 'mixed')    return 6.5;
  return 5.5;
};

/**
 * Derive a 0-10 safety score from the support.safety text field.
 */
const deriveSafetyScore = (city) => {
  if (Number.isFinite(city.scores?.safety)) {
    return clamp(city.scores.safety);
  }

  const text = String(city.support?.safety ?? '');
  const nums = [...text.matchAll(/\d+(?:\.\d+)?/g)].map((m) => Number(m[0]));

  if (nums.length) {
    // Support text commonly encodes a safety index (0-100); normalise to 0-10.
    const index = Math.max(...nums);
    return clamp(index > 10 ? index / 10 : index);
  }

  return 5.0;
};

/**
 * Derive a 0-10 healthcare score from health registration + audit confidence.
 */
const deriveHealthcareScore = (city) => {
  if (Number.isFinite(city.scores?.healthcare)) {
    return clamp(city.scores.healthcare);
  }

  const auditStatus = city.audit?.sections?.healthcareAccess;

  if (auditStatus === 'verified') return 7.8;
  if (auditStatus === 'mixed')    return 6.5;
  return 5.5;
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * computeClassicScore(cityRawData, weights?)
 *
 * Computes the weighted 5-pillar classic score for a city.
 * Returns an object with individual pillar scores and the final weighted value.
 *
 * @param {object} cityRawData  - Raw city object (from citiesCore / citiesExpanded,
 *                                optionally post-audit-enrichment).
 * @param {object} [weights]    - Weight overrides; defaults to scoreWeights from dashboardConfig.
 * @returns {{ housing, environment, childcare, safety, healthcare, weighted }}
 */
export const computeClassicScore = (cityRawData, weights = scoreWeights) => {
  const housing     = deriveHousingScore(cityRawData);
  const environment = deriveEnvironmentScore(cityRawData);
  const childcare   = deriveChildcareScore(cityRawData);
  const safety      = deriveSafetyScore(cityRawData);
  const healthcare  = deriveHealthcareScore(cityRawData);

  const weighted = clamp(
    housing     * (weights.housing     ?? scoreWeights.housing)
    + environment * (weights.environment ?? scoreWeights.environment)
    + childcare   * (weights.childcare   ?? scoreWeights.childcare)
    + safety      * (weights.safety      ?? scoreWeights.safety)
    + healthcare  * (weights.healthcare  ?? scoreWeights.healthcare),
  );

  return { housing, environment, childcare, safety, healthcare, weighted };
};

/**
 * computeClassicScoreValue(cityRawData, weights?)
 *
 * Convenience wrapper returning only the final weighted number.
 */
export const computeClassicScoreValue = (cityRawData, weights = scoreWeights) =>
  computeClassicScore(cityRawData, weights).weighted;

// ---------------------------------------------------------------------------
// Defensive validation
// ---------------------------------------------------------------------------

const REQUIRED_NUMERIC_PATHS = [
  ['mobility', 'pm25'],
  ['budgets', 'oneParent', 'midpoint'],
  ['budgets', 'bothWorking', 'midpoint'],
];

const DEFAULTS = {
  pm25: 15,          // moderate EU urban baseline
  midpoint: 3500,    // conservative monthly budget baseline
};

const getPath = (obj, ...keys) =>
  keys.reduce((current, k) => (current != null ? current[k] : undefined), obj);

/**
 * sanitiseCityData(city, fallbacks?)
 *
 * Ensures a city object has all fields required for scoring to succeed.
 * If a required numeric metric is missing or non-finite, substitutes a
 * safe baseline value and attaches a `_sanitised` flag for traceability.
 *
 * @param {object} city       - Assembled city object.
 * @param {object} fallbacks  - Optional override defaults.
 * @returns {object}          - City object (mutated in-place and returned).
 */
export const sanitiseCityData = (city, fallbacks = DEFAULTS) => {
  let modified = false;

  // PM2.5
  if (!Number.isFinite(city.mobility?.pm25)) {
    city.mobility = { ...city.mobility, pm25: fallbacks.pm25 ?? DEFAULTS.pm25 };
    modified = true;
  }

  // Budget midpoints
  for (const scenario of ['oneParent', 'bothWorking']) {
    if (!Number.isFinite(city.budgets?.[scenario]?.midpoint)) {
      city.budgets = {
        ...city.budgets,
        [scenario]: {
          ...city.budgets?.[scenario],
          midpoint: fallbacks.midpoint ?? DEFAULTS.midpoint,
        },
      };
      modified = true;
    }
  }

  // Nursery cost — fall back to an empty string so display renders gracefully
  if (!city.childcare?.nurseryNet) {
    city.childcare = { ...city.childcare, nurseryNet: city.childcare?.nurseryNet ?? 'Data not available' };
    modified = true;
  }

  if (modified) {
    city._sanitised = true;
  }

  return city;
};
