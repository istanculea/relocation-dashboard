const DEFAULT_BUDGET_TARGETS = {
  oneParent: 2400,
  bothWorking: 3200,
  twoKids: 3600,
  oneIncTwoKids: 3000,
};

export const evaluateWatchlistAlerts = ({ city, scenarioKey, budgetTarget = null }) => {
  if (!city) {
    return [];
  }

  const alerts = [];
  const activeBudgetTarget = budgetTarget ?? DEFAULT_BUDGET_TARGETS[scenarioKey] ?? 2600;
  const scenarioBudget = city.budgets?.[scenarioKey]?.midpoint;
  const pm25 = city.mobility?.pm25;
  const score = city.activeWeightedScore;

  if (Number.isFinite(scenarioBudget) && scenarioBudget > activeBudgetTarget) {
    alerts.push({
      severity: 'warning',
      label: `Budget is above target by €${Math.round(scenarioBudget - activeBudgetTarget)}`,
    });
  }

  if (Number.isFinite(pm25) && pm25 > 15) {
    alerts.push({
      severity: 'warning',
      label: `Air quality is elevated at PM2.5 ${pm25}`,
    });
  }

  if (Number.isFinite(score) && score < 6.5) {
    alerts.push({
      severity: 'critical',
      label: `Overall score dropped to ${score.toFixed(2)}`,
    });
  }

  if (alerts.length === 0) {
    alerts.push({
      severity: 'ok',
      label: 'No active watchlist alerts.',
    });
  }

  return alerts;
};
