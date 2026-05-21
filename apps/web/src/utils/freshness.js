const DAY_MS = 24 * 60 * 60 * 1000;

const ISO_DATE_RE = /(\d{4}-\d{2}-\d{2})/;
const TEXT_DATE_RE = /(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})/;

const toValidDate = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

const parseIsoDateLike = (value) => {
  const isoMatch = value.match(ISO_DATE_RE);
  return isoMatch ? toValidDate(`${isoMatch[1]}T12:00:00Z`) : null;
};

const parseTextDateLike = (value) => {
  const textMatch = value.match(TEXT_DATE_RE);
  return textMatch ? toValidDate(textMatch[1]) : null;
};

export const parseDateLike = (rawValue) => {
  if (!rawValue) {
    return null;
  }

  if (rawValue instanceof Date) {
    return toValidDate(rawValue);
  }

  if (typeof rawValue !== 'string') {
    return null;
  }

  const value = rawValue.trim();

  if (!value) {
    return null;
  }

  return parseIsoDateLike(value) ?? parseTextDateLike(value) ?? toValidDate(value);
};

const toTierMeta = (tier) => {
  if (tier === 'fresh') {
    return { tier, label: 'Fresh', css: 'freshness-badge--fresh' };
  }

  if (tier === 'aging') {
    return { tier, label: 'Aging', css: 'freshness-badge--aging' };
  }

  if (tier === 'stale') {
    return { tier, label: 'Stale', css: 'freshness-badge--stale' };
  }

  return { tier: 'unknown', label: 'Unknown', css: 'freshness-badge--unknown' };
};

export const getFreshnessMeta = (
  dateLike,
  {
    now = new Date(),
    freshDays = 21,
    agingDays = 60,
  } = {},
) => {
  const date = parseDateLike(dateLike);

  if (!date || !Number.isFinite(now.getTime())) {
    return {
      ...toTierMeta('unknown'),
      ageDays: null,
      date,
    };
  }

  const ageDays = Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
  const tier =
    ageDays <= freshDays
      ? 'fresh'
      : ageDays <= agingDays
        ? 'aging'
        : 'stale';

  return {
    ...toTierMeta(tier),
    ageDays,
    date,
  };
};

export const formatFreshnessAge = (ageDays) => {
  if (!Number.isFinite(ageDays)) {
    return 'date unavailable';
  }

  if (ageDays === 0) {
    return 'updated today';
  }

  if (ageDays === 1) {
    return '1 day old';
  }

  return `${ageDays} days old`;
};

export const formatFreshnessLabel = (freshnessMeta) =>
  `${freshnessMeta.label} · ${formatFreshnessAge(freshnessMeta.ageDays)}`;
