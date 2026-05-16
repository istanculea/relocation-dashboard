const sourceFallbackByStatus = {
  verified:
    'Verified in the audit layer, but this section does not yet carry a dedicated inline citation in the card.',
  mixed: 'Blended section: sourced anchors and modeled comparison assumptions are both present here.',
  modeled: 'Modeled comparison layer. No direct source link was stored for this section in this build.',
};

const benchmarkPattern = /(numbeo|expatistan|livingcost|benchmark)/i;

export const isSourceInVerificationWindow = (source) =>
  Boolean(source?.verifiedAt && /\b202[2-6]\b/.test(source.verifiedAt));

export const getSectionSources = (city, sectionKey) => city.sources?.[sectionKey] ?? [];

export const getGapSources = (city, sectionKey) =>
  getSectionSources(city, sectionKey).filter((entry) => entry.gapNote && entry.note);

export const getVerifiedSources = (city, sectionKey) =>
  getSectionSources(city, sectionKey).filter((entry) => isSourceInVerificationWindow(entry));

export const getFirstVerifiedSource = (city, sectionKey, predicate = () => true) =>
  getVerifiedSources(city, sectionKey).find((entry) => predicate(entry));

export const getStrictDisplaySources = (city, sectionKey) => {
  const verifiedEntries = getVerifiedSources(city, sectionKey);

  if (verifiedEntries.length) {
    return verifiedEntries;
  }

  return getGapSources(city, sectionKey);
};

const getBenchmarkLabels = (city, sectionKey) =>
  [...new Set(
    getSectionSources(city, sectionKey)
      .filter((entry) => benchmarkPattern.test(`${entry.label} ${entry.note ?? ''}`))
      .map((entry) => entry.label),
  )];

const getOfficialLabels = (city, sectionKey) =>
  [...new Set(
    getSectionSources(city, sectionKey)
      .filter((entry) => !entry.gapNote && !benchmarkPattern.test(`${entry.label} ${entry.note ?? ''}`))
      .map((entry) => entry.label),
  )];

export const getGapReason = (city, sectionKey, status) => {
  const explicitGap = getGapSources(city, sectionKey)[0];

  if (explicitGap?.note) {
    return explicitGap.note;
  }

  const benchmarkLabels = getBenchmarkLabels(city, sectionKey);
  const officialLabels = getOfficialLabels(city, sectionKey);

  if (status === 'modeled' && benchmarkLabels.length) {
    return `Modeled comparison layer. No direct official city source is attached here; current cross-checks rely on ${benchmarkLabels.join(', ')}.`;
  }

  if (status === 'mixed' && officialLabels.length && benchmarkLabels.length) {
    return `Blended section. Current anchors mix official sources (${officialLabels.join(', ')}) with comparison sources (${benchmarkLabels.join(', ')}).`;
  }

  return sourceFallbackByStatus[status];
};

export const getSourceFallbackByStatus = (status) => sourceFallbackByStatus[status];