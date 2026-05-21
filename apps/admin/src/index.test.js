import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { addOverride, listOverrides } from './overrides/overrideStore.js';
import { listPendingReviewQueue } from './reviews/reviewQueue.js';

process.env.ADMIN_OVERRIDE_STORE_PATH = path.resolve('.tmp', 'admin-overrides.test.json');

describe('admin feature slices', () => {
  it('stores and lists analyst overrides', async () => {
    const created = await addOverride({
      metricKey: 'confidence_housing',
      targetId: 'vienna-at',
      overrideType: 'confidence_adjustment',
      reason: 'new_source_verification',
      requestedBy: 'qa-analyst',
      value: 0.82,
      notes: 'official source update',
    });

    expect(created.id).toContain('confidence_housing');

    const all = await listOverrides();
    expect(all.length).toBeGreaterThan(0);
  });

  it('builds a pending review queue', async () => {
    const queue = await listPendingReviewQueue();
    expect(Array.isArray(queue)).toBe(true);
  });
});
