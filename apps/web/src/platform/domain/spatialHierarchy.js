const COUNTRY_ISO = {
  Austria: 'AT',
  Belgium: 'BE',
  Germany: 'DE',
  Ireland: 'IE',
  Italy: 'IT',
  Portugal: 'PT',
  Romania: 'RO',
  Spain: 'ES',
};

const REGION_BY_COUNTRY = {
  Austria: 'alpine-core',
  Germany: 'rhine-danube-core',
  Belgium: 'north-sea-core',
  Ireland: 'atlantic-west',
  Italy: 'northern-italy-corridor',
  Portugal: 'atlantic-iberia',
  Spain: 'atlantic-mediterranean-iberia',
  Romania: 'eastern-europe-gateway',
};

const REGION_LABELS = {
  'alpine-core': 'Alpine Core Region',
  'rhine-danube-core': 'Rhine-Danube Core Region',
  'north-sea-core': 'North Sea Core Region',
  'atlantic-west': 'Atlantic West Region',
  'northern-italy-corridor': 'Northern Italy Corridor',
  'atlantic-iberia': 'Atlantic Iberia Region',
  'atlantic-mediterranean-iberia': 'Atlantic-Mediterranean Iberia Region',
  'eastern-europe-gateway': 'Eastern Europe Gateway Region',
  'continental-europe': 'Continental Europe Region',
};

const toClusterId = (country) => `${country.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cluster`;

const resolveRegionId = (country) => REGION_BY_COUNTRY[country] ?? 'continental-europe';

export const buildSpatialHierarchy = (cities = []) => {
  const continent = {
    id: 'europe',
    name: 'Europe',
    regionIds: [],
  };

  const regionsById = new Map();
  const clustersById = new Map();

  const cityNodes = cities.map((city) => {
    const regionId = resolveRegionId(city.country);
    const clusterId = toClusterId(city.country);

    if (!regionsById.has(regionId)) {
      regionsById.set(regionId, {
        id: regionId,
        name: REGION_LABELS[regionId] ?? REGION_LABELS['continental-europe'],
        continentId: continent.id,
        clusterIds: [],
      });
    }

    if (!clustersById.has(clusterId)) {
      clustersById.set(clusterId, {
        id: clusterId,
        name: `${city.country} Cluster`,
        regionId,
        cityIds: [],
        corridorIds: [],
      });
    }

    const region = regionsById.get(regionId);
    if (!region.clusterIds.includes(clusterId)) {
      region.clusterIds.push(clusterId);
    }

    const cluster = clustersById.get(clusterId);
    if (!cluster.cityIds.includes(city.key)) {
      cluster.cityIds.push(city.key);
    }

    return {
      id: city.key,
      name: city.city,
      countryCode: COUNTRY_ISO[city.country] ?? city.country.slice(0, 2).toUpperCase(),
      lat: Number(city?.geo?.lat ?? 0),
      lon: Number(city?.geo?.lon ?? 0),
      clusterId,
      zoneIds: [],
    };
  });

  const regions = [...regionsById.values()].sort((left, right) => left.name.localeCompare(right.name));
  const clusters = [...clustersById.values()].sort((left, right) => left.name.localeCompare(right.name));

  continent.regionIds = regions.map((region) => region.id);

  return {
    continent,
    regions,
    clusters,
    cityNodes,
  };
};
