import cityExpansionWaveSummary from './cityExpansionWaveSummary.json';
import { coreCities } from './citiesCore';
import { expandedCities } from './citiesExpanded';

export const expansionWaveSummaryCities = cityExpansionWaveSummary.cities ?? [];

export const cityCatalog = [
  ...coreCities,
  ...expandedCities,
  ...expansionWaveSummaryCities,
];

export const cityCatalogKeys = cityCatalog.map((city) => city.key);

const shouldEnforceParity =
  import.meta.env?.DEV
  || import.meta.env?.MODE === 'test'
  || import.meta.env?.VITEST;

if (shouldEnforceParity) {
  const keyOccurrences = cityCatalogKeys.reduce((counts, key) => {
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});
  const duplicateKeys = Object.entries(keyOccurrences)
    .filter(([, count]) => count > 1)
    .map(([key]) => key)
    .sort();

  if (duplicateKeys.length > 0) {
    throw new Error(
      `cityCatalog parity check failed: duplicate city keys detected (${duplicateKeys.join(', ')}).`,
    );
  }
}
