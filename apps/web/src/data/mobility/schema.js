const CITY_NODE_TYPES = [
  'continentalHub',
  'strategicConnector',
  'railSpineNode',
  'peripheralStabilizer',
  'regionalGateway',
];

const CORRIDOR_MODES = ['railHighSpeed', 'railRegional', 'air', 'road'];
const CORRIDOR_TIERS = ['primary', 'secondary', 'fallback'];
const MOBILITY_MAPS = ['strategicNetwork', 'reach', 'resilience'];
const RESILIENCE_SCENARIOS = ['baseline', 'railStrike', 'airportShutdown', 'corridorOverload'];

const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const validateMembership = (value, allowed, field, errors) => {
  if (!allowed.includes(value)) {
    errors.push(`${field} must be one of: ${allowed.join(', ')}`);
  }
};

const validatePositiveNumber = (value, field, errors) => {
  if (!isFiniteNumber(value) || value <= 0) {
    errors.push(`${field} must be a positive number`);
  }
};

const validateBoundedNumber = (value, field, min, max, errors) => {
  if (!isFiniteNumber(value) || value < min || value > max) {
    errors.push(`${field} must be a number between ${min} and ${max}`);
  }
};

const validateCityIdentity = (cityNode, errors) => {
  if (!cityNode.id || typeof cityNode.id !== 'string') {
    errors.push('id must be a non-empty string');
  }
  if (!cityNode.name || typeof cityNode.name !== 'string') {
    errors.push('name must be a non-empty string');
  }
  if (!cityNode.countryCode || typeof cityNode.countryCode !== 'string' || cityNode.countryCode.length !== 2) {
    errors.push('countryCode must be a 2-letter ISO code');
  }
};

const validateCityModes = (cityNode, errors) => {
  const modes = ensureArray(cityNode.modes);
  if (modes.length === 0) {
    errors.push('modes must include at least one transport mode');
    return;
  }
  modes.forEach((mode) => validateMembership(mode, CORRIDOR_MODES, 'modes[]', errors));
};

export const validateCityNode = (cityNode) => {
  const errors = [];

  if (!cityNode || typeof cityNode !== 'object') {
    return { ok: false, errors: ['cityNode must be an object'] };
  }

  validateCityIdentity(cityNode, errors);

  validateBoundedNumber(cityNode.lat, 'lat', -90, 90, errors);
  validateBoundedNumber(cityNode.lon, 'lon', -180, 180, errors);
  validateMembership(cityNode.nodeType, CITY_NODE_TYPES, 'nodeType', errors);
  validateCityModes(cityNode, errors);

  return { ok: errors.length === 0, errors };
};

export const validateCorridor = (corridor) => {
  const errors = [];

  if (!corridor || typeof corridor !== 'object') {
    return { ok: false, errors: ['corridor must be an object'] };
  }

  if (!corridor.id || typeof corridor.id !== 'string') {
    errors.push('id must be a non-empty string');
  }
  if (!corridor.fromCityId || typeof corridor.fromCityId !== 'string') {
    errors.push('fromCityId must be a non-empty string');
  }
  if (!corridor.toCityId || typeof corridor.toCityId !== 'string') {
    errors.push('toCityId must be a non-empty string');
  }

  validateMembership(corridor.mode, CORRIDOR_MODES, 'mode', errors);
  validateMembership(corridor.tier, CORRIDOR_TIERS, 'tier', errors);
  validatePositiveNumber(corridor.travelMinutes, 'travelMinutes', errors);
  validateBoundedNumber(corridor.redundancyScore, 'redundancyScore', 0, 1, errors);
  validateBoundedNumber(corridor.reliabilityScore, 'reliabilityScore', 0, 1, errors);

  return { ok: errors.length === 0, errors };
};

export const validateReachProfile = (reachProfile) => {
  const errors = [];

  if (!reachProfile || typeof reachProfile !== 'object') {
    return { ok: false, errors: ['reachProfile must be an object'] };
  }

  if (!reachProfile.cityId || typeof reachProfile.cityId !== 'string') {
    errors.push('cityId must be a non-empty string');
  }

  validatePositiveNumber(reachProfile.population3h, 'population3h', errors);
  validatePositiveNumber(reachProfile.population6h, 'population6h', errors);
  validatePositiveNumber(reachProfile.economyReach3h, 'economyReach3h', errors);
  validatePositiveNumber(reachProfile.economyReach6h, 'economyReach6h', errors);
  validateBoundedNumber(reachProfile.averageTransferBurden, 'averageTransferBurden', 0, 5, errors);

  if (!Array.isArray(reachProfile.railFirstCountryCodes)) {
    errors.push('railFirstCountryCodes must be an array');
  }

  return { ok: errors.length === 0, errors };
};

export const validateResilienceProfile = (resilienceProfile) => {
  const errors = [];

  if (!resilienceProfile || typeof resilienceProfile !== 'object') {
    return { ok: false, errors: ['resilienceProfile must be an object'] };
  }

  if (!resilienceProfile.cityId || typeof resilienceProfile.cityId !== 'string') {
    errors.push('cityId must be a non-empty string');
  }

  validateBoundedNumber(resilienceProfile.redundancy, 'redundancy', 0, 1, errors);
  validateBoundedNumber(resilienceProfile.strikeExposure, 'strikeExposure', 0, 1, errors);
  validateBoundedNumber(resilienceProfile.climateRisk, 'climateRisk', 0, 1, errors);
  validateBoundedNumber(resilienceProfile.networkFragility, 'networkFragility', 0, 1, errors);
  validateBoundedNumber(resilienceProfile.seasonalStability, 'seasonalStability', 0, 1, errors);

  return { ok: errors.length === 0, errors };
};

export const buildMobilityDataset = ({
  cityNodes = [],
  corridors = [],
  reachProfiles = [],
  resilienceProfiles = [],
}) => {
  const errors = [];

  const cityIds = new Set();
  cityNodes.forEach((node, index) => {
    const result = validateCityNode(node);
    if (!result.ok) {
      errors.push(`cityNodes[${index}] invalid: ${result.errors.join('; ')}`);
      return;
    }
    cityIds.add(node.id);
  });

  corridors.forEach((corridor, index) => {
    const result = validateCorridor(corridor);
    if (!result.ok) {
      errors.push(`corridors[${index}] invalid: ${result.errors.join('; ')}`);
      return;
    }
    if (!cityIds.has(corridor.fromCityId) || !cityIds.has(corridor.toCityId)) {
      errors.push(`corridors[${index}] references unknown city ids`);
    }
  });

  reachProfiles.forEach((reachProfile, index) => {
    const result = validateReachProfile(reachProfile);
    if (!result.ok) {
      errors.push(`reachProfiles[${index}] invalid: ${result.errors.join('; ')}`);
      return;
    }
    if (!cityIds.has(reachProfile.cityId)) {
      errors.push(`reachProfiles[${index}] references unknown city id`);
    }
  });

  resilienceProfiles.forEach((resilienceProfile, index) => {
    const result = validateResilienceProfile(resilienceProfile);
    if (!result.ok) {
      errors.push(`resilienceProfiles[${index}] invalid: ${result.errors.join('; ')}`);
      return;
    }
    if (!cityIds.has(resilienceProfile.cityId)) {
      errors.push(`resilienceProfiles[${index}] references unknown city id`);
    }
  });

  return {
    ok: errors.length === 0,
    errors,
    data: {
      cityNodes,
      corridors,
      reachProfiles,
      resilienceProfiles,
    },
  };
};

export {
  CITY_NODE_TYPES,
  CORRIDOR_MODES,
  CORRIDOR_TIERS,
  MOBILITY_MAPS,
  RESILIENCE_SCENARIOS,
};