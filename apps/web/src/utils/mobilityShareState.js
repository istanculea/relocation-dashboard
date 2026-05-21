const SHARE_LAYER_KEYS = [
  'railHighSpeed',
  'railRegional',
  'air',
  'road',
  'redundancy',
  'labels',
  'connections',
  'heat',
  'isochrones',
];

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

export const buildMobilityShareState = ({ layerVisibility = {}, timeWindowHours = 6 } = {}) => {
  const mobilityLayers = SHARE_LAYER_KEYS.reduce((result, key) => {
    if (typeof layerVisibility[key] === 'boolean') {
      result[key] = layerVisibility[key];
    }
    return result;
  }, {});

  const validWindow = [1, 3, 6].includes(timeWindowHours) ? timeWindowHours : 6;

  return {
    mWindow: validWindow,
    mLayers: mobilityLayers,
  };
};

export const readMobilityShareState = (shareState) => {
  if (!isPlainObject(shareState)) {
    return null;
  }

  const resolvedTimeWindowHours = [1, 3, 6].includes(shareState.mWindow) ? shareState.mWindow : null;
  const rawLayers = isPlainObject(shareState.mLayers) ? shareState.mLayers : {};
  const resolvedLayerVisibility = SHARE_LAYER_KEYS.reduce((result, key) => {
    if (typeof rawLayers[key] === 'boolean') {
      result[key] = rawLayers[key];
    }
    return result;
  }, {});

  if (resolvedTimeWindowHours === null && Object.keys(resolvedLayerVisibility).length === 0) {
    return null;
  }

  return {
    timeWindowHours: resolvedTimeWindowHours,
    layerVisibility: resolvedLayerVisibility,
  };
};
