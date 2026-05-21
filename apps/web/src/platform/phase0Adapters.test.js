import { describe, expect, it } from 'vitest';

import * as legacyMobilitySchema from '../data/mobility/schema.js';
import * as graphContracts from './graph/contracts.js';

import * as legacyMapUtils from '../components/cityMapPageUtils.js';
import * as mapHeuristics from './maps/transportHeuristics.js';

import { applySimulationModifiers as legacyApplySimulationModifiers } from '../utils/simulationModifiers.js';
import { applySimulationModifiers as boundaryApplySimulationModifiers } from './simulation/budgetShockAdapters.js';

import { exportCsvSnapshot as legacyExportCsvSnapshot } from '../app/exportActions.js';
import { exportCsvSnapshot as boundaryExportCsvSnapshot } from './exports/exportActions.js';

import { ACTIONS as legacyDashboardActions } from '../context/DashboardContext.jsx';
import { ACTIONS as boundaryDashboardActions } from '../application/compare/dashboardState.jsx';

import { MOBILITY_ACTIONS as legacyMobilityActions } from '../context/MobilityContext.jsx';
import { MOBILITY_ACTIONS as boundaryMobilityActions } from '../application/atlas/mobilityState.jsx';

describe('Phase 0 compatibility adapters', () => {
  it('re-exports mobility schema contracts from the graph boundary', () => {
    expect(graphContracts.MOBILITY_MAPS).toEqual(legacyMobilitySchema.MOBILITY_MAPS);
    expect(graphContracts.validateCityNode).toBe(legacyMobilitySchema.validateCityNode);
  });

  it('re-exports map utilities from the maps boundary', () => {
    expect(mapHeuristics.clampValue).toBe(legacyMapUtils.clampValue);
    expect(mapHeuristics.buildCityNetworkConnections).toBe(legacyMapUtils.buildCityNetworkConnections);
  });

  it('re-exports simulation modifiers from the simulation boundary', () => {
    expect(boundaryApplySimulationModifiers).toBe(legacyApplySimulationModifiers);
  });

  it('re-exports export actions from the exports boundary', () => {
    expect(boundaryExportCsvSnapshot).toBe(legacyExportCsvSnapshot);
  });

  it('re-exports dashboard actions through compare application boundary', () => {
    expect(boundaryDashboardActions).toEqual(legacyDashboardActions);
  });

  it('re-exports mobility actions through atlas application boundary', () => {
    expect(boundaryMobilityActions).toEqual(legacyMobilityActions);
  });
});
