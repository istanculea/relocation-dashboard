import { strategicBalancePillars, strategicBalanceWeights } from './dashboardConfig.js';
import { mcdaPayloads } from './mcdaPayloads.js';
import { computeMcdaScore, defaultMcdaConfig } from './engines/mcdaEngine.js';

const euroFormatter = new Intl.NumberFormat('en-IE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});

const extractNumbers = (value) => [...String(value ?? '').matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));

const clampScore = (value) => Number(Math.max(1, Math.min(10, value)).toFixed(2));

const average = (values) => values.reduce((total, value) => total + value, 0) / values.length;

const averageBudgetMidpoint = (city) => average([city.budgets.oneParent.midpoint, city.budgets.bothWorking.midpoint]);

const parseBikeScore = (value) => {
  const match = String(value ?? '').match(/(\d+(?:\.\d+)?)\s*\/\s*10/);

  return match ? Number(match[1]) : 5.5;
};

const parseTaxAverage = (value) => {
  const values = extractNumbers(value);

  if (!values.length) {
    return 35;
  }

  return average(values);
};

const midpointScore = (value) => {
  if (value <= 2500) {
    return 9.2;
  }

  if (value <= 3000) {
    return 8.4;
  }

  if (value <= 3400) {
    return 7.6;
  }

  if (value <= 3800) {
    return 6.8;
  }

  if (value <= 4300) {
    return 5.9;
  }

  return 4.9;
};

const taxScore = (value) => {
  if (value <= 28) {
    return 8.5;
  }

  if (value <= 32) {
    return 7.8;
  }

  if (value <= 36) {
    return 7.1;
  }

  if (value <= 40) {
    return 6.3;
  }

  return 5.4;
};

const diningScore = (value) => {
  const values = extractNumbers(value);

  if (!values.length) {
    return 6.5;
  }

  const averageValue = average(values);

  if (averageValue <= 45) {
    return 8.5;
  }

  if (averageValue <= 55) {
    return 7.8;
  }

  if (averageValue <= 70) {
    return 7.1;
  }

  if (averageValue <= 85) {
    return 6.2;
  }

  return 5.3;
};

const availabilityScore = (value) => {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized.includes('high') && normalized.includes('medium')) {
    return 7.6;
  }

  if (normalized.includes('high')) {
    return 8.4;
  }

  if (normalized.includes('medium')) {
    return 6.8;
  }

  if (normalized.includes('low')) {
    return 5.8;
  }

  return 6.4;
};

const pm25Score = (value) => {
  if (value <= 10) {
    return 9.2;
  }

  if (value <= 12) {
    return 8.7;
  }

  if (value <= 15) {
    return 7.9;
  }

  if (value <= 18) {
    return 6.9;
  }

  if (value <= 22) {
    return 5.9;
  }

  return 4.8;
};

const airQualityScore = (value) => {
  if (value >= 80) {
    return 9.1;
  }

  if (value >= 70) {
    return 8.3;
  }

  if (value >= 60) {
    return 7.5;
  }

  if (value >= 50) {
    return 6.7;
  }

  if (value >= 40) {
    return 5.9;
  }

  return 5.1;
};

const pollutionIndexScore = (value) => {
  if (value <= 25) {
    return 8.8;
  }

  if (value <= 35) {
    return 8;
  }

  if (value <= 45) {
    return 7.2;
  }

  if (value <= 55) {
    return 6.4;
  }

  if (value <= 65) {
    return 5.6;
  }

  return 4.8;
};

const resolveAirScore = (city) => {
  const scoreCandidates = [];

  if (Number.isFinite(city.mobility.pm25)) {
    scoreCandidates.push(pm25Score(city.mobility.pm25));
  }

  if (Number.isFinite(city.mobility.airQualityIndex)) {
    scoreCandidates.push(airQualityScore(city.mobility.airQualityIndex));
  }

  if (Number.isFinite(city.mobility.pollutionIndex)) {
    scoreCandidates.push(pollutionIndexScore(city.mobility.pollutionIndex));
  }

  if (scoreCandidates.length) {
    return clampScore(average(scoreCandidates));
  }

  return clampScore(city.scores.environment);
};

const parkScore = (value) => {
  if (value >= 75) {
    return 8.7;
  }

  if (value >= 68) {
    return 7.9;
  }

  if (value >= 60) {
    return 7.1;
  }

  if (value >= 52) {
    return 6.4;
  }

  return 5.5;
};

const fifteenMinuteScore = (value) => {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized.startsWith('yes')) {
    if (normalized.includes('most') || normalized.includes('large parts') || normalized.includes('many')) {
      return 8.7;
    }

    if (normalized.includes('selected') || normalized.includes('some')) {
      return 7.7;
    }

    return 8.3;
  }

  if (normalized.includes('partial')) {
    return 6.5;
  }

  if (normalized.startsWith('no')) {
    return 4.8;
  }

  return 6;
};

const carNeedScore = (value) => {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized.includes('low to medium')) {
    return 7.2;
  }

  if (normalized.includes('low')) {
    return 8.5;
  }

  if (normalized.includes('medium')) {
    return 5.9;
  }

  return 4.8;
};

const scoreFromPhrases = (text, baseScore, phrases) => {
  const normalized = String(text ?? '').toLowerCase();

  const score = phrases.reduce((current, phrase) => {
    if (!normalized.includes(phrase.value)) {
      return current;
    }

    return current + phrase.delta;
  }, baseScore);

  return clampScore(score);
};

const qualityOfLifeScore = (value) =>
  scoreFromPhrases(value, 6.4, [
    { value: 'easy', delta: 0.8 },
    { value: 'strong', delta: 0.7 },
    { value: 'excellent', delta: 0.8 },
    { value: 'calm', delta: 0.7 },
    { value: 'workable', delta: 0.4 },
    { value: 'predictable', delta: 0.4 },
    { value: 'rough', delta: -0.9 },
    { value: 'harder', delta: -0.4 },
    { value: 'pressure', delta: -0.5 },
    { value: 'thin', delta: -0.6 },
    { value: 'fragmented', delta: -0.8 },
    { value: 'nuisance', delta: -0.5 },
  ]);

const schoolQualityScore = (value) =>
  scoreFromPhrases(value, 6.6, [
    { value: 'strong', delta: 0.8 },
    { value: 'solid', delta: 0.6 },
    { value: 'excellent', delta: 0.8 },
    { value: 'optional rather than necessary', delta: 0.6 },
    { value: 'uneven', delta: -0.9 },
    { value: 'district-sensitive', delta: -0.5 },
    { value: 'private buys predictability', delta: -0.4 },
    { value: 'private is mostly', delta: -0.2 },
  ]);

const waterQualityScore = (value) =>
  scoreFromPhrases(value, 7.2, [
    { value: 'excellent', delta: 1 },
    { value: 'safe and good', delta: 0.8 },
    { value: 'good tap water', delta: 0.7 },
    { value: 'safe', delta: 0.4 },
    { value: 'hard', delta: -0.3 },
    { value: 'filters are common', delta: -0.2 },
  ]);

const weatherResilienceScore = (value) =>
  scoreFromPhrases(value, 6.3, [
    { value: 'mild', delta: 0.8 },
    { value: 'stable', delta: 0.5 },
    { value: 'manageable', delta: 0.3 },
    { value: 'heat', delta: -0.4 },
    { value: 'flood', delta: -0.7 },
    { value: 'smoke', delta: -0.6 },
    { value: 'storm', delta: -0.5 },
    { value: 'humid', delta: -0.3 },
    { value: 'air-quality inversions', delta: -0.8 },
  ]);

const familySupportScore = (city) => {
  const status = city.audit.sections.familyBenefits;

  if (status === 'verified') {
    return 7.9;
  }

  if (status === 'mixed') {
    return 6.9;
  }

  return 6.1;
};

const childcareConfidenceScore = (city) => {
  const status = city.audit.sections.childcareCosts;

  if (status === 'verified') {
    return 8.4;
  }

  if (status === 'mixed') {
    return 7.2;
  }

  return 6.2;
};

const auditCoverageScore = (city) => {
  const totalSections = city.audit.sectionEntries.length || 1;

  return clampScore(5 + (city.audit.counts.verified / totalSections) * 4.5);
};

const safetyIndexScore = (city) => {
  const value = extractNumbers(city.support.safety)[0] ?? city.scores.safety * 10;

  return clampScore(value / 10);
};

// Language profile: English (native) · Spanish B2 · Italian B1
// German and Romanian require near-fluency for daily admin, healthcare, nursery communications,
// and — critically — building a psychotherapy client base locally.
const languageBarrierScore = (city) => {
  const country = (city.country ?? '').toLowerCase();

  if (country.includes('united kingdom') || country.includes('ireland')) {
    // Native English — zero practical barrier
    return 9.5;
  }
  if (country.includes('spain')) {
    // B2 Spanish — comfortable for daily life, manageable for admin and professional contexts
    return 8.2;
  }
  if (country.includes('italy')) {
    // B1 Italian — functional but real friction for legal/admin/medical/schooling communications
    return 7.2;
  }
  if (country.includes('germany') || country.includes('austria')) {
    // No German — significant day-to-day barrier; psychotherapy practice requires fluency
    return 4.0;
  }
  if (country.includes('romania')) {
    // Native Romanian — zero language barrier
    return 9.5;
  }
  return 5.5;
};

const languageSummary = (city) => {
  const s = languageBarrierScore(city);
  if (s >= 9) return 'No barrier — native language';
  if (s >= 8) return 'Low barrier — B2 Spanish';
  if (s >= 7) return 'Some friction — B1 Italian';
  if (s >= 5) return 'Moderate language barrier';
  return 'High barrier — German required';
};

const transitScore = (city) => {
  const carScore = carNeedScore(city.mobility.carNeed);
  const fifteenMinute = fifteenMinuteScore(city.city360.fifteenMinute);
  const bikeScore = parseBikeScore(city.city360.bikeLanes);

  return clampScore(average([carScore, fifteenMinute, bikeScore]));
};

const labelTier = (score) => {
  if (score >= 8.2) {
    return 'Strong';
  }

  if (score >= 7) {
    return 'Good';
  }

  if (score >= 6) {
    return 'Mixed';
  }

  return 'Drag';
};

const summarizeFifteenMinute = (value) => {
  const normalized = String(value ?? '').toLowerCase();

  if (normalized.startsWith('yes')) {
    return 'Core districts work car-light';
  }

  if (normalized.includes('partial')) {
    return 'Patchy 15-minute coverage';
  }

  return 'District choice matters';
};

const buildCategory = (label, score, summary) => ({
  label,
  score: clampScore(score),
  summary,
  tier: labelTier(score),
});

// ---------------------------------------------------------------------------
// MCDA-backed implementation
// Maps the 15 MCDA pillar scores (0–100) to the output shape:
//   { weightedScore (0–10), pillars: [{key, label, score (0–10), tier, summary}] }
// For cities without an MCDA payload, falls back to a legacy approximation.
// ---------------------------------------------------------------------------

const buildMcdaStrategyShape = (city, mcdaResult, profileType = 'single_income') => {
  const { pillars: raw, rentEur, effectiveRentEur } = mcdaResult;
  const payload = mcdaPayloads[city.key];

  const pillarData = {
    euRegistration: buildCategory(
      'EU Registration & Residency Pathway',
      raw.p1 / 10,
      `Settling ease ${payload.settling_ease}, online paperwork ${payload.paperwork_online}`,
    ),
    diplomaRecognition: buildCategory(
      'Diploma Recognition & Professional Accreditation',
      raw.p2 / 10,
      `Recognition ${payload.degree_recognition}, psychotherapist ops ${payload.operating_psychotherapist}`,
    ),
    realEstateHousing: buildCategory(
      'Real Estate & Healthy Housing',
      raw.p3 / 10,
      `Budget score ${payload.budget}, infra ${payload.urban_infra}, water ${payload.raw_water_quality.toFixed(0)}`,
    ),
    rentalMarket: buildCategory(
      'Rental Market',
      raw.p4 / 10,
      profileType === 'dual_income'
        ? `Rent ~€${Math.round(rentEur)} / month (effective ~€${Math.round(effectiveRentEur ?? rentEur)} on dual income)`
        : `Rent ~€${Math.round(rentEur)} / month`,
    ),
    homeOwnership: buildCategory(
      'Home Ownership',
      raw.p5 / 10,
      `Budget score ${payload.budget}, infra ${payload.urban_infra}, online paperwork ${payload.paperwork_online}`,
    ),
    locationInfra: buildCategory(
      'Location & Infrastructure',
      raw.p6 / 10,
      `Urban ${payload.urban_infra}, walkways ${payload.walkways}, bike ${payload.bike_paths}`,
    ),
    cleanBasket: buildCategory(
      "The 'Clean' Shopping Basket",
      raw.p7 / 10,
      `Grocery/restaurant ${payload.grocery_restaurant_costs}, water quality ${payload.raw_water_quality.toFixed(0)}`,
    ),
    childcareEducation: buildCategory(
      'Childcare & Educational Path',
      raw.p8 / 10,
      `Raising children ${payload.raising_children}, state support ${payload.child_benefits}`,
    ),
    healthMedical: buildCategory(
      'Health, Medical Access',
      raw.p9 / 10,
      `Urban infra ${payload.urban_infra}, water ${payload.raw_water_quality.toFixed(0)}, psych ops ${payload.opp_psych}`,
    ),
    envPollution: buildCategory(
      'Environment & Pollution',
      raw.p10 / 10,
      `AQI ${payload.raw_air_aqi_yearly_avg}, disaster safety ${payload.disaster_safety}`,
    ),
    criminalityStreetSafe: buildCategory(
      'Criminality and Street Safeness',
      raw.p11 / 10,
      `Crime index ${payload.raw_crime_rate}, animal friendliness ${payload.animal_friendliness}`,
    ),
    mobilityLogistics: buildCategory(
      'Infrastructure, Mobility & Logistics',
      raw.p12 / 10,
      `Transit ${payload.transit_profile}, car-free ${payload.car_free_index}, driving rules ${payload.driving_rules}`,
    ),
    economyJobsTaxes: buildCategory(
      'Economy, Jobs, Taxes & Parity',
      raw.p13 / 10,
      `IT opp. ${payload.opp_it}, tax ${profileType === 'dual_income' ? payload.raw_tax_rate_dual : payload.raw_tax_rate_single}%`,
    ),
    climateResilience: buildCategory(
      'Climate & Resilience',
      raw.p14 / 10,
      `Climate comfort ${payload.climate_comfort}, disaster safety ${payload.disaster_safety}`,
    ),
    socialCapital: buildCategory(
      'Social Capital & Work-Life Balance',
      raw.p15 / 10,
      `Work-life ${payload.work_life_balance}, community ${payload.places_to_gather}, paid days ${payload.paid_days}`,
    ),
  };

  const weightedScore = clampScore(mcdaResult.finalScore / 10);

  return {
    weightedScore,
    pillars: strategicBalancePillars.map(([key, label]) => ({
      key,
      label,
      ...pillarData[key],
    })),
  };
};

export const buildStrategicBalanceMatrix = (city, profileType = 'single_income') => {
  const payload = mcdaPayloads[city.key];

  if (payload) {
    const mcdaResult = computeMcdaScore(payload, profileType, defaultMcdaConfig);

    return buildMcdaStrategyShape(city, mcdaResult, profileType);
  }

  // ── Legacy fallback (cities without an MCDA payload) ─────────────────────
  const midpoint = averageBudgetMidpoint(city);
  const budgetScore = midpointScore(midpoint);
  const taxAverage = parseTaxAverage(city.city360.personalTax);
  const taxLoadScore = taxScore(taxAverage);
  const airScore = resolveAirScore(city);
  const greenScore = parkScore(city.mobility.parkScore);
  const schoolScore = schoolQualityScore(city.childcare.schoolQuality);
  const transitFitScore = transitScore(city);
  const fitScore = qualityOfLifeScore(city.city360.fittingIn);
  const waterScore = waterQualityScore(city.city360.waterQuality);
  const foodScore = availabilityScore(city.basket.availability);
  const diningAffordability = diningScore(city.city360.dining);
  const supportScore = familySupportScore(city);
  const childcareConfidence = childcareConfidenceScore(city);
  const climateSummary = Number.isFinite(city.mobility.pm25)
    ? `PM2.5 ${city.mobility.pm25}`
    : Number.isFinite(city.mobility.airQualityIndex)
      ? `Air quality ${Math.round(city.mobility.airQualityIndex)}`
      : 'Comparative air fallback';

  const legacyPillarData = {
    euRegistration: buildCategory(
      'EU Registration & Residency Pathway',
      average([auditCoverageScore(city), taxLoadScore]),
      'Derived from audit coverage and tax structure proxy',
    ),
    diplomaRecognition: buildCategory(
      'Diploma Recognition & Professional Accreditation',
      taxLoadScore,
      'Proxied from institutional structure',
    ),
    realEstateHousing: buildCategory(
      'Real Estate & Healthy Housing',
      average([city.scores.housing, waterScore]),
      `Water quality: ${waterScore.toFixed(1)}`,
    ),
    rentalMarket: buildCategory(
      'Rental Market',
      budgetScore,
      `Midpoint ${euroFormatter.format(midpoint)}`,
    ),
    homeOwnership: buildCategory(
      'Home Ownership',
      average([budgetScore, city.scores.housing]),
      `Budget ${budgetScore.toFixed(1)} / 10`,
    ),
    locationInfra: buildCategory(
      'Location & Infrastructure',
      transitFitScore,
      `${transitFitScore.toFixed(1)} / 10 transit fit`,
    ),
    cleanBasket: buildCategory(
      "The 'Clean' Shopping Basket",
      average([foodScore, diningAffordability, waterScore]),
      'Food quality, dining, water proxy',
    ),
    childcareEducation: buildCategory(
      'Childcare & Educational Path',
      average([city.scores.childcare, childcareConfidence, schoolScore]),
      city.audit.sections.childcareCosts === 'verified' ? 'Verified childcare anchor' : 'Childcare partly modeled',
    ),
    healthMedical: buildCategory(
      'Health, Medical Access',
      city.scores.healthcare,
      'Healthcare access score',
    ),
    envPollution: buildCategory(
      'Environment & Pollution',
      airScore,
      climateSummary,
    ),
    criminalityStreetSafe: buildCategory(
      'Criminality and Street Safeness',
      city.scores.safety,
      'Safety index proxy',
    ),
    mobilityLogistics: buildCategory(
      'Infrastructure, Mobility & Logistics',
      average([transitFitScore, greenScore]),
      `Transit ${transitFitScore.toFixed(1)}, parks ${greenScore.toFixed(1)}`,
    ),
    economyJobsTaxes: buildCategory(
      'Economy, Jobs, Taxes & Parity',
      average([taxLoadScore, supportScore]),
      `Tax load ~${Math.round(taxAverage)}%`,
    ),
    climateResilience: buildCategory(
      'Climate & Resilience',
      average([airScore, greenScore, weatherResilienceScore(city.city360.extremeWeather)]),
      climateSummary,
    ),
    socialCapital: buildCategory(
      'Social Capital & Work-Life Balance',
      fitScore,
      'Quality-of-life and community proxy',
    ),
  };

  const weightedScore = clampScore(
    strategicBalancePillars.reduce(
      (total, [key]) => total + legacyPillarData[key].score * (strategicBalanceWeights[key] ?? 0),
      0,
    ),
  );

  return {
    weightedScore,
    pillars: strategicBalancePillars.map(([key, label]) => ({
      key,
      label,
      ...legacyPillarData[key],
    })),
  };
};

export const strategicBalanceMethodologyNote =
  'Strategic Balance uses a 15-pillar MCDA engine covering: EU Registration, Diploma Recognition, Real Estate & Healthy Housing, Rental Market, Home Ownership, Location & Infrastructure, Clean Shopping Basket, Childcare & Educational Path, Health & Medical Access, Environment & Pollution, Criminality & Street Safeness, Infrastructure & Mobility, Economy/Jobs/Taxes & Parity, Climate & Resilience, and Social Capital. Scores are logarithmically adjusted for rent, normalized for crime and pollution, and weighted by the active family profile. Final scores are on a 0–10 scale.';