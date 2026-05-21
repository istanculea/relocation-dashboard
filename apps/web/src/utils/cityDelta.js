const METRIC_CONFIG = {
  overallScore: {
    key: 'overallScore',
    label: 'Overall score',
    tone: (delta) => (delta > 0 ? 'positive' : delta < 0 ? 'negative' : 'neutral'),
    formatValue: (value) => (Number.isFinite(value) ? value.toFixed(2) : '—'),
  },
  oneParentBudget: {
    key: 'oneParentBudget',
    label: 'One-income budget',
    tone: (delta) => (delta < 0 ? 'positive' : delta > 0 ? 'negative' : 'neutral'),
    formatValue: (value) =>
      Number.isFinite(value) ? `EUR ${Math.round(value).toLocaleString('en-IE')}` : '—',
  },
  bothWorkingBudget: {
    key: 'bothWorkingBudget',
    label: 'Dual-income budget',
    tone: (delta) => (delta < 0 ? 'positive' : delta > 0 ? 'negative' : 'neutral'),
    formatValue: (value) =>
      Number.isFinite(value) ? `EUR ${Math.round(value).toLocaleString('en-IE')}` : '—',
  },
  pm25: {
    key: 'pm25',
    label: 'PM2.5',
    tone: (delta) => (delta < 0 ? 'positive' : delta > 0 ? 'negative' : 'neutral'),
    formatValue: (value) => (Number.isFinite(value) ? `${value}` : '—'),
  },
};

const trendSorter = (left, right) => (left.year ?? 0) - (right.year ?? 0);

const getSortedTrends = (trends) => [...trends].sort(trendSorter);

const finiteOrNull = (value) => (Number.isFinite(value) ? value : null);

const formatDelta = (delta, valueFormatter) => {
  if (!Number.isFinite(delta)) {
    return 'No change data';
  }

  const sign = delta > 0 ? '+' : '';
  return `${sign}${valueFormatter(delta)}`;
};

export const getMetricDelta = (trends, metricKey) => {
  if (!Array.isArray(trends) || trends.length < 2) {
    return null;
  }

  const sorted = getSortedTrends(trends);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const previous = finiteOrNull(first?.[metricKey]);
  const current = finiteOrNull(last?.[metricKey]);

  if (!Number.isFinite(previous) || !Number.isFinite(current)) {
    return null;
  }

  return {
    metricKey,
    startYear: first?.year ?? null,
    endYear: last?.year ?? null,
    previous,
    current,
    delta: current - previous,
  };
};

export const buildCityDeltaCards = (city) => {
  const trends = city?.trends;

  if (!Array.isArray(trends) || trends.length < 2) {
    return [];
  }

  return Object.values(METRIC_CONFIG)
    .map((metricConfig) => {
      const metricDelta = getMetricDelta(trends, metricConfig.key);

      if (!metricDelta) {
        return null;
      }

      const tone = metricConfig.tone(metricDelta.delta);
      const formattedCurrent = metricConfig.formatValue(metricDelta.current);
      const formattedPrevious = metricConfig.formatValue(metricDelta.previous);
      const formattedDelta = formatDelta(metricDelta.delta, metricConfig.formatValue);

      return {
        key: metricConfig.key,
        label: metricConfig.label,
        tone,
        summary: `${metricDelta.startYear} -> ${metricDelta.endYear}`,
        value: formattedCurrent,
        detail: `Was ${formattedPrevious} (${formattedDelta})`,
      };
    })
    .filter(Boolean);
};
