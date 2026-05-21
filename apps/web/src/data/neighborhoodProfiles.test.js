import { describe, expect, it } from 'vitest';
import { getNeighborhoodProfiles } from './neighborhoodProfiles.js';

describe('neighborhoodProfiles', () => {
  it('returns sorted neighborhood profiles for a known city', () => {
    const rows = getNeighborhoodProfiles('vienna');

    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].familyFit).toBeGreaterThanOrEqual(rows[1].familyFit);
  });

  it('returns an empty list for unknown city keys', () => {
    expect(getNeighborhoodProfiles('unknown-city')).toEqual([]);
  });
});
