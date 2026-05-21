import { describe, expect, it } from 'vitest';
import {
  buildMobilityDataset,
  validateCityNode,
  validateCorridor,
  validateReachProfile,
  validateResilienceProfile,
} from './schema.js';

describe('mobility schema', () => {
  it('validates a well-formed city node', () => {
    const result = validateCityNode({
      id: 'vienna-at',
      name: 'Vienna',
      countryCode: 'AT',
      lat: 48.2082,
      lon: 16.3738,
      nodeType: 'strategicConnector',
      modes: ['railHighSpeed', 'air'],
    });

    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects malformed corridors and profiles', () => {
    const corridorResult = validateCorridor({
      id: 'broken',
      fromCityId: 'a',
      toCityId: 'b',
      mode: 'ship',
      tier: 'unknown',
      travelMinutes: -10,
      redundancyScore: 2,
      reliabilityScore: -1,
    });
    const reachResult = validateReachProfile({
      cityId: 'a',
      population3h: 0,
      population6h: 1,
      economyReach3h: 1,
      economyReach6h: 1,
      averageTransferBurden: 9,
      railFirstCountryCodes: 'AT',
    });
    const resilienceResult = validateResilienceProfile({
      cityId: 'a',
      redundancy: 0.5,
      strikeExposure: 0.5,
      climateRisk: 0.5,
      networkFragility: 0.5,
      seasonalStability: 2,
    });

    expect(corridorResult.ok).toBe(false);
    expect(reachResult.ok).toBe(false);
    expect(resilienceResult.ok).toBe(false);
  });

  it('checks relational consistency in mobility dataset contracts', () => {
    const valid = buildMobilityDataset({
      cityNodes: [
        {
          id: 'vienna-at',
          name: 'Vienna',
          countryCode: 'AT',
          lat: 48.2,
          lon: 16.3,
          nodeType: 'strategicConnector',
          modes: ['railHighSpeed'],
        },
      ],
      corridors: [
        {
          id: 'self-loop',
          fromCityId: 'vienna-at',
          toCityId: 'vienna-at',
          mode: 'railHighSpeed',
          tier: 'primary',
          travelMinutes: 1,
          redundancyScore: 0.5,
          reliabilityScore: 0.7,
        },
      ],
      reachProfiles: [
        {
          cityId: 'vienna-at',
          population3h: 1,
          population6h: 2,
          economyReach3h: 1,
          economyReach6h: 2,
          averageTransferBurden: 1,
          railFirstCountryCodes: ['AT'],
        },
      ],
      resilienceProfiles: [
        {
          cityId: 'vienna-at',
          redundancy: 0.5,
          strikeExposure: 0.5,
          climateRisk: 0.5,
          networkFragility: 0.5,
          seasonalStability: 0.5,
        },
      ],
    });

    const invalid = buildMobilityDataset({
      cityNodes: [
        {
          id: 'vienna-at',
          name: 'Vienna',
          countryCode: 'AT',
          lat: 48.2,
          lon: 16.3,
          nodeType: 'strategicConnector',
          modes: ['railHighSpeed'],
        },
      ],
      corridors: [
        {
          id: 'missing-city',
          fromCityId: 'vienna-at',
          toCityId: 'nowhere',
          mode: 'railHighSpeed',
          tier: 'primary',
          travelMinutes: 1,
          redundancyScore: 0.5,
          reliabilityScore: 0.7,
        },
      ],
    });

    expect(valid.ok).toBe(true);
    expect(invalid.ok).toBe(false);
    expect(invalid.errors.some((error) => error.includes('unknown city ids'))).toBe(true);
  });
});