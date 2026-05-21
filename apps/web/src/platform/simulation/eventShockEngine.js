import { applySimulationModifiers } from './budgetShockAdapters.js';

const toNumber = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

export const SHOCK_LIBRARY = {
  inflationWave: {
    groceryInflation: 10,
    rentShift: 4,
    transportShift: 3,
  },
  fuelShock: {
    transportShift: 12,
    groceryInflation: 5,
  },
  railStrike: {
    transportShift: 14,
  },
  drought: {
    groceryInflation: 6,
  },
  heatwave: {
    healthcareShift: 8,
    groceryInflation: 2,
  },
  recession: {
    rentShift: -3,
    groceryInflation: 4,
  },
  airportClosure: {
    transportShift: 7,
  },
  healthcareOverload: {
    healthcareShift: 12,
  },
};

export const createSimulationShock = ({
  id,
  type,
  severity = 1,
  startDate = new Date().toISOString().slice(0, 10),
  durationDays = 30,
  targetScope = 'continent',
  targetIds = [],
}) => ({
  id: id ?? `${type}-${startDate}`,
  type,
  severity: toNumber(severity, 1),
  startDate,
  durationDays: toNumber(durationDays, 30),
  targetScope,
  targetIds,
});

export const shockToSimulationModifiers = (shock) => {
  const profile = SHOCK_LIBRARY[shock.type] ?? {};
  const severity = Math.max(0, toNumber(shock.severity, 1));

  return Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [key, Number((value * severity).toFixed(2))]),
  );
};

export const applyShockToCityRow = (cityRow, shock, scenarioKey = 'oneParent') => {
  const modifiers = shockToSimulationModifiers(shock);
  return applySimulationModifiers(cityRow, modifiers, scenarioKey);
};

export const applyShockToRows = (rows, shock, scenarioKey = 'oneParent') =>
  rows.map((row) => applyShockToCityRow(row, shock, scenarioKey));
