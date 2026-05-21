/**
 * DashboardContext.jsx — src/context/
 *
 * Lightweight global state provider for the Relocation Dashboard.
 *
 * DESIGN GOALS
 * ────────────
 * 1. Eliminate prop-drilling for lensKey, scenarioKey, selectedCityKey,
 *    selectedYear, shortlistedCityKeys, and simulationModifiers.
 * 2. Split state and dispatch into two separate contexts so that components
 *    that only dispatch (e.g., sliders, buttons) never re-render when
 *    unrelated state values change.
 * 3. Keep all heavy data derivations (buildRanking, filteredComparisonRows)
 *    in App.jsx — this context owns only volatile UI state, not city data.
 *
 * USAGE
 * ─────
 *   // Wrap your app
 *   <DashboardProvider initialState={...}>
 *     <App />
 *   </DashboardProvider>
 *
 *   // Read state
 *   const { lensKey, simulationModifiers } = useDashboardState();
 *
 *   // Dispatch
 *   const dispatch = useDashboardDispatch();
 *   dispatch({ type: 'SET_LENS', payload: 'budgetFirst' });
 *
 * SHORTLIST CAP: shortlistedCityKeys is capped at MAX_SHORTLIST_SIZE (3).
 * Attempting to add a 4th city is silently ignored.
 */

import { createContext, useContext, useReducer, useMemo, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_SHORTLIST_SIZE = 3;

// ---------------------------------------------------------------------------
// Action types
// ---------------------------------------------------------------------------

export const ACTIONS = /** @type {const} */ ({
  SET_LENS:               'SET_LENS',
  SET_SCENARIO:           'SET_SCENARIO',
  SET_SELECTED_CITY:      'SET_SELECTED_CITY',
  SET_YEAR:               'SET_YEAR',
  ADD_TO_SHORTLIST:       'ADD_TO_SHORTLIST',
  REMOVE_FROM_SHORTLIST:  'REMOVE_FROM_SHORTLIST',
  CLEAR_SHORTLIST:        'CLEAR_SHORTLIST',
  SET_SIMULATION_MOD:     'SET_SIMULATION_MOD',
  RESET_SIMULATION:       'RESET_SIMULATION',
});

// ---------------------------------------------------------------------------
// Default simulation modifier shape
// ---------------------------------------------------------------------------

export const DEFAULT_SIMULATION_MODIFIERS = {
  groceryInflation:   0,   // percentage delta, e.g. +10 means +10%
  rentShift:          0,   // percentage delta, e.g. -5 means −5%
  childcareShift:     0,   // percentage delta
  transportShift:     0,   // percentage delta
  healthcareShift:    0,   // percentage delta
};

const dashboardActionHandlers = {
  [ACTIONS.SET_LENS]: (state, action) => ({ ...state, lensKey: action.payload }),
  [ACTIONS.SET_SCENARIO]: (state, action) => ({ ...state, scenarioKey: action.payload }),
  [ACTIONS.SET_SELECTED_CITY]: (state, action) => ({ ...state, selectedCityKey: action.payload }),
  [ACTIONS.SET_YEAR]: (state, action) => ({ ...state, selectedYear: action.payload }),
  [ACTIONS.ADD_TO_SHORTLIST]: (state, action) => {
    const key = action.payload;
    if (
      state.shortlistedCityKeys.includes(key)
      || state.shortlistedCityKeys.length >= MAX_SHORTLIST_SIZE
    ) {
      return state;
    }

    return { ...state, shortlistedCityKeys: [...state.shortlistedCityKeys, key] };
  },
  [ACTIONS.REMOVE_FROM_SHORTLIST]: (state, action) => ({
    ...state,
    shortlistedCityKeys: state.shortlistedCityKeys.filter((key) => key !== action.payload),
  }),
  [ACTIONS.CLEAR_SHORTLIST]: (state) => ({ ...state, shortlistedCityKeys: [] }),
  [ACTIONS.SET_SIMULATION_MOD]: (state, action) => ({
    ...state,
    simulationModifiers: {
      ...state.simulationModifiers,
      [action.payload.key]: action.payload.value,
    },
  }),
  [ACTIONS.RESET_SIMULATION]: (state) => ({
    ...state,
    simulationModifiers: { ...DEFAULT_SIMULATION_MODIFIERS },
  }),
};

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

const dashboardReducer = (state, action) => {
  const handler = dashboardActionHandlers[action.type];

  return handler ? handler(state, action) : state;
};

// ---------------------------------------------------------------------------
// Context objects (state and dispatch are separate to prevent unnecessary renders)
// ---------------------------------------------------------------------------

const DashboardStateContext  = createContext(null);
const DashboardDispatchContext = createContext(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * @param {{
 *   initialState?: Partial<{
 *     lensKey: string,
 *     scenarioKey: string,
 *     selectedCityKey: string | null,
 *     selectedYear: number,
 *     shortlistedCityKeys: string[],
 *     simulationModifiers: typeof DEFAULT_SIMULATION_MODIFIERS,
 *   }>,
 *   children: React.ReactNode
 * }} props
 */
export const DashboardProvider = ({ initialState = {}, children }) => {
  const defaultState = {
    lensKey:              'balanced',
    scenarioKey:          'oneParent',
    selectedCityKey:      null,
    selectedYear:         2026,
    shortlistedCityKeys:  [],
    simulationModifiers:  { ...DEFAULT_SIMULATION_MODIFIERS },
    ...initialState,
  };

  const [state, dispatch] = useReducer(dashboardReducer, defaultState);

  // Memoize state to keep referential stability — heavy table consumers only
  // re-render when a value they actually use changes.
  const stableState = useMemo(() => state, [state]);

  // Memoize dispatch so child components that only dispatch never re-render
  // due to context identity changes.
  const stableDispatch = useCallback(dispatch, []);

  return (
    <DashboardStateContext.Provider value={stableState}>
      <DashboardDispatchContext.Provider value={stableDispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardStateContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * useDashboardState()
 * Returns the full state object. Components re-render only when state changes.
 */
export const useDashboardState = () => {
  const ctx = useContext(DashboardStateContext);
  if (ctx === null) {
    throw new Error('useDashboardState must be used inside <DashboardProvider>');
  }
  return ctx;
};

/**
 * useDashboardDispatch()
 * Returns the stable dispatch function. Components that only dispatch
 * never re-render because dispatch identity never changes.
 */
export const useDashboardDispatch = () => {
  const ctx = useContext(DashboardDispatchContext);
  if (ctx === null) {
    throw new Error('useDashboardDispatch must be used inside <DashboardProvider>');
  }
  return ctx;
};

/**
 * useDashboard()
 * Convenience hook that returns both state and dispatch.
 * Prefer useDashboardState / useDashboardDispatch when you only need one.
 */
export const useDashboard = () => ({
  state:    useDashboardState(),
  dispatch: useDashboardDispatch(),
});

// ---------------------------------------------------------------------------
// Shortlist convenience helpers (wrappers around dispatch)
// ---------------------------------------------------------------------------

/**
 * useShortlist()
 * Returns { shortlistedCityKeys, toggle, clear, isFull }
 */
export const useShortlist = () => {
  const { shortlistedCityKeys } = useDashboardState();
  const dispatch = useDashboardDispatch();

  const toggle = useCallback(
    (cityKey) => {
      if (shortlistedCityKeys.includes(cityKey)) {
        dispatch({ type: ACTIONS.REMOVE_FROM_SHORTLIST, payload: cityKey });
      } else {
        dispatch({ type: ACTIONS.ADD_TO_SHORTLIST, payload: cityKey });
      }
    },
    [shortlistedCityKeys, dispatch],
  );

  const clear = useCallback(() => dispatch({ type: ACTIONS.CLEAR_SHORTLIST }), [dispatch]);

  return {
    shortlistedCityKeys,
    toggle,
    clear,
    isFull: shortlistedCityKeys.length >= MAX_SHORTLIST_SIZE,
    count:  shortlistedCityKeys.length,
  };
};

/**
 * useSimulation()
 * Returns { simulationModifiers, setMod, reset }
 */
export const useSimulation = () => {
  const { simulationModifiers } = useDashboardState();
  const dispatch = useDashboardDispatch();

  const setMod = useCallback(
    (key, value) => dispatch({ type: ACTIONS.SET_SIMULATION_MOD, payload: { key, value } }),
    [dispatch],
  );

  const reset = useCallback(() => dispatch({ type: ACTIONS.RESET_SIMULATION }), [dispatch]);

  return { simulationModifiers, setMod, reset };
};
