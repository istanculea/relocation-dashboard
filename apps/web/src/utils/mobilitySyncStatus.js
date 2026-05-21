const modeStateLabel = (isEnabled, label) => `${label}:${isEnabled ? 'On' : 'Off'}`;

export const buildMobilitySyncChips = ({ timeWindowHours, layerVisibility }) => {
  const layers = layerVisibility ?? {};
  const railEnabled = Boolean(layers.railHighSpeed) || Boolean(layers.railRegional);

  return [
    `Reach:${timeWindowHours}h`,
    modeStateLabel(Boolean(layers.air), 'Air'),
    modeStateLabel(railEnabled, 'Rail'),
    modeStateLabel(Boolean(layers.road), 'Road'),
    modeStateLabel(Boolean(layers.connections), 'Links'),
    modeStateLabel(Boolean(layers.heat), 'Heat'),
    modeStateLabel(Boolean(layers.isochrones), 'Iso'),
  ];
};