import { officialChildcareTariffs } from '../data/officialChildcareTariffs.js';
import { mcdaPayloads } from '../data/mcdaPayloads.js';
import {
  airOptions,
  budgetOptions,
  matchesAirFilter,
  matchesBudgetFilter,
  matchesMobilityFilter,
  matchesVerificationFilter,
  mobilityOptions,
  sortOptions,
  sortRows,
  verificationOptions,
} from '../utils/comparisonFilters.js';
import { deriveMaxAqi, deriveTransitEfficiencyScore } from '../utils/comparisonMetrics.js';
import { formatEuro } from '../utils/formatters.js';

export const formatScore = (value) => value.toFixed(2);

export const renderScenarioBudget = (value) => formatEuro(value);

export const firstSentence = (value) => {
  const text = String(value ?? '').replace(/\s+/g, ' ').trim();

  if (!text) {
    return '';
  }

  // Mask periods that follow known abbreviations so they don't trigger a sentence split.
  // Uses a placeholder character (ONE DOT LEADER U+2024) to preserve string length.
  const masked = text.replace(/\b(St|Dr|Mr|Mrs|Ms|Prof|Jr|Sr|Inc|Ltd|Co|Corp|vs|etc)\./g, '$1\u2024');

  const stopIndex = masked.search(/[.!?](?:\s|$)/);

  return stopIndex === -1 ? text : text.slice(0, stopIndex + 1);
};

export const getMonthlyPassDisplay = (row) => {
  const match = String(row.mobility?.pass ?? '').match(/(EUR|GBP|RON)\s*([\d,]+(?:\.\d+)?)/i);
  if (!match) return null;
  // Filter out per-trip fares — a monthly pass is never less than 5 in any currency used here
  const amount = parseFloat(match[2].replace(',', '.'));
  if (Number.isFinite(amount) && amount < 5) return null;
  return match[1].toUpperCase() + match[2];
};

export const getSafetyIndex = (row) => {
  const matches = [...String(row.support?.safety ?? '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));

  return matches[0] ?? row.scores.safety * 10;
};

export const getMaxAqi = (row) => {
  const derivedValue = deriveMaxAqi(row);

  if (derivedValue !== null) {
    return derivedValue;
  }

  const payload = mcdaPayloads[row.key];

  return payload ? payload.raw_air_aqi_yearly_avg : null;
};

export const getTransitEfficiencyScore = (row) => deriveTransitEfficiencyScore(row);

export const getBudgetBandLabel = (value) => {
  if (value <= 3000) {
    return 'Leanest monthly burn';
  }

  if (value <= 4000) {
    return 'Mid-market expat budget';
  }

  return 'Premium monthly burn';
};

export const getChildcareTariff = (row) => row.officialChildcareTariff ?? officialChildcareTariffs[row.key] ?? null;

export const getLanguageBarrierInfo = (row) => {
  const country = (row.country ?? '').toLowerCase();
  if (country.includes('romania')) return { score: 9.5, summary: 'No barrier — native' };
  if (country.includes('spain')) return { score: 8.2, summary: 'Low — B2 Spanish' };
  if (country.includes('italy')) return { score: 7.2, summary: 'Some friction — B1 Italian' };
  if (country.includes('germany') || country.includes('austria')) return { score: 4.0, summary: 'High — German required' };
  return { score: 5.5, summary: 'Moderate barrier' };
};

export const getStrategicPillar = (row, key) =>
  (row.strategicBalance?.pillars ?? []).find((p) => p.key === key) ?? null;

export const buildChildcareSummary = (row) => {
  const tariff = getChildcareTariff(row);

  if (tariff) {
    return `Municipal bands from ${tariff.nido.residentBands[0].monthly} to ${tariff.nido.residentBands[3].monthly}.`;
  }

  return row.verifiedChildcare ?? row.childcare.nurseryNet;
};

export {
  airOptions,
  budgetOptions,
  matchesAirFilter,
  matchesBudgetFilter,
  matchesMobilityFilter,
  matchesVerificationFilter,
  mobilityOptions,
  sortOptions,
  sortRows,
  verificationOptions,
};