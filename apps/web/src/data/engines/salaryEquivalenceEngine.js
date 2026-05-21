import { DEFAULT_FINANCING_ASSUMPTIONS, computeNetSalary } from './financingEngine.js';

const MAX_GROSS_SEARCH = 50000;

const resolveBudgetMidpoint = (city, scenarioKey) => city?.budgets?.[scenarioKey]?.midpoint ?? null;

const solveGrossForNet = (targetNet, country, assumptions = DEFAULT_FINANCING_ASSUMPTIONS) => {
  if (!Number.isFinite(targetNet) || targetNet <= 0) {
    return 0;
  }

  let low = Math.max(0, targetNet);
  let high = Math.max(1000, targetNet * 2.5);

  while (computeNetSalary(high, country, assumptions) < targetNet && high < MAX_GROSS_SEARCH) {
    high *= 1.35;
  }

  high = Math.min(high, MAX_GROSS_SEARCH);

  for (let index = 0; index < 32; index += 1) {
    const mid = (low + high) / 2;
    const net = computeNetSalary(mid, country, assumptions);

    if (net >= targetNet) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return Math.round(high);
};

export const computeSalaryEquivalence = ({
  sourceCity,
  targetCity,
  scenarioKey = 'oneParent',
  sourceNetSpend,
  assumptions = DEFAULT_FINANCING_ASSUMPTIONS,
}) => {
  const sourceBudget = resolveBudgetMidpoint(sourceCity, scenarioKey);
  const targetBudget = resolveBudgetMidpoint(targetCity, scenarioKey);

  if (!Number.isFinite(sourceBudget) || !Number.isFinite(targetBudget)) {
    return null;
  }

  const normalizedSpend = Number(sourceNetSpend);
  if (!Number.isFinite(normalizedSpend) || normalizedSpend <= 0) {
    return null;
  }

  const discretionary = normalizedSpend - sourceBudget;
  const requiredTargetNet = Math.max(0, Math.round(targetBudget + discretionary));
  const equivalentTargetGross = solveGrossForNet(requiredTargetNet, targetCity?.country ?? '', assumptions);
  const deltaAbsolute = requiredTargetNet - normalizedSpend;
  const deltaPercent = normalizedSpend > 0 ? (deltaAbsolute / normalizedSpend) * 100 : 0;

  return {
    scenarioKey,
    sourceCityKey: sourceCity?.key ?? null,
    targetCityKey: targetCity?.key ?? null,
    sourceBudget,
    targetBudget,
    sourceNetSpend: normalizedSpend,
    discretionary,
    requiredTargetNet,
    equivalentTargetGross,
    deltaAbsolute,
    deltaPercent,
    assumptions,
  };
};
