import { describe, expect, it } from 'vitest';
import { evaluateWatchlistAlerts } from './watchlistAlerts.js';

describe('watchlistAlerts', () => {
  it('returns warnings for poor budget/air conditions', () => {
    const alerts = evaluateWatchlistAlerts({
      scenarioKey: 'oneParent',
      city: {
        activeWeightedScore: 7,
        mobility: { pm25: 19 },
        budgets: { oneParent: { midpoint: 2900 } },
      },
    });

    expect(alerts.some((item) => item.label.includes('Budget is above target'))).toBe(true);
    expect(alerts.some((item) => item.label.includes('Air quality is elevated'))).toBe(true);
  });

  it('returns ok status when all thresholds are healthy', () => {
    const alerts = evaluateWatchlistAlerts({
      scenarioKey: 'oneParent',
      city: {
        activeWeightedScore: 8.2,
        mobility: { pm25: 7 },
        budgets: { oneParent: { midpoint: 2100 } },
      },
    });

    expect(alerts).toEqual([{ severity: 'ok', label: 'No active watchlist alerts.' }]);
  });
});
