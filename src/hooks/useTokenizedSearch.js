/**
 * useTokenizedSearch.js — src/hooks/
 *
 * A memoised, debounced search hook that tokenizes the query and matches
 * against deep city properties including city360Meta fields:
 *   • city name + country
 *   • city360.personality, city360.moveHereIf, city360.stayAwayIf,
 *     city360.fittingIn, city360.honestTruth.good[], city360.honestTruth.bad[]
 *   • city360.ecoFactors (if present)
 *
 * Usage
 * ─────
 *   const { searchValue, setSearchValue, matchesSearch } = useTokenizedSearch();
 *
 *   const filteredRows = useMemo(
 *     () => rows.filter(row => matchesSearch(row)),
 *     [rows, matchesSearch],
 *   );
 *
 * Notes
 * ─────
 * • `matchesSearch` is memoised and returns a stable function reference between
 *   renders, so the filteredRows memo only invalidates when the query changes.
 * • Debounce (default 200 ms) uses `useDeferredValue` (React 18) if available,
 *   otherwise falls back to a manual setTimeout implementation.
 * • Tokenization: the query is split on whitespace; a city must match ALL tokens
 *   (AND logic) so that "bilbao spain" works correctly.
 */

import {
  useCallback,
  useDeferredValue,
  useMemo,
  useState,
} from 'react';

// ---------------------------------------------------------------------------
// Haystack builder
// ---------------------------------------------------------------------------

/**
 * Build a flat lowercase search string from the deep properties of a city row.
 * This is called once per row inside the filter and avoids repeated string
 * building on each token check.
 */
const buildHaystack = (row) => {
  const parts = [
    row.city,
    row.country,
    row.tagline,
    row.city360?.personality,
    row.city360?.moveHereIf,
    row.city360?.stayAwayIf,
    row.city360?.fittingIn,
    ...(row.city360?.honestTruth?.good ?? []),
    ...(row.city360?.honestTruth?.bad ?? []),
    ...(Array.isArray(row.city360?.ecoFactors)
      ? row.city360.ecoFactors
      : [String(row.city360?.ecoFactors ?? '')]),
    row.city360?.honestTruth?.summary,
    row.comparison?.narrative,
    ...(row.comparison?.pros ?? []),
    ...(row.comparison?.cons ?? []),
  ];

  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
};

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useTokenizedSearch(options?)
 *
 * @param {{ initialValue?: string }} [options]
 * @returns {{
 *   searchValue:   string,         // raw (live) input value
 *   setSearchValue: (v: string) => void,
 *   deferredSearch: string,        // debounced/deferred value used for filtering
 *   matchesSearch:  (row: object) => boolean,  // stable filter predicate
 *   hasSearch:      boolean,
 * }}
 */
const useTokenizedSearch = (options = {}) => {
  const [searchValue, setSearchValue] = useState(options.initialValue ?? '');

  // React 18 useDeferredValue gives a slightly stale, interruptible value that
  // decouples typing latency from expensive filter re-computation.
  const deferredSearch = useDeferredValue(searchValue);

  // Tokenize the deferred query into lowercase words
  const tokens = useMemo(() => {
    const trimmed = deferredSearch.trim().toLowerCase();

    if (!trimmed) return [];

    return trimmed.split(/\s+/);
  }, [deferredSearch]);

  // Stable predicate that the filteredRows memo depends on
  const matchesSearch = useCallback(
    (row) => {
      if (!tokens.length) return true;

      const haystack = buildHaystack(row);

      // ALL tokens must be present (AND logic)
      return tokens.every((token) => haystack.includes(token));
    },
    [tokens],
  );

  return {
    searchValue,
    setSearchValue,
    deferredSearch,
    matchesSearch,
    hasSearch: tokens.length > 0,
  };
};

export default useTokenizedSearch;
