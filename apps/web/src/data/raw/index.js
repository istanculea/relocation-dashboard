/**
 * src/data/raw/index.js
 *
 * Re-export shim for the "raw" data tier.
 *
 * Raw files contain ZERO computation logic — only static facts
 * (crime rates, PM2.5 readings, Euro amounts, housing prices).
 * Canonical import paths remain at the source files; this shim
 * provides a clean single-entry namespace for the raw tier.
 *
 * Migration path:
 *   Old: import { coreCities } from '../citiesCore.js';
 *   New: import { coreCities } from '../raw/index.js';
 *        or: import { coreCities } from './raw/citiesCore.js'; (after move)
 *
 * Current status: shim only — source files still live at src/data/*.
 * Move them here when the next expansion wave is authored.
 */
export { coreCities }    from '../citiesCore.js';
export { expandedCities } from '../citiesExpanded.js';
export { numbeoBenchmarks, cityBenchmarks } from '../numbeoBenchmarks.js';
export { secondaryBenchmarks } from '../secondaryBenchmarks.js';
