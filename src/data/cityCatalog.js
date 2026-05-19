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
