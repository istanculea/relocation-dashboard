/**
 * Phase 0 adapter.
 *
 * This file defines the new graph package entrypoint while reusing the
 * existing mobility schema implementation to avoid runtime drift.
 */

export {
  buildMobilityDataset,
  CITY_NODE_TYPES,
  CORRIDOR_MODES,
  CORRIDOR_TIERS,
  MOBILITY_MAPS,
  RESILIENCE_SCENARIOS,
  validateCityNode,
  validateCorridor,
  validateReachProfile,
  validateResilienceProfile,
} from '../../data/mobility/schema.js';
