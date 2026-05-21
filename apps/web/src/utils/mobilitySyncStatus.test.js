import { describe, expect, it } from 'vitest';
import { buildMobilitySyncChips } from './mobilitySyncStatus.js';

describe('buildMobilitySyncChips', () => {
  it('builds concise sync chips from mobility state', () => {
    const chips = buildMobilitySyncChips({
      timeWindowHours: 3,
      layerVisibility: {
        air: true,
        railHighSpeed: false,
        railRegional: true,
        road: false,
        connections: true,
        heat: false,
        isochrones: true,
      },
    });

    expect(chips).toEqual([
      'Reach:3h',
      'Air:On',
      'Rail:On',
      'Road:Off',
      'Links:On',
      'Heat:Off',
      'Iso:On',
    ]);
  });
});