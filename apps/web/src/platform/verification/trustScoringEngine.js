const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const parseReviewDate = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    const yearMatch = value.match(/(20\d{2})/);
    if (!yearMatch) {
      return null;
    }
    return new Date(`${yearMatch[1]}-01-01T00:00:00.000Z`);
  }

  return parsed;
};

const inferEvidenceClass = (auditCounts) => {
  const total = (auditCounts?.verified ?? 0) + (auditCounts?.mixed ?? 0) + (auditCounts?.modeled ?? 0);
  if (total <= 0) {
    return 'inferential';
  }

  const verifiedShare = (auditCounts.verified ?? 0) / total;
  const modeledShare = (auditCounts.modeled ?? 0) / total;

  if (verifiedShare >= 0.7) {
    return 'sourceBacked';
  }
  if (modeledShare <= 0.45) {
    return 'composite';
  }
  return 'inferential';
};

const GOVERNMENT_SOURCE_TOKENS = ['.gov', 'europa.eu', 'ministry', 'municipal'];
const INDEPENDENT_SOURCE_TOKENS = ['oecd', 'worldbank', 'imf', 'eurostat'];
const OBSERVATIONAL_SOURCE_TOKENS = ['operator', 'metro', 'hospital', 'service'];

const containsAnyToken = (value, tokens) => tokens.some((token) => value.includes(token));

const classifySource = (source) => {
  const value = String(source ?? '').toLowerCase();

  if (containsAnyToken(value, GOVERNMENT_SOURCE_TOKENS)) {
    return 'governmental';
  }
  if (containsAnyToken(value, INDEPENDENT_SOURCE_TOKENS)) {
    return 'independent';
  }
  if (containsAnyToken(value, OBSERVATIONAL_SOURCE_TOKENS)) {
    return 'observational';
  }
  return 'user_reported';
};

const computeSourceDiversityScore = (sources) => {
  if (!Array.isArray(sources) || sources.length === 0) {
    return 0.25;
  }

  const classes = new Set(sources.map((source) => classifySource(source)));
  return Number(clamp(classes.size / 4, 0.25, 1).toFixed(2));
};

const computeFreshness = (lastReviewed) => {
  const reviewDate = parseReviewDate(lastReviewed);
  if (!reviewDate) {
    return {
      freshnessDays: 365,
      freshnessDecay: 0.5,
    };
  }

  const now = new Date();
  const days = Math.max(0, Math.floor((now.getTime() - reviewDate.getTime()) / (24 * 60 * 60 * 1000)));
  const halfLifeDays = 365;
  const decay = Number((2 ** (-days / halfLifeDays)).toFixed(2));

  return {
    freshnessDays: days,
    freshnessDecay: clamp(decay, 0.05, 1),
  };
};

const computeConfidence = ({ auditCounts, sourceDiversityScore, freshnessDecay }) => {
  const total = (auditCounts?.verified ?? 0) + (auditCounts?.mixed ?? 0) + (auditCounts?.modeled ?? 0);
  if (total <= 0) {
    return 0.35;
  }

  const evidenceQuality = ((auditCounts.verified ?? 0) * 1 + (auditCounts.mixed ?? 0) * 0.65 + (auditCounts.modeled ?? 0) * 0.3) / total;
  const confidence = (evidenceQuality * 0.55) + (sourceDiversityScore * 0.2) + (freshnessDecay * 0.25);

  return Number(clamp(confidence, 0.1, 0.99).toFixed(2));
};

export const buildCityVerificationProfile = (city, snapshot = null) => {
  const auditCounts = city?.audit?.counts ?? { verified: 0, mixed: 0, modeled: 0 };
  const sourceRefs = (snapshot?.verifiedDetails ?? []).flatMap((detail) => detail?.sources ?? []);
  const sourceDiversityScore = computeSourceDiversityScore(sourceRefs);
  const { freshnessDays, freshnessDecay } = computeFreshness(snapshot?.lastReviewed ?? city?.audit?.lastReviewed);
  const confidence = computeConfidence({ auditCounts, sourceDiversityScore, freshnessDecay });
  const evidenceClass = inferEvidenceClass(auditCounts);

  return {
    cityId: city.key,
    metricKey: 'overall_city_verification',
    evidenceClass,
    sourceCount: sourceRefs.length,
    sourceDiversityScore,
    freshnessDays,
    freshnessDecay,
    confidence,
    verifiedAt: snapshot?.lastReviewed ?? city?.audit?.lastReviewed ?? null,
    sourceRefs,
  };
};
