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
import { cityBudgetModels } from './data/cityBudgetModels';
import { cityComparisonMeta } from './data/cityComparisonMeta';
import { benchmarkSources } from './data/benchmarkSources.js';
import { mcdaPayloads } from './data/mcdaPayloads.js';
import { officialChildcareTariffs } from './data/officialChildcareTariffs.js';
import verifiedSnapshotCompact from './data/verifiedSnapshotCompact.json';
import { coreCities } from './data/citiesCore';
import { expandedCities } from './data/citiesExpanded';
import { computeClassicScore } from './data/engines/scoringFormulas.js';

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

export const cities = [...coreCities, ...expandedCities].map((city) => {
  const audit = enrichAudit(cityAuditMetaSummary[city.key]);
  const budgetComponents = cityBudgetModels[city.key];
  const city360 = city360SummaryMeta[city.key];
  const officialChildcareTariff = officialChildcareTariffs[city.key] ?? null;

  const enrichedCity = {
    ...city,
    audit,
    budgetComponents,
    city360,
    comparison: cityComparisonMeta[city.key],
    hasOfficialChildcareTariff: Boolean(officialChildcareTariff),
    maxAqi: getCityMaxAqi(city, city360),
    officialChildcareTariff,
    budgets: {
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
    },
  };

  return {
    ...enrichedCity,
    strategicBalance: buildStrategicBalanceMatrix(enrichedCity),
    // Recompute 5-pillar classic scores dynamically from raw facts.
    // computeClassicScore falls back to the pre-authored scores.* values
    // when they exist, so this is backward-compatible with all city files.
    scores: computeClassicScore(enrichedCity),
  };
});

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
  cities.map((city) => {
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
    };
  });

export const calculateWeightedScore = (scores, weights) =>
  scorePillars.reduce((total, [key]) => total + scores[key] * weights[key], 0);

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

  return [...cities]
    .map((city) => {
      const strategicBalance = buildStrategicBalanceMatrix(city, balanceProfileType);
      const pillarWeights = effectivePillarWeights ?? preset.pillarWeights;

      return {
        ...city,
        strategicBalance,
        activeWeightedScore:
          preset.scoreType === 'strategicBalance'
            ? strategicBalance.weightedScore
            : preset.scoreType === 'strategicPillar'
              ? Math.max(1, Math.min(10, strategicBalance.pillars.reduce(
                  (total, pillar) => total + pillar.score * (pillarWeights[pillar.key] ?? 0),
                  0,
                )))
              : calculateWeightedScore(city.scores, preset.weights),
      };
    })
    .sort((left, right) => right.activeWeightedScore - left.activeWeightedScore);
};

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