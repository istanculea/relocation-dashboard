import {
  auditSectionLabels,
  auditStatusMeta,
  budgetComponentLabels,
  priorityPresets,
  scenarioMeta,
  scorePillars,
  scoreWeights,
  strategicBalancePillars,
  strategicBalanceWeights,
  verificationWindow,
} from './data/dashboardConfig';
import { formatEuro } from './utils/formatters.js';
import {
  buildStrategicBalanceMatrix,
  strategicBalanceMethodologyNote,
} from './data/strategicBalanceMatrix.js';
import cityAuditMetaSummary from './data/cityAuditMetaSummary.json';
import city360SummaryMeta from './data/city360SummaryMeta.json';
import cityComparisonSummary from './data/cityComparisonSummary.json';
import { cityBudgetModels } from './data/cityBudgetModels';
import { cityComparisonMeta } from './data/cityComparisonMeta';
import { cityCatalog } from './data/cityCatalog.js';
import { benchmarkSources } from './data/benchmarkSources.js';
import { mcdaPayloads } from './data/mcdaPayloads.js';
import { officialChildcareTariffs } from './data/officialChildcareTariffs.js';
import verifiedSnapshotCompact from './data/verifiedSnapshotCompact.json';
import { computeClassicScore } from './data/engines/scoringFormulas.js';
import { buildSpatialHierarchy } from '../../../packages/domain/index.js';
import { buildCityTemporalOutlook, TOP_TEMPORAL_INDICATORS } from '../../../packages/forecasting/index.js';
import { buildStrategicPositioning } from '../../../packages/scoring/index.js';
import { buildNarrativeBrief } from '../../../packages/narratives/index.js';
import { buildCityVerificationProfile } from '../../../packages/verification/index.js';

const countAuditStatuses = (sections) =>
  Object.values(sections).reduce(
    (counts, status) => ({
      ...counts,
      [status]: counts[status] + 1,
    }),
    { verified: 0, mixed: 0, modeled: 0 },
  );

const enrichAudit = (audit) => ({
  ...audit,
  counts: countAuditStatuses(audit.sections),
  sectionEntries: Object.entries(audit.sections).map(([key, status]) => ({
    key,
    label: auditSectionLabels[key],
    status,
    statusLabel: auditStatusMeta[status].label,
  })),
});

const sumBudgetComponents = (components) =>
  Object.values(components).reduce((total, value) => total + value, 0);

const mergedComparisonMeta = {
  ...cityComparisonSummary,
  ...cityComparisonMeta,
};

const ensureBudgetBand = (band, fallbackMidpoint = null) => {
  const midpoint = Number.isFinite(band?.midpoint) ? band.midpoint : fallbackMidpoint;

  if (!Number.isFinite(midpoint)) {
    return { min: null, midpoint: null, comfortable: null };
  }

  return {
    min: Number.isFinite(band?.min) ? band.min : Math.round(midpoint * 0.87),
    midpoint,
    comfortable: Number.isFinite(band?.comfortable) ? band.comfortable : Math.round(midpoint * 1.20),
  };
};

const buildCityBudgets = (city, budgetComponents) => {
  if (!budgetComponents) {
    const oneParentMidpoint = Number.isFinite(city?.budgets?.oneParent?.midpoint)
      ? city.budgets.oneParent.midpoint
      : null;

    return {
      oneParent: ensureBudgetBand(city?.budgets?.oneParent),
      bothWorking: ensureBudgetBand(city?.budgets?.bothWorking),
      twoKids: ensureBudgetBand(
        city?.budgets?.twoKids,
        Number.isFinite(oneParentMidpoint) ? Math.round(oneParentMidpoint * 1.18) : null,
      ),
      oneIncTwoKids: ensureBudgetBand(
        city?.budgets?.oneIncTwoKids,
        Number.isFinite(oneParentMidpoint) ? Math.round(oneParentMidpoint * 1.18) : null,
      ),
    };
  }

  return {
    oneParent: {
      ...city.budgets.oneParent,
      midpoint: sumBudgetComponents(budgetComponents.oneParent),
    },
    bothWorking: {
      ...city.budgets.bothWorking,
      midpoint: sumBudgetComponents(budgetComponents.bothWorking),
    },
    twoKids: (() => {
      const mid = sumBudgetComponents(budgetComponents.twoKids);
      return { min: Math.round(mid * 0.87), midpoint: mid, comfortable: Math.round(mid * 1.20) };
    })(),
    oneIncTwoKids: (() => {
      const mid = budgetComponents.oneIncTwoKids
        ? sumBudgetComponents(budgetComponents.oneIncTwoKids)
        : Math.round(sumBudgetComponents(budgetComponents.oneParent) * 1.18);
      return { min: Math.round(mid * 0.87), midpoint: mid, comfortable: Math.round(mid * 1.20) };
    })(),
  };
};

const getCityMaxAqi = (city, city360) => {
  if (Number.isFinite(city360?.maxAqi)) {
    return city360.maxAqi;
  }

  const payload = mcdaPayloads[city.key];

  return payload ? payload.raw_air_aqi_yearly_avg : null;
};

const getVerifiedSnapshot = (cityKey) => verifiedSnapshotCompact[cityKey] ?? {
  verifiedSections: [],
  verifiedDetails: [],
  verifiedSourceSummary: 'None',
  childcare: null,
  mobility: null,
  familyBenefits: null,
  lastReviewed: null,
};

export const cities = cityCatalog.map((city) => {
  const audit = enrichAudit(cityAuditMetaSummary[city.key]);
  const budgetComponents = cityBudgetModels[city.key] ?? null;
  const city360 = city360SummaryMeta[city.key];
  const officialChildcareTariff = officialChildcareTariffs[city.key] ?? null;

  const enrichedCity = {
    ...city,
    audit,
    budgetComponents,
    city360,
    comparison: mergedComparisonMeta[city.key] ?? null,
    hasOfficialChildcareTariff: Boolean(officialChildcareTariff),
    maxAqi: getCityMaxAqi(city, city360),
    officialChildcareTariff,
    budgets: buildCityBudgets(city, budgetComponents),
  };

  const snapshot = getVerifiedSnapshot(city.key);
  const verificationProfile = buildCityVerificationProfile(enrichedCity, snapshot);

  return {
    ...enrichedCity,
    verificationProfile,
    strategicBalance: buildStrategicBalanceMatrix(enrichedCity),
    // Recompute 5-pillar classic scores dynamically from raw facts.
    // computeClassicScore falls back to the pre-authored scores.* values
    // when they exist, so this is backward-compatible with all city files.
    scores: computeClassicScore(enrichedCity),
  };
});

export const spatialHierarchy = buildSpatialHierarchy(cities);

const computeTier = (salary, budget) => {
  if (salary < budget.min) {
    return 'unsafe';
  }
  if (salary < budget.midpoint) {
    return 'tight';
  }
  if (salary < budget.comfortable) {
    return 'comfortable';
  }
  return 'very comfortable';
};

export const buildBudgetBands = (scenario) =>
  [...cities]
    .map((city) => ({
      city: city.city,
      min: city.budgets[scenario].min,
      midpoint: city.budgets[scenario].midpoint,
      comfortable: city.budgets[scenario].comfortable,
    }))
    .sort((left, right) => left.midpoint - right.midpoint);

export const buildThresholdRows = (scenario) =>
  cities.map((city) => {
    const budget = city.budgets[scenario];
    const thresholds = [budget.min, budget.midpoint, budget.comfortable];

    return {
      city: city.city,
      unsafe: `< ${formatEuro(budget.min)}`,
      tight: `${formatEuro(budget.min)} to ${formatEuro(budget.midpoint - 1)}`,
      comfortable: `${formatEuro(budget.midpoint)} to ${formatEuro(budget.comfortable - 1)}`,
      veryComfortable: `${formatEuro(budget.comfortable)}+`,
      sampleTier: computeTier(Math.round((thresholds[0] + thresholds[1]) / 2), budget),
    };
  });

export const buildBudgetComponentRows = (scenario) =>
  cities
    .filter((city) => city.budgetComponents?.[scenario])
    .map((city) => {
    const components = city.budgetComponents[scenario];

    return {
      city: city.city,
      ...components,
      midpoint: sumBudgetComponents(components),
    };
  });

export const buildAuditRows = () =>
  cities.map((city) => ({
    city: city.city,
    country: city.country,
    overall: city.audit.overall,
    lastReviewed: city.audit.lastReviewed,
    verified: city.audit.counts.verified,
    mixed: city.audit.counts.mixed,
    modeled: city.audit.counts.modeled,
    notes: city.audit.notes ?? '',
  }));

export const isStrictlyVerifiedSection = (city, sectionKey) =>
  city.audit.sections[sectionKey] === 'verified'
  && getVerifiedSnapshot(city.key).verifiedDetails.some((detail) => detail.key === sectionKey);

export const buildVerifiedSnapshotRows = () =>
  cities.map((city) => {
    const snapshot = getVerifiedSnapshot(city.key);
    const verifiedDetails = snapshot.verifiedDetails ?? [];

    return {
      key: city.key,
      city: city.city,
      country: city.country,
      verifiedSections: snapshot.verifiedSections ?? verifiedDetails.map((detail) => detail.section),
      verifiedDetails,
      verifiedSourceSummary: snapshot.verifiedSourceSummary ?? 'None',
      childcare: snapshot.childcare ?? null,
      mobility: snapshot.mobility ?? null,
      familyBenefits: snapshot.familyBenefits ?? null,
      lastReviewed: snapshot.lastReviewed ?? city.audit.lastReviewed,
      verificationProfile: city.verificationProfile,
    };
  });

const scoreFamilyRhythm = (city) => {
  const childcare = city.scores?.childcare ?? 5;
  const safety = city.scores?.safety ?? 5;
  const calm = city.city360?.quietness ?? city.city360?.personality ?? '';
  const calmHint = /calm|quiet|slow|grounded/i.test(String(calm)) ? 1.2 : 0;

  return Number(Math.max(1, Math.min(10, ((childcare * 0.5) + (safety * 0.4) + calmHint))).toFixed(2));
};

const scorePsychologicalRhythm = (city) => {
  const fit = city.city360?.fittingIn ?? '';
  const stressHint = /friction|bureaucracy|stress|hard/i.test(String(fit)) ? -0.8 : 0.6;
  const environment = city.scores?.environment ?? 5;

  return Number(Math.max(1, Math.min(10, (environment * 0.8) + stressHint)).toFixed(2));
};

const scoreEnvironmentalRhythm = (city) => {
  const environment = city.scores?.environment ?? 5;
  const pm25Penalty = Number.isFinite(city.mobility?.pm25) ? Math.min(2, city.mobility.pm25 / 15) : 1;
  const score = environment - pm25Penalty + 1;

  return Number(Math.max(1, Math.min(10, score)).toFixed(2));
};

export const buildFamilyFitRows = () =>
  cities.map((city) => ({
    key: city.key,
    city: city.city,
    country: city.country,
    familyRhythm: scoreFamilyRhythm(city),
    psychologicalRhythm: scorePsychologicalRhythm(city),
    environmentalRhythm: scoreEnvironmentalRhythm(city),
    narrative: city.comparison?.narrative ?? city.city360?.personality ?? '',
  }));

export const calculateWeightedScore = (scores, weights) =>
  scorePillars.reduce((total, [key]) => total + scores[key] * weights[key], 0);

const deriveEvidenceCoverage = (city) => {
  const counts = city.audit?.counts ?? { verified: 0, mixed: 0, modeled: 0 };
  const total = counts.verified + counts.mixed + counts.modeled;
  if (total <= 0) {
    return 0.3;
  }

  const weighted = (counts.verified * 1) + (counts.mixed * 0.6) + (counts.modeled * 0.2);
  return Number(Math.max(0, Math.min(1, weighted / total)).toFixed(2));
};

const deriveStructuralStability = (city) => {
  const safety = Number(city.scores?.safety ?? 5);
  const environment = Number(city.scores?.environment ?? 5);
  return Number(Math.max(0, Math.min(1, ((safety + environment) / 20))).toFixed(2));
};

export const buildDecisionConfidenceRollup = (city) => {
  const sourceConfidence = Number(city.verificationProfile?.confidence ?? 0.35);
  const evidenceCoverage = deriveEvidenceCoverage(city);
  const structuralStability = deriveStructuralStability(city);
  const overallConfidence = Number((
    (sourceConfidence * 0.5)
    + (evidenceCoverage * 0.3)
    + (structuralStability * 0.2)
  ).toFixed(2));

  const confidenceBand = overallConfidence >= 0.78
    ? 'high'
    : overallConfidence >= 0.62
      ? 'medium'
      : 'low';

  return {
    overallConfidence,
    confidenceBand,
    sourceConfidence,
    evidenceCoverage,
    structuralStability,
  };
};

export const buildDecisionReasonCodes = ({ city, strategicBalance, confidenceRollup }) => {
  const reasons = [];
  const affordability = city.budgets?.oneParent?.midpoint ?? Number.POSITIVE_INFINITY;
  const infrastructure = Number(city.scores?.infrastructure ?? 5);
  const safety = Number(city.scores?.safety ?? 5);

  if (confidenceRollup.overallConfidence >= 0.75) {
    reasons.push({ code: 'verification_strength', label: 'Strong verification confidence', direction: 'positive' });
  }
  if (strategicBalance.weightedScore >= 7.4) {
    reasons.push({ code: 'strategic_fit_high', label: 'High strategic fit score', direction: 'positive' });
  }
  if (infrastructure >= 7) {
    reasons.push({ code: 'mobility_resilience', label: 'Resilient mobility infrastructure', direction: 'positive' });
  }
  if (safety >= 7) {
    reasons.push({ code: 'safety_anchor', label: 'Safety and stability anchor', direction: 'positive' });
  }
  if (affordability <= 2800) {
    reasons.push({ code: 'affordability_headroom', label: 'Affordability headroom', direction: 'positive' });
  }
  if (affordability >= 3600) {
    reasons.push({ code: 'cost_pressure', label: 'Elevated cost pressure', direction: 'risk' });
  }

  return reasons.slice(0, 4);
};

export const buildDecisionEngineSummary = ({ city, strategicBalance }) => {
  const confidenceRollup = buildDecisionConfidenceRollup(city);
  const reasonCodes = buildDecisionReasonCodes({ city, strategicBalance, confidenceRollup });

  return {
    ...confidenceRollup,
    reasonCodes,
    primaryReasonCode: reasonCodes[0]?.code ?? null,
  };
};

export const sortRankedCities = (rows) => [...rows].sort((left, right) => {
  if (right.activeWeightedScore !== left.activeWeightedScore) {
    return right.activeWeightedScore - left.activeWeightedScore;
  }

  const rightConfidence = right.decisionEngine?.overallConfidence ?? 0;
  const leftConfidence = left.decisionEngine?.overallConfidence ?? 0;
  if (rightConfidence !== leftConfidence) {
    return rightConfidence - leftConfidence;
  }

  return String(left.city).localeCompare(String(right.city));
});

const scenarioProfileTypes = {
  bothWorking: 'dual_income',
  oneIncTwoKids: 'single_income_two_kids',
  twoKids: 'family_of_four',
};

const balanceProfileTypes = {
  family_of_four: 'dual_income',
  single_income_two_kids: 'single_income',
};

const pillarWeightScalers = {
  dual_income: {
    childcareEducation: 1.15,
    economyJobsTaxes: 1.10,
    rentalMarket: 0.90,
  },
  family_of_four: {
    childcareEducation: 1.30,
    economyJobsTaxes: 1.10,
    healthMedical: 1.10,
    rentalMarket: 0.85,
  },
  single_income_two_kids: {
    childcareEducation: 1.20,
    healthMedical: 1.05,
    rentalMarket: 0.88,
  },
};

export const buildRanking = (presetKey = 'balanced', scenarioKey = 'oneParent') => {
  const preset = priorityPresets[presetKey] ?? priorityPresets.balanced;
  const profileType = scenarioProfileTypes[scenarioKey] ?? 'single_income';

  // For pillar-weighted presets, nudge weights to reflect the active scenario.
  // dual_income: childcare & economy/jobs more critical; rental less dominant.
  // family_of_four: childcare weight boosted further (two children), health also up.
  // Re-normalise so weights still sum to 1 after adjustment.
  const effectivePillarWeights = (() => {
    if (!preset.pillarWeights || profileType === 'single_income') return preset.pillarWeights;

    const adjustedEntries = Object.entries(preset.pillarWeights).map(([key, value]) => [
      key,
      value * (pillarWeightScalers[profileType]?.[key] ?? 1),
    ]);
    const sum = adjustedEntries.reduce((total, [, value]) => total + value, 0);

    return Object.fromEntries(adjustedEntries.map(([key, value]) => [key, value / sum]));
  })();

  // family_of_four re-uses the dual_income strategic balance profile type
  // (two incomes, higher childcare weight) — the distinct pillar adjustments above
  // are what differentiate it from a plain dual_income ranking.
  const balanceProfileType = balanceProfileTypes[profileType] ?? profileType;

  const rankedCities = [...cities]
    .map((city) => {
      const strategicBalance = buildStrategicBalanceMatrix(city, balanceProfileType);
      const pillarWeights = effectivePillarWeights ?? preset.pillarWeights;

      const activeWeightedScore = preset.scoreType === 'strategicBalance'
        ? strategicBalance.weightedScore
        : preset.scoreType === 'strategicPillar'
          ? Math.max(1, Math.min(10, strategicBalance.pillars.reduce(
              (total, pillar) => total + pillar.score * (pillarWeights[pillar.key] ?? 0),
              0,
            )))
          : calculateWeightedScore(city.scores, preset.weights);

      const rankedCity = {
        ...city,
        strategicBalance,
        activeLensKey: presetKey,
        activeLensLabel: preset.label,
        activePillarWeights: pillarWeights,
        activeScoreType: preset.scoreType,
        activeWeightedScore,
      };

      const strategicPositioning = buildStrategicPositioning(rankedCity);
      const narrativeBrief = buildNarrativeBrief(rankedCity, strategicPositioning);
      const decisionEngine = buildDecisionEngineSummary({
        city: rankedCity,
        strategicBalance,
      });

      return {
        ...rankedCity,
        strategicPositioning,
        narrativeBrief,
        decisionEngine,
      };
    });

  return sortRankedCities(rankedCities);
};

export const buildTemporalOutlookRows = (indicatorKeys = TOP_TEMPORAL_INDICATORS) =>
  cities.map((city) => ({
    city: city.city,
    key: city.key,
    indicators: buildCityTemporalOutlook(city, indicatorKeys),
  }));

export const topRanking = [...cities].sort((left, right) => right.scores.weighted - left.scores.weighted);

export {
  auditStatusMeta,
  benchmarkSources,
  budgetComponentLabels,
  formatEuro,
  priorityPresets,
  scenarioMeta,
  scorePillars,
  scoreWeights,
  strategicBalanceMethodologyNote,
  strategicBalancePillars,
  strategicBalanceWeights,
  verificationWindow,
};