import { createContext, useCallback, useContext, useMemo, useReducer } from 'react';
import { MOBILITY_MAPS, RESILIENCE_SCENARIOS } from '../data/mobility/schema.js';

export const MAX_COMPARE_CITIES = 4;

export const MOBILITY_ACTIONS = /** @type {const} */ ({
  SET_SELECTED_CITY: 'SET_SELECTED_CITY',
  SET_ACTIVE_MAP: 'SET_ACTIVE_MAP',
  SET_RESILIENCE_SCENARIO: 'SET_RESILIENCE_SCENARIO',
  SET_TIME_WINDOW_HOURS: 'SET_TIME_WINDOW_HOURS',
  TOGGLE_COMPARE_CITY: 'TOGGLE_COMPARE_CITY',
  CLEAR_COMPARE_CITIES: 'CLEAR_COMPARE_CITIES',
  SET_LAYER_VISIBILITY: 'SET_LAYER_VISIBILITY',
  RESET_MOBILITY_STATE: 'RESET_MOBILITY_STATE',
});

export const DEFAULT_LAYER_VISIBILITY = {
  railHighSpeed: true,
  railRegional: true,
  air: true,
  road: false,
  redundancy: true,
  labels: true,
  connections: true,
  heat: true,
  isochrones: true,
};

export const createInitialMobilityState = (initialState = {}) => ({
  selectedCityId: null,
  activeMap: 'strategicNetwork',
  resilienceScenario: 'baseline',
  timeWindowHours: 6,
  compareCityIds: [],
  layerVisibility: { ...DEFAULT_LAYER_VISIBILITY },
  ...initialState,
});

const hasValue = (value) => value !== null && value !== undefined;
const ALLOWED_TIME_WINDOW_HOURS = [1, 3, 6];

const setSelectedCity = (state, action) => ({
  ...state,
  selectedCityId: action.payload ?? null,
});

const setActiveMap = (state, action) => {
  if (!MOBILITY_MAPS.includes(action.payload)) {
    return state;
  }
  return { ...state, activeMap: action.payload };
};

const setResilienceScenario = (state, action) => {
  if (!RESILIENCE_SCENARIOS.includes(action.payload)) {
    return state;
  }
  return { ...state, resilienceScenario: action.payload };
};

const setTimeWindowHours = (state, action) => {
  if (!ALLOWED_TIME_WINDOW_HOURS.includes(action.payload)) {
    return state;
  }
  return { ...state, timeWindowHours: action.payload };
};

const toggleCompareCity = (state, action) => {
  const cityId = action.payload;
  if (!hasValue(cityId) || typeof cityId !== 'string') {
    return state;
  }

  if (state.compareCityIds.includes(cityId)) {
    return {
      ...state,
      compareCityIds: state.compareCityIds.filter((id) => id !== cityId),
    };
  }

  if (state.compareCityIds.length >= MAX_COMPARE_CITIES) {
    return state;
  }

  return {
    ...state,
    compareCityIds: [...state.compareCityIds, cityId],
  };
};

const clearCompareCities = (state) => ({ ...state, compareCityIds: [] });

const setLayerVisibility = (state, action) => {
  if (!action.payload || typeof action.payload.key !== 'string') {
    return state;
  }
  return {
    ...state,
    layerVisibility: {
      ...state.layerVisibility,
      [action.payload.key]: Boolean(action.payload.value),
    },
  };
};

const mobilityActionHandlers = {
  [MOBILITY_ACTIONS.SET_SELECTED_CITY]: setSelectedCity,
  [MOBILITY_ACTIONS.SET_ACTIVE_MAP]: setActiveMap,
  [MOBILITY_ACTIONS.SET_RESILIENCE_SCENARIO]: setResilienceScenario,
  [MOBILITY_ACTIONS.SET_TIME_WINDOW_HOURS]: setTimeWindowHours,
  [MOBILITY_ACTIONS.TOGGLE_COMPARE_CITY]: toggleCompareCity,
  [MOBILITY_ACTIONS.CLEAR_COMPARE_CITIES]: clearCompareCities,
  [MOBILITY_ACTIONS.SET_LAYER_VISIBILITY]: setLayerVisibility,
  [MOBILITY_ACTIONS.RESET_MOBILITY_STATE]: () => createInitialMobilityState(),
};

export const mobilityReducer = (state, action) => {
  const handler = mobilityActionHandlers[action?.type];
  return handler ? handler(state, action) : state;
};

const MobilityStateContext = createContext(null);
const MobilityDispatchContext = createContext(null);

export const MobilityProvider = ({ initialState = {}, children }) => {
  const [state, dispatch] = useReducer(
    mobilityReducer,
    createInitialMobilityState(initialState),
  );

  const stableState = useMemo(() => state, [state]);
  const stableDispatch = useCallback(dispatch, []);

  return (
    <MobilityStateContext.Provider value={stableState}>
      <MobilityDispatchContext.Provider value={stableDispatch}>
        {children}
      </MobilityDispatchContext.Provider>
    </MobilityStateContext.Provider>
  );
};

export const useMobilityState = () => {
  const ctx = useContext(MobilityStateContext);
  if (ctx === null) {
    throw new Error('useMobilityState must be used inside <MobilityProvider>');
  }
  return ctx;
};

export const useMobilityDispatch = () => {
  const ctx = useContext(MobilityDispatchContext);
  if (ctx === null) {
    throw new Error('useMobilityDispatch must be used inside <MobilityProvider>');
  }
  return ctx;
};

export const useMobility = () => ({
  state: useMobilityState(),
  dispatch: useMobilityDispatch(),
});
