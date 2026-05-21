import { describe, expect, it } from 'vitest';
import { cityCatalog } from '../../data/cityCatalog.js';
import { buildSpatialHierarchy } from './spatialHierarchy.js';

describe('buildSpatialHierarchy', () => {
  it('builds deterministic continent/region/cluster/city structures', () => {
    const hierarchy = buildSpatialHierarchy(cityCatalog);

    expect(hierarchy.continent.id).toBe('europe');
    expect(hierarchy.regions.length).toBeGreaterThan(0);
    expect(hierarchy.clusters.length).toBeGreaterThan(0);
    expect(hierarchy.cityNodes).toHaveLength(cityCatalog.length);
  });
});
