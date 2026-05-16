import { deriveMaxAqi, deriveTransitEfficiencyScore } from './comparisonMetrics.js';

export const sortOptions = [
  { key: 'score', label: 'Sort by family-fit score' },
  { key: 'budget', label: 'Sort by lowest monthly burn' },
  { key: 'verified', label: 'Sort by verified coverage' },
  { key: 'air', label: 'Sort by cleaner air' },
];

export const verificationOptions = [
  { key: 'all', label: 'All evidence profiles' },
  { key: 'childcareVerified', label: 'Verified childcare only' },
  { key: 'officialBands', label: 'Official tariff bands recovered' },
  { key: 'highCoverage', label: '4+ verified sections' },
];

export const budgetOptions = [
  { key: 'all', label: 'All budget bands' },
  { key: 'under3000', label: 'Up to EUR3,000 / month' },
  { key: 'between3000And4000', label: 'EUR3,001-EUR4,000 / month' },
  { key: 'between4000And5000', label: 'EUR4,001-EUR5,000 / month' },
  { key: 'over5000', label: 'Over EUR5,000 / month' },
];

export const mobilityOptions = [
  { key: 'all', label: 'All mobility profiles' },
  { key: 'carLight', label: 'Car-light daily life' },
  { key: 'fifteenMinute', label: '15-minute districts' },
  { key: 'transitStrong', label: 'Transit score 7+/10' },
];

export const airOptions = [
  { key: 'all', label: 'All air-risk profiles' },
  { key: 'cleaner', label: 'Lower max AQI (150 or less)' },
  { key: 'moderate', label: 'Avoid highest pollution cluster' },
];

export const matchesVerificationFilter = (row, verificationFilter) => {
  if (verificationFilter === 'childcareVerified') {
    return Boolean(row.verifiedChildcare);
  }

  if (verificationFilter === 'officialBands') {
    return Boolean(row.officialChildcareTariff || row.hasOfficialChildcareTariff);
  }

  if (verificationFilter === 'highCoverage') {
    return row.verifiedCount >= 4;
  }

  return true;
};

export const matchesBudgetFilter = (row, budgetFilter) => {
  if (budgetFilter === 'under3000') {
    return row.scenarioBudget <= 3000;
  }

  if (budgetFilter === 'between3000And4000') {
    return row.scenarioBudget > 3000 && row.scenarioBudget <= 4000;
  }

  if (budgetFilter === 'between4000And5000') {
    return row.scenarioBudget > 4000 && row.scenarioBudget <= 5000;
  }

  if (budgetFilter === 'over5000') {
    return row.scenarioBudget > 5000;
  }

  return true;
};

export const matchesMobilityFilter = (row, mobilityFilter) => {
  const carNeed = String(row.mobility?.carNeed ?? '').toLowerCase();
  const transitScore = deriveTransitEfficiencyScore(row);

  if (mobilityFilter === 'carLight') {
    return carNeed.includes('low');
  }

  if (mobilityFilter === 'fifteenMinute') {
    return String(row.city360?.fifteenMinute ?? '').toLowerCase().startsWith('yes');
  }

  if (mobilityFilter === 'transitStrong') {
    return transitScore >= 7;
  }

  return true;
};

export const matchesAirFilter = (row, airFilter) => {
  if (airFilter === 'all') {
    return true;
  }

  const maxAqi = deriveMaxAqi(row);

  if (maxAqi === null) {
    return true;
  }

  if (airFilter === 'cleaner') {
    return maxAqi <= 150;
  }

  if (airFilter === 'moderate') {
    return maxAqi <= 180;
  }

  return true;
};

export const sortRows = (rows, sortKey) => {
  const sortedRows = [...rows];

  sortedRows.sort((left, right) => {
    if (sortKey === 'budget') {
      return left.scenarioBudget - right.scenarioBudget || right.activeWeightedScore - left.activeWeightedScore;
    }

    if (sortKey === 'verified') {
      return right.verifiedCount - left.verifiedCount || right.activeWeightedScore - left.activeWeightedScore;
    }

    if (sortKey === 'air') {
      return (deriveMaxAqi(left) ?? Number.POSITIVE_INFINITY) - (deriveMaxAqi(right) ?? Number.POSITIVE_INFINITY)
        || right.activeWeightedScore - left.activeWeightedScore;
    }

    return right.activeWeightedScore - left.activeWeightedScore || left.city.localeCompare(right.city);
  });

  return sortedRows.map((row, index) => ({ ...row, filteredRank: index + 1 }));
};
