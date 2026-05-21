import { describe, expect, it } from 'vitest';
import {
  createInitialMobilityState,
  MAX_COMPARE_CITIES,
  MOBILITY_ACTIONS,
  mobilityReducer,
} from './MobilityContext.jsx';

describe('MobilityContext reducer', () => {
  it('creates the default synchronized mobility state shape', () => {
    const state = createInitialMobilityState();

    expect(state.activeMap).toBe('strategicNetwork');
    expect(state.resilienceScenario).toBe('baseline');
    expect(state.timeWindowHours).toBe(6);
    expect(state.compareCityIds).toEqual([]);
  });

  it('applies selected city and map changes with guardrails', () => {
    const initial = createInitialMobilityState();
    const selected = mobilityReducer(initial, {
      type: MOBILITY_ACTIONS.SET_SELECTED_CITY,
      payload: 'vienna-at',
    });
    const changedMap = mobilityReducer(selected, {
      type: MOBILITY_ACTIONS.SET_ACTIVE_MAP,
      payload: 'reach',
    });
    const ignoredMap = mobilityReducer(changedMap, {
      type: MOBILITY_ACTIONS.SET_ACTIVE_MAP,
      payload: 'invalidMap',
    });

    expect(selected.selectedCityId).toBe('vienna-at');
    expect(changedMap.activeMap).toBe('reach');
    expect(ignoredMap.activeMap).toBe('reach');
  });

  it('caps compare set size and supports toggling membership', () => {
    let state = createInitialMobilityState();
    const ids = ['a', 'b', 'c', 'd', 'e'];

    ids.forEach((id) => {
      state = mobilityReducer(state, {
        type: MOBILITY_ACTIONS.TOGGLE_COMPARE_CITY,
        payload: id,
      });
    });

    expect(state.compareCityIds).toHaveLength(MAX_COMPARE_CITIES);

    state = mobilityReducer(state, {
      type: MOBILITY_ACTIONS.TOGGLE_COMPARE_CITY,
      payload: 'b',
    });

    expect(state.compareCityIds.includes('b')).toBe(false);
  });

  it('supports scenario and layer updates and reset behavior', () => {
    let state = createInitialMobilityState({ selectedCityId: 'vienna-at' });

    state = mobilityReducer(state, {
      type: MOBILITY_ACTIONS.SET_RESILIENCE_SCENARIO,
      payload: 'railStrike',
    });
    state = mobilityReducer(state, {
      type: MOBILITY_ACTIONS.SET_LAYER_VISIBILITY,
      payload: { key: 'road', value: true },
    });
    state = mobilityReducer(state, {
      type: MOBILITY_ACTIONS.SET_TIME_WINDOW_HOURS,
      payload: 3,
    });

    expect(state.resilienceScenario).toBe('railStrike');
    expect(state.layerVisibility.road).toBe(true);
    expect(state.timeWindowHours).toBe(3);

    const reset = mobilityReducer(state, { type: MOBILITY_ACTIONS.RESET_MOBILITY_STATE });
    expect(reset.selectedCityId).toBeNull();
    expect(reset.activeMap).toBe('strategicNetwork');
  });
});