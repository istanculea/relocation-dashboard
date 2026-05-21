import { buildMobilityDataset } from './schema.js';

export const pilotCityNodes = [
  {
    id: 'vienna-at',
    name: 'Vienna',
    countryCode: 'AT',
    lat: 48.2082,
    lon: 16.3738,
    nodeType: 'strategicConnector',
    modes: ['railHighSpeed', 'railRegional', 'air'],
  },
  {
    id: 'munich-de',
    name: 'Munich',
    countryCode: 'DE',
    lat: 48.1351,
    lon: 11.582,
    nodeType: 'continentalHub',
    modes: ['railHighSpeed', 'railRegional', 'air', 'road'],
  },
  {
    id: 'milan-it',
    name: 'Milan',
    countryCode: 'IT',
    lat: 45.4642,
    lon: 9.19,
    nodeType: 'railSpineNode',
    modes: ['railHighSpeed', 'railRegional', 'air'],
  },
  {
    id: 'zurich-ch',
    name: 'Zurich',
    countryCode: 'CH',
    lat: 47.3769,
    lon: 8.5417,
    nodeType: 'regionalGateway',
    modes: ['railHighSpeed', 'railRegional', 'air'],
  },
  {
    id: 'prague-cz',
    name: 'Prague',
    countryCode: 'CZ',
    lat: 50.0755,
    lon: 14.4378,
    nodeType: 'peripheralStabilizer',
    modes: ['railRegional', 'air', 'road'],
  },
];

export const pilotCorridors = [
  {
    id: 'vienna-munich-hsr',
    fromCityId: 'vienna-at',
    toCityId: 'munich-de',
    mode: 'railHighSpeed',
    tier: 'primary',
    travelMinutes: 240,
    redundancyScore: 0.68,
    reliabilityScore: 0.84,
  },
  {
    id: 'munich-milan-air',
    fromCityId: 'munich-de',
    toCityId: 'milan-it',
    mode: 'air',
    tier: 'secondary',
    travelMinutes: 95,
    redundancyScore: 0.51,
    reliabilityScore: 0.73,
  },
  {
    id: 'milan-zurich-rail',
    fromCityId: 'milan-it',
    toCityId: 'zurich-ch',
    mode: 'railRegional',
    tier: 'secondary',
    travelMinutes: 205,
    redundancyScore: 0.58,
    reliabilityScore: 0.81,
  },
  {
    id: 'vienna-prague-road',
    fromCityId: 'vienna-at',
    toCityId: 'prague-cz',
    mode: 'road',
    tier: 'fallback',
    travelMinutes: 210,
    redundancyScore: 0.46,
    reliabilityScore: 0.76,
  },
];

export const pilotReachProfiles = [
  {
    cityId: 'vienna-at',
    population3h: 18_200_000,
    population6h: 41_700_000,
    economyReach3h: 1_420_000_000_000,
    economyReach6h: 3_100_000_000_000,
    averageTransferBurden: 1.3,
    railFirstCountryCodes: ['AT', 'DE', 'CZ', 'HU', 'SK', 'CH', 'IT'],
  },
  {
    cityId: 'munich-de',
    population3h: 20_600_000,
    population6h: 49_300_000,
    economyReach3h: 1_680_000_000_000,
    economyReach6h: 3_880_000_000_000,
    averageTransferBurden: 1.2,
    railFirstCountryCodes: ['DE', 'AT', 'CH', 'CZ', 'IT', 'FR'],
  },
];

export const pilotResilienceProfiles = [
  {
    cityId: 'vienna-at',
    redundancy: 0.76,
    strikeExposure: 0.37,
    climateRisk: 0.29,
    networkFragility: 0.33,
    seasonalStability: 0.82,
  },
  {
    cityId: 'munich-de',
    redundancy: 0.72,
    strikeExposure: 0.32,
    climateRisk: 0.31,
    networkFragility: 0.35,
    seasonalStability: 0.79,
  },
];

export const mobilityPilotDataset = buildMobilityDataset({
  cityNodes: pilotCityNodes,
  corridors: pilotCorridors,
  reachProfiles: pilotReachProfiles,
  resilienceProfiles: pilotResilienceProfiles,
});