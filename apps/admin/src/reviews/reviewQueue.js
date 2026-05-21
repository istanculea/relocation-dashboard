import { listOverrides } from '../overrides/overrideStore.js';

const scorePriority = (override) => {
  if (override.overrideType === 'narrative_override') {
    return 3;
  }
  if (override.overrideType === 'projection_override') {
    return 2;
  }
  return 1;
};

export const listPendingReviewQueue = async () => {
  const all = await listOverrides();
  return all
    .filter((record) => record.status === 'pending')
    .map((record) => ({
      ...record,
      priority: scorePriority(record),
    }))
    .sort((left, right) => right.priority - left.priority || left.createdAt.localeCompare(right.createdAt));
};
