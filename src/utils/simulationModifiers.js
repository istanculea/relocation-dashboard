export const applySimulationModifiers = (cityRow, mods, scenarioKey = 'oneParent') => {
  const isActive = Object.values(mods ?? {}).some((value) => Number(value) !== 0);

  if (!isActive) {
    return cityRow;
  }

  const components = cityRow.budgetComponents?.[scenarioKey];

  if (!components) {
    return cityRow;
  }

  const componentMap = {
    groceryInflation: ['groceries', 'grocery', 'food'],
    rentShift: ['rent', 'housing'],
    childcareShift: ['childcare', 'nursery'],
    transportShift: ['transport', 'transit', 'mobility'],
    healthcareShift: ['healthcare', 'health', 'privateCover'],
  };

  const adjustedComponents = { ...components };

  for (const [modifierKey, componentKeys] of Object.entries(componentMap)) {
    const percentage = Number(mods[modifierKey] ?? 0);

    if (percentage === 0) {
      continue;
    }

    const multiplier = 1 + percentage / 100;

    for (const componentKey of componentKeys) {
      if (Number.isFinite(adjustedComponents[componentKey])) {
        adjustedComponents[componentKey] = Math.round(adjustedComponents[componentKey] * multiplier);
        break;
      }
    }
  }

  const newMidpoint = Object.values(adjustedComponents)
    .filter(Number.isFinite)
    .reduce((sum, value) => sum + value, 0);

  return {
    ...cityRow,
    budgetComponents: {
      ...cityRow.budgetComponents,
      [scenarioKey]: adjustedComponents,
    },
    budgets: {
      ...cityRow.budgets,
      [scenarioKey]: {
        ...cityRow.budgets?.[scenarioKey],
        midpoint: newMidpoint,
      },
    },
    scenarioBudget: newMidpoint,
    _simulationApplied: true,
  };
};
