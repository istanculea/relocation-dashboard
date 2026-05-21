import { describe, expect, it } from 'vitest';
import { buildMobilityShareState, readMobilityShareState } from './mobilityShareState.js';

describe('mobilityShareState', () => {
  it('serializes mobility state into compact share payload keys', () => {
    const share = buildMobilityShareState({
      timeWindowHours: 3,
      layerVisibility: {
        air: true,
        railHighSpeed: true,
        railRegional: false,
        road: false,
        connections: true,
        heat: false,
        isochrones: true,
        unknownLayer: true,
      },
    });

    expect(share).toEqual({
      mWindow: 3,
      mLayers: {
        railHighSpeed: true,
        railRegional: false,
        air: true,
        road: false,
        connections: true,
        heat: false,
        isochrones: true,
      },
    });
  });

  it('hydrates mobility state from share payload safely', () => {
    const hydrated = readMobilityShareState({
      mWindow: 1,
      mLayers: {
        air: false,
        railRegional: true,
        labels: true,
        invalid: true,
      },
    });

    expect(hydrated).toEqual({
      timeWindowHours: 1,
      layerVisibility: {
        railRegional: true,
        air: false,
        labels: true,
      },
    });
  });
});
