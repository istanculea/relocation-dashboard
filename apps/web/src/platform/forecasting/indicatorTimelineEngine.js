const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const trendSlope = {
  improving: 0.18,
  stable: 0,
  worsening: -0.18,
};

const inferTrendFromAudit = (city) => {
  const counts = city?.audit?.counts;
  if (!counts) {
    return 'stable';
  }

  if ((counts.modeled ?? 0) > (counts.verified ?? 0)) {
    return 'worsening';
  }

  if ((counts.verified ?? 0) >= 4) {
    return 'improving';
  }

  return 'stable';
};

const inferVolatilityFromAudit = (city) => {
  const counts = city?.audit?.counts;
  if (!counts) {
    return 'medium';
  }

  const total = (counts.verified ?? 0) + (counts.mixed ?? 0) + (counts.modeled ?? 0);
  if (total <= 0) {
    return 'medium';
  }

  const modeledShare = (counts.modeled ?? 0) / total;
  if (modeledShare >= 0.45) {
    return 'high';
  }
  if (modeledShare <= 0.2) {
    return 'low';
  }

  return 'medium';
};

const inferConfidenceFromAudit = (city) => {
  const counts = city?.audit?.counts;
  if (!counts) {
    return 0.55;
  }

  const total = (counts.verified ?? 0) + (counts.mixed ?? 0) + (counts.modeled ?? 0);
  if (total <= 0) {
    return 0.55;
  }

  const weighted = ((counts.verified ?? 0) * 1 + (counts.mixed ?? 0) * 0.65 + (counts.modeled ?? 0) * 0.35) / total;
  return Number(clamp(weighted, 0.2, 0.98).toFixed(2));
};

const volatilityBandWidth = {
  low: 0.22,
  medium: 0.45,
  high: 0.78,
};

const buildForecastSeries = ({ current, trend, volatility, startYear = 2026, years = 5 }) => {
  const slope = trendSlope[trend] ?? 0;
  const band = volatilityBandWidth[volatility] ?? volatilityBandWidth.medium;

  return Array.from({ length: years }, (_, index) => {
    const year = startYear + index;
    const value = clamp(current + slope * index, 0, 10);
    return {
      year,
      value: Number(value.toFixed(2)),
      lower: Number(clamp(value - band, 0, 10).toFixed(2)),
      upper: Number(clamp(value + band, 0, 10).toFixed(2)),
    };
  });
};

const indicatorCurrentValue = (city, indicatorKey) => {
  if (indicatorKey === 'affordabilityPressure') {
    return Number(clamp(city?.scores?.housing ?? 5, 0, 10).toFixed(2));
  }
  if (indicatorKey === 'familyReadiness') {
    return Number(clamp(city?.scores?.childcare ?? 5, 0, 10).toFixed(2));
  }
  if (indicatorKey === 'healthcareResilience') {
    return Number(clamp(city?.scores?.healthcare ?? 5, 0, 10).toFixed(2));
  }
  if (indicatorKey === 'safetyStability') {
    return Number(clamp(city?.scores?.safety ?? 5, 0, 10).toFixed(2));
  }
  return Number(clamp(city?.scores?.environment ?? 5, 0, 10).toFixed(2));
};

export const TOP_TEMPORAL_INDICATORS = [
  'affordabilityPressure',
  'familyReadiness',
  'healthcareResilience',
  'safetyStability',
  'environmentalStress',
];

export const buildCityIndicatorTimeline = (city, indicatorKey) => {
  const trend = inferTrendFromAudit(city);
  const volatility = inferVolatilityFromAudit(city);
  const confidence = inferConfidenceFromAudit(city);
  const current = indicatorCurrentValue(city, indicatorKey);

  return {
    cityId: city.key,
    indicatorKey,
    current,
    trend,
    volatility,
    confidence,
    forecast: buildForecastSeries({ current, trend, volatility }),
  };
};

export const buildCityTemporalOutlook = (city, indicatorKeys = TOP_TEMPORAL_INDICATORS) =>
  indicatorKeys.map((indicatorKey) => buildCityIndicatorTimeline(city, indicatorKey));
