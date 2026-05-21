import { describe, expect, it } from 'vitest';
import { cities } from '../../relocationData.js';
import {
  applyShockToCityRow,
  applyShockToRows,
  createSimulationShock,
  shockToSimulationModifiers,
} from './eventShockEngine.js';

describe('event shock engine', () => {
  it('maps named shocks to simulation modifiers', () => {
    const shock = createSimulationShock({ type: 'railStrike', severity: 1.2 });
    const modifiers = shockToSimulationModifiers(shock);

    expect(modifiers.transportShift).toBeGreaterThan(0);
  });

  it('applies shocks to rows through budget modifier adapter', () => {
    const shock = createSimulationShock({ type: 'inflationWave', severity: 1 });
    const rankedSeed = {
      ...cities[0],
      scenarioBudget: cities[0].budgets.oneParent.midpoint,
    };

    const shocked = applyShockToCityRow(rankedSeed, shock, 'oneParent');
    expect(shocked._simulationApplied).toBe(true);

    const shockedRows = applyShockToRows([rankedSeed], shock, 'oneParent');
    expect(shockedRows).toHaveLength(1);
  });
});
