const extractNumbers = (value) =>
  [...String(value ?? '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));

const parseBikeScore = (value) => {
  const match = String(value ?? '').match(/(\d+(?:\.\d+)?)\s*\/\s*10/);

  return match ? Number(match[1]) : null;
};

const clampScale = (value) => Math.max(1, Math.min(10, value));

export const deriveMaxAqi = (row) => {
  if (Number.isFinite(row?.maxAqi)) {
    return row.maxAqi;
  }

  const values = extractNumbers(row?.city360?.ecoFactors);

  return values.length ? Math.max(...values) : null;
};

export const deriveTransitEfficiencyScore = (row) => {
  if (Number.isFinite(row?.transitEfficiencyScore)) {
    return clampScale(row.transitEfficiencyScore);
  }

  const mcdaPillar = (row?.strategicBalance?.pillars ?? []).find((pillar) => pillar.key === 'mobilityLogistics');

  if (mcdaPillar != null) {
    return clampScale(mcdaPillar.score);
  }

  let score = 5.6;
  const carNeed = row?.mobility?.carNeed;

  if (carNeed === 'Low') {
    score = 8.4;
  } else if (carNeed === 'Low to medium') {
    score = 7.2;
  } else if (carNeed === 'Medium') {
    score = 5.8;
  }

  if (String(row?.city360?.fifteenMinute).toLowerCase().startsWith('yes')) {
    score += 0.6;
  }

  const bikeScore = parseBikeScore(row?.city360?.bikeLanes);

  if (bikeScore !== null) {
    score = (score + bikeScore) / 2;
  }

  return clampScale(score);
};
