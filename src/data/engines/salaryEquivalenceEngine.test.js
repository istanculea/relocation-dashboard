import { describe, expect, it } from 'vitest';
import { computeSalaryEquivalence } from './salaryEquivalenceEngine.js';

const sourceCity = {
  key: 'source',
  country: 'Spain',
  budgets: {
    oneParent: { midpoint: 2800 },
  },
};

const targetCity = {
  key: 'target',
  country: 'Germany',
  budgets: {
    oneParent: { midpoint: 3600 },
  },
};

describe('computeSalaryEquivalence', () => {
  it('returns target required net and gross preserving discretionary buffer', () => {
    const result = computeSalaryEquivalence({
      sourceCity,
      targetCity,
      scenarioKey: 'oneParent',
      sourceNetSpend: 3300,
    });

    expect(result).toBeTruthy();
    expect(result.discretionary).toBe(500);
    expect(result.requiredTargetNet).toBe(4100);
    expect(result.equivalentTargetGross).toBeGreaterThan(result.requiredTargetNet);
  });

  it('returns null for invalid spend input', () => {
    const result = computeSalaryEquivalence({
      sourceCity,
      targetCity,
      scenarioKey: 'oneParent',
      sourceNetSpend: 0,
    });

    expect(result).toBeNull();
  });
});
