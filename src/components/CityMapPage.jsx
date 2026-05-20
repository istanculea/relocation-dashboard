import { useMemo, useState } from 'react';
import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesTopology from 'world-atlas/countries-110m.json';
import { cityGeoData, projectGeoPoint } from '../data/cityGeoData.js';
import { getNeighborhoodProfiles } from '../data/neighborhoodProfiles.js';
import { strategicBalanceWeights } from '../data/dashboardConfig.js';

const VIEWBOX_WIDTH = 1180;
const VIEWBOX_HEIGHT = 760;

const EUROPE_EXTENTS = {
  minLon: -25,
  maxLon: 45,
  minLat: 34,
  maxLat: 72,
};

const GRID_LATS = [38, 42, 46, 50, 54, 58, 62];
const GRID_LONS = [-8, -2, 4, 10, 16, 22, 28, 34];

const TRANSPORT_MODE_META = {
  road: { label: 'Road', shortLabel: 'RD' },
  rail: { label: 'Rail', shortLabel: 'RL' },
  air: { label: 'Air', shortLabel: 'AR' },
};

const ROAD_SPEED_BANDS = [
  { maxDistanceKm: 120, averageSpeedKmh: 68 },
  { maxDistanceKm: 300, averageSpeedKmh: 78 },
  { maxDistanceKm: 650, averageSpeedKmh: 88 },
  { maxDistanceKm: Infinity, averageSpeedKmh: 95 },
];

const RAIL_SPEED_PROFILES = [
  {
    maxDistanceKm: 180,
    averageSpeedKmh: 92,
    stationAccessHours: 0.3,
    timetableWaitHours: 0.2,
    transferBufferHours: 0,
  },
  {
    maxDistanceKm: 520,
    averageSpeedKmh: 128,
    stationAccessHours: 0.35,
    timetableWaitHours: 0.25,
    transferBufferHours: 0.15,
  },
  {
    maxDistanceKm: Infinity,
    averageSpeedKmh: 168,
    stationAccessHours: 0.4,
    timetableWaitHours: 0.3,
    transferBufferHours: 0.35,
  },
];

const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));

const countriesFeatureCollection = feature(countriesTopology, countriesTopology.objects.countries);

const europeCountryFeatures = countriesFeatureCollection.features.filter((countryFeature) => {
  const [longitude, latitude] = geoCentroid(countryFeature);
  return longitude >= EUROPE_EXTENTS.minLon
    && longitude <= EUROPE_EXTENTS.maxLon
    && latitude >= EUROPE_EXTENTS.minLat
    && latitude <= EUROPE_EXTENTS.maxLat;
});

const createEuropeMapGeometry = (width, height, padding = 24) => {
  const mapProjection = geoMercator()
    .fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      { type: 'FeatureCollection', features: europeCountryFeatures },
    );
  const pathBuilder = geoPath(mapProjection);

  return {
    projection: mapProjection,
    paths: europeCountryFeatures
      .map((countryFeature, index) => ({
        key: `eu-country-${index}`,
        d: pathBuilder(countryFeature),
      }))
      .filter((pathEntry) => Boolean(pathEntry.d)),
  };
};

const MAIN_EUROPE_MAP = createEuropeMapGeometry(VIEWBOX_WIDTH, VIEWBOX_HEIGHT, 26);

const toRadians = (value) => (value * Math.PI) / 180;

const computeDistanceKm = (fromGeo, toGeo) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(toGeo.lat - fromGeo.lat);
  const dLon = toRadians(toGeo.lon - fromGeo.lon);
  const fromLat = toRadians(fromGeo.lat);
  const toLat = toRadians(toGeo.lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const projectEuropePoint = (geo, mapGeometry, width, height) => {
  const projected = mapGeometry.projection([geo.lon, geo.lat]);

  if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
    return { x: projected[0], y: projected[1] };
  }

  return projectGeoPoint(geo, width, height);
};

const getScoreValue = (city) => {
  if (Number.isFinite(city?.activeWeightedScore)) {
    return city.activeWeightedScore;
  }
  if (Number.isFinite(city?.weightedScore)) {
    return city.weightedScore;
  }
  return Number.isFinite(city?.score) ? city.score : 0;
};

const formatHoursLabel = (hoursValue) => {
  const wholeHours = Math.floor(hoursValue);
  const minutes = Math.round((hoursValue - wholeHours) * 60);

  if (wholeHours <= 0) {
    return `${minutes}m`;
  }

  if (minutes === 0) {
    return `${wholeHours}h`;
  }

  return `${wholeHours}h ${minutes}m`;
};

const formatDistance = (distanceKm) => `${Math.round(distanceKm).toLocaleString()} km`;

const estimateRoadTravelHours = (distanceKm) => {
  const band = ROAD_SPEED_BANDS.find((candidateBand) => distanceKm <= candidateBand.maxDistanceKm)
    ?? ROAD_SPEED_BANDS[ROAD_SPEED_BANDS.length - 1];
  const pureDrivingHours = distanceKm / band.averageSpeedKmh;
  const congestionFactor = distanceKm <= 220 ? 1.12 : distanceKm <= 600 ? 1.09 : 1.06;
  const breakCount = Math.max(0, Math.floor(pureDrivingHours / 2.4));
  const breakHours = breakCount * 0.12;

  return pureDrivingHours * congestionFactor + breakHours;
};

const estimateRailTravelHours = (distanceKm) => {
  const profile = RAIL_SPEED_PROFILES.find((candidateProfile) => distanceKm <= candidateProfile.maxDistanceKm)
    ?? RAIL_SPEED_PROFILES[RAIL_SPEED_PROFILES.length - 1];
  const inTrainHours = distanceKm / profile.averageSpeedKmh;

  return inTrainHours
    + profile.stationAccessHours
    + profile.timetableWaitHours
    + profile.transferBufferHours;
};

const estimateAirTravelHours = (distanceKm) => {
  const airportProcessingHours = 1.75;
  const airportTransferHours = 0.75;
  const taxiAndBoardingHours = 0.35;
  const blockSpeedKmh = distanceKm <= 900 ? 700 : 760;
  const inFlightHours = distanceKm / blockSpeedKmh;
  const connectionBufferHours = distanceKm > 1400 ? 0.45 : 0;

  return airportProcessingHours
    + airportTransferHours
    + taxiAndBoardingHours
    + inFlightHours
    + connectionBufferHours;
};

const buildTravelHoursByMode = (distanceKm, modes) => {
  const hoursByMode = {};

  modes.forEach((mode) => {
    if (mode === 'road') {
      hoursByMode.road = estimateRoadTravelHours(distanceKm);
    }
    if (mode === 'rail') {
      hoursByMode.rail = estimateRailTravelHours(distanceKm);
    }
    if (mode === 'air') {
      hoursByMode.air = estimateAirTravelHours(distanceKm);
    }
  });

  return hoursByMode;
};

const buildModeTimeLabel = (hoursByMode, modes) => modes
  .map((mode) => `${TRANSPORT_MODE_META[mode].shortLabel} ${formatHoursLabel(hoursByMode[mode])}`)
  .join(' | ');

const findFastestMode = (hoursByMode) => Object.entries(hoursByMode)
  .sort((leftMode, rightMode) => leftMode[1] - rightMode[1])[0]?.[0] ?? 'road';

const inferTransportModes = (distanceKm) => {
  if (distanceKm <= 280) {
    return ['road', 'rail'];
  }
  if (distanceKm <= 750) {
    return ['road', 'rail', 'air'];
  }
  if (distanceKm <= 1350) {
    return ['rail', 'air'];
  }
  return ['air'];
};

const getPrimaryTransportMode = (modes) => {
  if (modes.includes('road')) {
    return 'road';
  }
  if (modes.includes('rail')) {
    return 'rail';
  }
  return 'air';
};

const buildCityConnections = (cityOptions, selectedCityKey, maxConnections = 4) => {
  const selectedGeo = selectedCityKey ? cityGeoData[selectedCityKey] : null;

  if (!selectedGeo) {
    return [];
  }

  return cityOptions
    .filter((city) => city.key !== selectedCityKey)
    .map((city) => {
      const geo = cityGeoData[city.key];
      if (!geo) {
        return null;
      }

      const distanceKm = computeDistanceKm(selectedGeo, geo);
      const modes = inferTransportModes(distanceKm);
      const travelHoursByMode = buildTravelHoursByMode(distanceKm, modes);

      return {
        city,
        distanceKm,
        modes,
        primaryMode: getPrimaryTransportMode(modes),
        travelHoursByMode,
        fastestMode: findFastestMode(travelHoursByMode),
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.distanceKm - right.distanceKm)
    .slice(0, maxConnections);
};

const buildCityNetworkConnections = (cityOptions, nearestCount = 3) => {
  const connectionMap = new Map();

  cityOptions.forEach((originCity) => {
    const originGeo = cityGeoData[originCity.key];
    if (!originGeo) {
      return;
    }

    const nearestNeighbors = cityOptions
      .filter((candidateCity) => candidateCity.key !== originCity.key)
      .map((candidateCity) => {
        const candidateGeo = cityGeoData[candidateCity.key];
        if (!candidateGeo) {
          return null;
        }

        const distanceKm = computeDistanceKm(originGeo, candidateGeo);
        const modes = inferTransportModes(distanceKm);
        const travelHoursByMode = buildTravelHoursByMode(distanceKm, modes);

        return {
          fromCity: originCity,
          toCity: candidateCity,
          distanceKm,
          modes,
          primaryMode: getPrimaryTransportMode(modes),
          travelHoursByMode,
          fastestMode: findFastestMode(travelHoursByMode),
          modeTimeLabel: buildModeTimeLabel(travelHoursByMode, modes),
        };
      })
      .filter(Boolean)
      .sort((left, right) => left.distanceKm - right.distanceKm)
      .slice(0, nearestCount);

    nearestNeighbors.forEach((connection) => {
      const [a, b] = [connection.fromCity.key, connection.toCity.key].sort();
      const edgeKey = `${a}--${b}`;
      const existingConnection = connectionMap.get(edgeKey);

      if (!existingConnection || connection.distanceKm < existingConnection.distanceKm) {
        connectionMap.set(edgeKey, {
          key: edgeKey,
          ...connection,
        });
      }
    });
  });

  return [...connectionMap.values()].sort((left, right) => left.distanceKm - right.distanceKm);
};

const buildConnectivityRanking = (cityOptions, networkConnections, topN = 5) => {
  const cityIndex = new Map(cityOptions.map((city) => [city.key, city]));
  const rankingIndex = new Map(
    cityOptions.map((city) => [
      city.key,
      {
        key: city.key,
        city: city.city,
        country: city.country,
        rawScore: 0,
        links: 0,
        modes: new Set(),
        fastestHoursTotal: 0,
      },
    ]),
  );

  networkConnections.forEach((connection) => {
    const fastestHours = connection.travelHoursByMode?.[connection.fastestMode] ?? 7;
    const travelEase = Math.max(2, 16 - fastestHours * 1.8);
    const proximity = Math.max(1, 12 - connection.distanceKm / 150);
    const modeBonus = connection.modes.length * 2.4;
    const increment = travelEase + proximity + modeBonus;

    [connection.fromCity.key, connection.toCity.key].forEach((cityKey) => {
      const cityEntry = rankingIndex.get(cityKey);
      if (!cityEntry) {
        return;
      }

      cityEntry.rawScore += increment;
      cityEntry.links += 1;
      cityEntry.fastestHoursTotal += fastestHours;
      connection.modes.forEach((mode) => cityEntry.modes.add(mode));
    });
  });

  const rankingRows = [...rankingIndex.values()]
    .map((entry) => {
      const modeDiversityMultiplier = 1 + Math.max(0, entry.modes.size - 1) * 0.06;
      const densityMultiplier = 1 + Math.max(0, entry.links - 2) * 0.03;
      const weightedScore = entry.rawScore * modeDiversityMultiplier * densityMultiplier;
      const cityData = cityIndex.get(entry.key);

      return {
        ...entry,
        city: cityData?.city ?? entry.city,
        country: cityData?.country ?? entry.country,
        weightedScore,
        avgFastestHours: entry.links > 0 ? entry.fastestHoursTotal / entry.links : null,
      };
    })
    .sort((left, right) => right.weightedScore - left.weightedScore || right.links - left.links);

  const maxScore = rankingRows[0]?.weightedScore ?? 1;

  return rankingRows.slice(0, topN).map((entry) => ({
    ...entry,
    connectivityScore: Number(((entry.weightedScore / maxScore) * 100).toFixed(1)),
    modeCount: entry.modes.size,
  }));
};

const buildArcPath = (fromPoint, toPoint, curvature = 0.18) => {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const controlX = (fromPoint.x + toPoint.x) / 2 + normalX * length * curvature;
  const controlY = (fromPoint.y + toPoint.y) / 2 + normalY * length * curvature;
  return `M ${fromPoint.x} ${fromPoint.y} Q ${controlX} ${controlY} ${toPoint.x} ${toPoint.y}`;
};

const normalizeScore = (value) => clampValue(value, 0, 10);

const STRATEGIC_DIMENSION_PILLARS = {
  connectivity: ['euRegistration', 'diplomaRecognition', 'economyJobsTaxes', 'locationInfra'],
  family: ['childcareEducation', 'healthMedical', 'criminalityStreetSafe', 'socialCapital', 'locationInfra'],
  resilience: ['climateResilience', 'envPollution', 'mobilityLogistics', 'healthMedical', 'criminalityStreetSafe'],
  affordability: ['rentalMarket', 'homeOwnership', 'cleanBasket', 'economyJobsTaxes', 'realEstateHousing'],
  mobility: ['mobilityLogistics', 'locationInfra', 'envPollution', 'climateResilience'],
};

const sumDimensionPillarWeights = (pillarKeys) => pillarKeys
  .reduce((total, pillarKey) => total + (strategicBalanceWeights[pillarKey] ?? 0), 0);

const STRATEGIC_DIMENSION_WEIGHT_TOTALS = {
  connectivity: sumDimensionPillarWeights(STRATEGIC_DIMENSION_PILLARS.connectivity),
  family: sumDimensionPillarWeights(STRATEGIC_DIMENSION_PILLARS.family),
  resilience: sumDimensionPillarWeights(STRATEGIC_DIMENSION_PILLARS.resilience),
  affordability: sumDimensionPillarWeights(STRATEGIC_DIMENSION_PILLARS.affordability),
  mobility: sumDimensionPillarWeights(STRATEGIC_DIMENSION_PILLARS.mobility),
};

const STRATEGIC_DIMENSION_WEIGHT_SUM = Object.values(STRATEGIC_DIMENSION_WEIGHT_TOTALS)
  .reduce((total, weightValue) => total + weightValue, 0);

const weightedPillarAverage = (pillarScoresByKey, pillarKeys) => {
  let weightedTotal = 0;
  let totalWeight = 0;

  pillarKeys.forEach((pillarKey) => {
    const score = pillarScoresByKey.get(pillarKey);
    const weight = strategicBalanceWeights[pillarKey] ?? 0;

    if (Number.isFinite(score) && weight > 0) {
      weightedTotal += score * weight;
      totalWeight += weight;
    }
  });

  if (totalWeight <= 0) {
    return null;
  }

  return weightedTotal / totalWeight;
};

const budgetToAffordabilityScore = (budget) => {
  if (!Number.isFinite(budget) || budget <= 0) {
    return 6;
  }
  return clampValue(12 - budget / 550, 2.2, 9.6);
};

const buildCityDimensions = (city, networkRow, closestConnections) => {
  const baseScore = getScoreValue(city);
  const scores = city?.scores ?? {};
  const pillarScoresByKey = new Map((city?.strategicBalance?.pillars ?? [])
    .map((pillar) => [pillar.key, pillar.score]));
  const housingScore = Number.isFinite(scores.housing) ? scores.housing : baseScore;
  const childcareScore = Number.isFinite(scores.childcare) ? scores.childcare : baseScore;
  const environmentScore = Number.isFinite(scores.environment) ? scores.environment : baseScore;
  const safetyScore = Number.isFinite(scores.safety) ? scores.safety : baseScore;
  const healthcareScore = Number.isFinite(scores.healthcare) ? scores.healthcare : baseScore;
  const familyFromModel = weightedPillarAverage(pillarScoresByKey, STRATEGIC_DIMENSION_PILLARS.family);
  const resilienceFromModel = weightedPillarAverage(pillarScoresByKey, STRATEGIC_DIMENSION_PILLARS.resilience);
  const affordabilityFromModel = weightedPillarAverage(pillarScoresByKey, STRATEGIC_DIMENSION_PILLARS.affordability);
  const affordability = normalizeScore(
    ((affordabilityFromModel ?? housingScore) * 0.82)
    + (budgetToAffordabilityScore(city.scenarioBudget) * 0.18),
  );
  const family = normalizeScore(
    familyFromModel ?? ((childcareScore * 0.45) + (healthcareScore * 0.35) + (safetyScore * 0.2)),
  );
  const resilience = normalizeScore(
    resilienceFromModel ?? ((environmentScore * 0.55) + (safetyScore * 0.25) + (healthcareScore * 0.2)),
  );
  const connectivity = normalizeScore((networkRow?.connectivityScore ?? 55) / 10);
  const mobility = normalizeScore((connectivity * 0.65) + ((networkRow?.modeCount ?? 2) * 1.2));
  const strategic = normalizeScore(
    (
      (connectivity * STRATEGIC_DIMENSION_WEIGHT_TOTALS.connectivity)
      + (family * STRATEGIC_DIMENSION_WEIGHT_TOTALS.family)
      + (resilience * STRATEGIC_DIMENSION_WEIGHT_TOTALS.resilience)
      + (affordability * STRATEGIC_DIMENSION_WEIGHT_TOTALS.affordability)
      + (mobility * STRATEGIC_DIMENSION_WEIGHT_TOTALS.mobility)
    ) / Math.max(STRATEGIC_DIMENSION_WEIGHT_SUM, 0.0001),
  );

  const countriesReachableByRail = clampValue(
    Math.round((networkRow?.links ?? 0) * 1.25 + 3),
    2,
    15,
  );
  const carFreeErrands = clampValue(Math.round((mobility * 7.8) + (family * 2.6) + 8), 31, 94);
  const commuteMinutes = clampValue(Math.round(51 - (mobility * 2.4) - (family * 0.8)), 16, 52);
  const pediatricClinics = clampValue(Math.round((healthcareScore * 1.8) + (family * 1.2) + 4), 6, 36);
  const greenCoverage = clampValue(Math.round((environmentScore * 7.6) + 10), 19, 88);
  const reachableWithin6h = closestConnections.filter((connection) => {
    const fastest = connection.travelHoursByMode?.[connection.fastestMode] ?? 99;
    return fastest <= 6;
  });

  const regionalPopulationReachMillions = Number((reachableWithin6h.length * 4.8 + 3.2).toFixed(1));

  return {
    connectivity,
    family,
    resilience,
    affordability,
    mobility,
    strategic,
    countriesReachableByRail,
    carFreeErrands,
    commuteMinutes,
    pediatricClinics,
    greenCoverage,
    reachableWithin6h: reachableWithin6h.length,
    regionalPopulationReachMillions,
  };
};

const CityMapCanvas = function cityMapCanvas({
  cityOptions,
  selectedCityKey,
  hoveredCityKey,
  onSelectCity,
  onHoverCity,
  showLabels,
  showConnections,
  showHeat,
  showIsochrones,
  activeTransportModes,
  cityNetworkConnections,
  cityDimensionByKey,
  topCityRankByKey,
  zoom,
  pan,
}) {
  const selectedGeo = selectedCityKey ? cityGeoData[selectedCityKey] : null;
  const selectedPoint = selectedGeo
    ? projectEuropePoint(selectedGeo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT)
    : null;

  const visibleNetworkConnections = cityNetworkConnections.filter((connection) =>
    connection.modes.some((mode) => activeTransportModes[mode]),
  );

  const sortedCityOptions = [...cityOptions]
    .sort((left, right) => getScoreValue(left) - getScoreValue(right));

  const viewportTransform = `translate(${pan.x} ${pan.y}) scale(${zoom})`;

  return (
    <div className="city-map-canvas-wrap">
      <svg
        className="city-map-svg"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        role="img"
        aria-label="Strategic relocation map of Europe"
      >
        <defs>
          <linearGradient id="cityMapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0a0f1e" />
            <stop offset="48%" stopColor="#101a33" />
            <stop offset="100%" stopColor="#0b1427" />
          </linearGradient>
          <radialGradient id="cityMapGlow" cx="0.45" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="rgba(143, 183, 255, 0.22)" />
            <stop offset="100%" stopColor="rgba(143, 183, 255, 0)" />
          </radialGradient>
          <clipPath id="cityMapClip">
            <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} rx="24" />
          </clipPath>
        </defs>

        <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} rx="24" fill="url(#cityMapBg)" />
        <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} rx="24" fill="url(#cityMapGlow)" />

        <g className="city-map-grid" clipPath="url(#cityMapClip)">
          {GRID_LATS.map((lat) => {
            const y = projectEuropePoint({ lat, lon: 10 }, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT).y;
            return <line key={`lat-${lat}`} x1="0" y1={y} x2={VIEWBOX_WIDTH} y2={y} />;
          })}
          {GRID_LONS.map((lon) => {
            const x = projectEuropePoint({ lat: 48, lon }, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT).x;
            return <line key={`lon-${lon}`} x1={x} y1="0" x2={x} y2={VIEWBOX_HEIGHT} />;
          })}
        </g>

        <g className="city-map-viewport" transform={viewportTransform} clipPath="url(#cityMapClip)">
          <g className="city-map-regions" aria-label="Europe regional backdrop">
            {MAIN_EUROPE_MAP.paths.map((countryPath) => (
              <path key={countryPath.key} d={countryPath.d} className="city-map-region" />
            ))}
          </g>

          {showHeat && (
            <g className="city-map-heat-zones" aria-label="Mobility intensity zones">
              {cityOptions.map((city) => {
                const geo = cityGeoData[city.key];
                if (!geo) {
                  return null;
                }
                const point = projectEuropePoint(geo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
                const dimensions = cityDimensionByKey.get(city.key);
                const strategicScore = dimensions?.strategic ?? getScoreValue(city);
                const radius = clampValue(22 + strategicScore * 3.6, 26, 58);

                return (
                  <circle
                    key={`heat-${city.key}`}
                    className="city-map-heat-zone"
                    cx={point.x}
                    cy={point.y}
                    r={radius}
                  />
                );
              })}
            </g>
          )}

          {showConnections && visibleNetworkConnections.length > 0 && (
            <g className="city-map-network" aria-label="Transport network connections">
              {visibleNetworkConnections.map((connection) => {
                const fromGeo = cityGeoData[connection.fromCity.key];
                const toGeo = cityGeoData[connection.toCity.key];
                const fromPoint = projectEuropePoint(fromGeo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
                const toPoint = projectEuropePoint(toGeo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
                const isSelectedEdge =
                  connection.fromCity.key === selectedCityKey || connection.toCity.key === selectedCityKey;
                const isHoveredEdge =
                  connection.fromCity.key === hoveredCityKey || connection.toCity.key === hoveredCityKey;

                const lineClasses = [
                  'city-map-network__line',
                  `city-map-network__line--${connection.primaryMode}`,
                  isSelectedEdge ? 'city-map-network__line--selected' : '',
                  isHoveredEdge ? 'city-map-network__line--hover' : '',
                ].filter(Boolean).join(' ');

                if (connection.primaryMode === 'air') {
                  return (
                    <path
                      key={connection.key}
                      className={lineClasses}
                      d={buildArcPath(fromPoint, toPoint, 0.22)}
                    >
                      <title>
                        {`${connection.fromCity.city} ⇄ ${connection.toCity.city} • ${formatDistance(connection.distanceKm)} • ${connection.modeTimeLabel}`}
                      </title>
                    </path>
                  );
                }

                return (
                  <line
                    key={connection.key}
                    className={lineClasses}
                    x1={fromPoint.x}
                    y1={fromPoint.y}
                    x2={toPoint.x}
                    y2={toPoint.y}
                  >
                    <title>
                      {`${connection.fromCity.city} ⇄ ${connection.toCity.city} • ${formatDistance(connection.distanceKm)} • ${connection.modeTimeLabel}`}
                    </title>
                  </line>
                );
              })}
            </g>
          )}

          {showIsochrones && selectedPoint && (
            <g className="city-map-isochrones" aria-label="Isochrone rings">
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r="72" />
              <circle cx={selectedPoint.x} cy={selectedPoint.y} r="126" />
              <text x={selectedPoint.x + 78} y={selectedPoint.y - 8}>3h rail reach</text>
              <text x={selectedPoint.x + 132} y={selectedPoint.y + 4}>6h multimodal reach</text>
            </g>
          )}

          {sortedCityOptions.map((city) => {
            const geo = cityGeoData[city.key];
            if (!geo) {
              return null;
            }

            const point = projectEuropePoint(geo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
            const dimensions = cityDimensionByKey.get(city.key);
            const strategic = dimensions?.strategic ?? getScoreValue(city);
            const pointRadius = clampValue(5.8 + (strategic - 5.8) * 1.8, 5.5, 12.5);
            const isActive = city.key === selectedCityKey;
            const isHovered = city.key === hoveredCityKey;

            return (
              <g
                key={city.key}
                className={`city-map-point${isActive ? ' city-map-point--active' : ''}${isHovered ? ' city-map-point--hover' : ''}`}
                onClick={() => onSelectCity(city.key)}
                onMouseEnter={() => onHoverCity(city.key)}
                onMouseLeave={() => onHoverCity(null)}
                role="button"
                tabIndex={0}
                aria-label={`${city.city}, ${city.country}. Strategic score ${strategic.toFixed(2)}.`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectCity(city.key);
                  }
                }}
              >
                <circle cx={point.x} cy={point.y} r={isActive ? pointRadius + 2 : pointRadius} />
                <circle cx={point.x} cy={point.y} r={isActive ? pointRadius + 8 : pointRadius + 5} className="city-map-point__halo" />
                {showLabels && <text x={point.x + pointRadius + 6} y={point.y + 4}>{city.city}</text>}
                {topCityRankByKey.has(city.key) && (
                  <g className="city-map-rank-pin" aria-hidden="true">
                    <circle cx={point.x - pointRadius - 9} cy={point.y - pointRadius - 8} r="9" />
                    <text x={point.x - pointRadius - 9} y={point.y - pointRadius - 5} textAnchor="middle">
                      {topCityRankByKey.get(city.key)}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

const StrategicCityCard = function strategicCityCard({ city, dimensions, networkRow, rank, onOpen }) {
  return (
    <article className="city-map-strategic-card">
      <header className="city-map-strategic-card__header">
        <div>
          <p className="city-map-strategic-card__eyebrow">Tier {rank}</p>
          <h4>{city.city}</h4>
          <span>{city.country}</span>
        </div>
        <span className="city-map-strategic-card__score">{dimensions.strategic.toFixed(1)}</span>
      </header>

      <dl className="city-map-strategic-card__metrics">
        <div><dt>Connectivity</dt><dd>{dimensions.connectivity.toFixed(1)}</dd></div>
        <div><dt>Family</dt><dd>{dimensions.family.toFixed(1)}</dd></div>
        <div><dt>Resilience</dt><dd>{dimensions.resilience.toFixed(1)}</dd></div>
        <div><dt>Affordability</dt><dd>{dimensions.affordability.toFixed(1)}</dd></div>
        <div><dt>Mobility</dt><dd>{dimensions.mobility.toFixed(1)}</dd></div>
      </dl>

      <p className="city-map-strategic-card__reach">
        Reach within 6h: {dimensions.reachableWithin6h} cities / {dimensions.regionalPopulationReachMillions}M people
      </p>

      <button type="button" className="city-map-strategic-card__cta" onClick={onOpen}>
        Open intelligence card {networkRow ? `(${networkRow.links} transport links)` : ''}
      </button>
    </article>
  );
};

export const CityMapPage = function cityMapPage({
  cityOptions,
  selectedCity,
  onSelectCity,
  onBack,
  onGoToExplorer,
  onShare,
}) {
  const [showLabels, setShowLabels] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [showHeat, setShowHeat] = useState(true);
  const [showIsochrones, setShowIsochrones] = useState(true);
  const [nearestNeighborCount, setNearestNeighborCount] = useState(3);
  const [activeTransportModes, setActiveTransportModes] = useState({
    road: true,
    rail: true,
    air: true,
  });
  const [hoveredCityKey, setHoveredCityKey] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const mappableCityOptions = cityOptions.filter((city) => cityGeoData[city.key]);
  const selectedCityKey = selectedCity?.key ?? null;
  const focusCityKey = hoveredCityKey ?? selectedCityKey;

  const cityNetworkConnections = useMemo(
    () => buildCityNetworkConnections(mappableCityOptions, nearestNeighborCount),
    [mappableCityOptions, nearestNeighborCount],
  );

  const visibleNetworkConnections = useMemo(
    () => cityNetworkConnections.filter((connection) =>
      connection.modes.some((mode) => activeTransportModes[mode]),
    ),
    [activeTransportModes, cityNetworkConnections],
  );

  const connectivityRanking = useMemo(
    () => buildConnectivityRanking(mappableCityOptions, visibleNetworkConnections, 10),
    [mappableCityOptions, visibleNetworkConnections],
  );

  const topCityRankByKey = useMemo(
    () => new Map(connectivityRanking.map((cityRow, index) => [cityRow.key, index + 1])),
    [connectivityRanking],
  );

  const cityConnectionsByKey = useMemo(() => {
    const map = new Map();
    mappableCityOptions.forEach((city) => {
      map.set(city.key, buildCityConnections(mappableCityOptions, city.key, 7));
    });
    return map;
  }, [mappableCityOptions]);

  const cityDimensionByKey = useMemo(() => {
    const networkByKey = new Map(connectivityRanking.map((row) => [row.key, row]));
    const map = new Map();

    mappableCityOptions.forEach((city) => {
      const networkRow = networkByKey.get(city.key);
      const closestConnections = cityConnectionsByKey.get(city.key) ?? [];
      map.set(city.key, buildCityDimensions(city, networkRow, closestConnections));
    });

    return map;
  }, [mappableCityOptions, connectivityRanking, cityConnectionsByKey]);

  const rankingStripRows = useMemo(() => {
    const withDimensions = mappableCityOptions.map((city) => ({
      city,
      dimensions: cityDimensionByKey.get(city.key),
      network: connectivityRanking.find((row) => row.key === city.key),
    }));

    const sortBy = (selector, direction = 'desc') => [...withDimensions]
      .sort((left, right) => {
        const delta = selector(right) - selector(left);
        return direction === 'desc' ? delta : -delta;
      })[0] ?? null;

    const bestRail = [...withDimensions]
      .map((row) => {
        const links = cityConnectionsByKey.get(row.city.key) ?? [];
        const railCount = links.filter((connection) => connection.modes.includes('rail')).length;
        return { ...row, railCount };
      })
      .sort((left, right) => right.railCount - left.railCount)[0] ?? null;

    return [
      { label: 'Top Connected', row: sortBy((candidate) => candidate.network?.connectivityScore ?? 0) },
      { label: 'Best Family Mobility', row: sortBy((candidate) => candidate.dimensions?.family ?? 0) },
      { label: 'Best Rail Networks', row: bestRail },
      { label: 'Most Walkable', row: sortBy((candidate) => candidate.dimensions?.carFreeErrands ?? 0) },
      { label: 'Lowest Commute Burden', row: sortBy((candidate) => candidate.dimensions?.commuteMinutes ?? 100, 'asc') },
    ];
  }, [mappableCityOptions, cityDimensionByKey, connectivityRanking, cityConnectionsByKey]);

  const focusCity = focusCityKey
    ? mappableCityOptions.find((city) => city.key === focusCityKey) ?? null
    : null;
  const focusDimensions = focusCity ? cityDimensionByKey.get(focusCity.key) : null;
  const focusConnections = focusCity ? cityConnectionsByKey.get(focusCity.key) ?? [] : [];
  const focusNeighborhoods = focusCity ? getNeighborhoodProfiles(focusCity.key).slice(0, 3) : [];

  const handleZoom = (direction) => {
    setZoom((previousZoom) => {
      const delta = direction === 'in' ? 0.2 : -0.2;
      return clampValue(Number((previousZoom + delta).toFixed(2)), 1, 2.4);
    });
  };

  const handlePan = (dx, dy) => {
    setPan((previousPan) => ({
      x: clampValue(previousPan.x + dx, -220, 220),
      y: clampValue(previousPan.y + dy, -180, 180),
    }));
  };

  const resetViewport = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const averageFastestTripHours = useMemo(() => {
    if (visibleNetworkConnections.length === 0) {
      return null;
    }

    const totalHours = visibleNetworkConnections.reduce(
      (sum, connection) => sum + (connection.travelHoursByMode?.[connection.fastestMode] ?? 0),
      0,
    );

    return totalHours / visibleNetworkConnections.length;
  }, [visibleNetworkConnections]);

  return (
    <div className="app-shell explorer-page-shell city-map-shell">
      <header className="ws-header city-map-header">
        <div className="ws-header__brand">
          <span className="ws-header__title">European Strategic Atlas</span>
          <span className="ws-header__subtitle">Relocation intelligence for family-ready remote life</span>
        </div>
        <div className="ws-header__divider" />
        <div style={{ flex: 1 }} />
        <div className="ws-header__actions">
          <button type="button" className="ws-icon-btn" onClick={onShare} title="Copy share link">
            Share
          </button>
          <button type="button" className="ws-icon-btn" onClick={onGoToExplorer} title="Open City Explorer">
            Explorer
          </button>
          <button type="button" className="ws-icon-btn" onClick={onBack} title="Back to Dashboard">
            Back
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel stack-gap-lg city-map-panel">
          <section className="city-map-hero" aria-label="Europe strategic map summary">
            <div className="city-map-hero__copy">
              <p className="city-map-hero__eyebrow">Europe Connectivity Index</p>
              <h3>Urban Strategic Intelligence For Real Relocation Decisions</h3>
              <p>
                Filter transport modes, inspect strategic heat, and compare family mobility with
                city-level resilience and affordability signals in one atlas.
              </p>
            </div>
            <div className="city-map-hero__stats" role="list" aria-label="Strategic quick stats">
              <div role="listitem">
                <strong>{mappableCityOptions.length}</strong>
                <span>Mapped cities</span>
              </div>
              <div role="listitem">
                <strong>{visibleNetworkConnections.length}</strong>
                <span>Visible links</span>
              </div>
              <div role="listitem">
                <strong>{averageFastestTripHours ? formatHoursLabel(averageFastestTripHours) : 'N/A'}</strong>
                <span>Avg fastest trip</span>
              </div>
              <div role="listitem">
                <strong>{Object.values(activeTransportModes).filter(Boolean).length}</strong>
                <span>Modes enabled</span>
              </div>
            </div>
          </section>

          <section className="city-map-ranking-strip" aria-label="Strategic ranking strip">
            {rankingStripRows.map((item) => (
              <button
                type="button"
                className="city-map-ranking-pill"
                key={item.label}
                onClick={() => item.row?.city?.key && onSelectCity(item.row.city.key)}
              >
                <span>{item.label}</span>
                <strong>{item.row?.city?.city ?? 'N/A'}</strong>
                <small>{item.row?.city?.country ?? ''}</small>
              </button>
            ))}
          </section>

          <div className="city-map-toolbar">
            <label className="city-map-toolbar__label" htmlFor="city-map-picker">Focus city</label>
            <select
              id="city-map-picker"
              className="city-map-toolbar__select"
              value={selectedCity?.key ?? ''}
              onChange={(event) => onSelectCity(event.target.value || null)}
            >
              <option value="">Select a city...</option>
              {mappableCityOptions.map((city) => (
                <option key={city.key} value={city.key}>{city.city}, {city.country}</option>
              ))}
            </select>

            <label className="city-map-neighbor-select-wrap" htmlFor="city-map-neighbor-count">
              Nearby links per city
              <select
                id="city-map-neighbor-count"
                className="city-map-toolbar__select city-map-neighbor-select"
                value={nearestNeighborCount}
                onChange={(event) => setNearestNeighborCount(Number(event.target.value))}
              >
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            </label>
          </div>

          <div className="city-map-layer-switches" role="group" aria-label="Map layers">
            <button
              type="button"
              className={`city-map-layer-btn${showLabels ? ' city-map-layer-btn--active' : ''}`}
              onClick={() => setShowLabels((value) => !value)}
              aria-pressed={showLabels}
            >
              Labels
            </button>
            <button
              type="button"
              className={`city-map-layer-btn${showConnections ? ' city-map-layer-btn--active' : ''}`}
              onClick={() => setShowConnections((value) => !value)}
              aria-pressed={showConnections}
            >
              Transport links
            </button>
            <button
              type="button"
              className={`city-map-layer-btn${showHeat ? ' city-map-layer-btn--active' : ''}`}
              onClick={() => setShowHeat((value) => !value)}
              aria-pressed={showHeat}
            >
              Heat zones
            </button>
            <button
              type="button"
              className={`city-map-layer-btn${showIsochrones ? ' city-map-layer-btn--active' : ''}`}
              onClick={() => setShowIsochrones((value) => !value)}
              aria-pressed={showIsochrones}
            >
              Isochrones
            </button>
          </div>

          <div className="city-map-layer-switches" role="group" aria-label="Transport mode filters">
            {Object.entries(TRANSPORT_MODE_META).map(([mode, meta]) => (
              <button
                key={mode}
                type="button"
                className={`city-map-layer-btn${activeTransportModes[mode] ? ' city-map-layer-btn--active' : ''}`}
                onClick={() => setActiveTransportModes((previousModes) => ({
                  ...previousModes,
                  [mode]: !previousModes[mode],
                }))}
                aria-pressed={activeTransportModes[mode]}
              >
                {meta.label}
              </button>
            ))}
          </div>

          <div className="city-map-viewport-controls" role="group" aria-label="Map viewport controls">
            <button type="button" className="city-map-mini-btn" onClick={() => handleZoom('in')}>+</button>
            <button type="button" className="city-map-mini-btn" onClick={() => handleZoom('out')}>-</button>
            <button type="button" className="city-map-mini-btn" onClick={() => handlePan(0, 20)}>↑</button>
            <button type="button" className="city-map-mini-btn" onClick={() => handlePan(0, -20)}>↓</button>
            <button type="button" className="city-map-mini-btn" onClick={() => handlePan(24, 0)}>←</button>
            <button type="button" className="city-map-mini-btn" onClick={() => handlePan(-24, 0)}>→</button>
            <button type="button" className="city-map-mini-btn city-map-mini-btn--reset" onClick={resetViewport}>Reset</button>
          </div>

          <div className="city-map-connectivity-board">
            <div className="city-map-connectivity-board__map">
              {mappableCityOptions.length ? (
                <CityMapCanvas
                  cityOptions={mappableCityOptions}
                  selectedCityKey={selectedCity?.key ?? null}
                  hoveredCityKey={hoveredCityKey}
                  onSelectCity={onSelectCity}
                  onHoverCity={setHoveredCityKey}
                  showLabels={showLabels}
                  showConnections={showConnections}
                  showHeat={showHeat}
                  showIsochrones={showIsochrones}
                  activeTransportModes={activeTransportModes}
                  cityNetworkConnections={cityNetworkConnections}
                  cityDimensionByKey={cityDimensionByKey}
                  topCityRankByKey={topCityRankByKey}
                  zoom={zoom}
                  pan={pan}
                />
              ) : (
                <div className="city-map-selection city-map-selection--empty">Map is unavailable until city coordinates are loaded.</div>
              )}
            </div>
          </div>

          <section className="city-map-intel-grid">
            <article className="city-map-selection city-map-selection--intel">
              <p className="city-map-selection__eyebrow">If You Move Here...</p>
              {focusCity && focusDimensions ? (
                <>
                  <h4>{focusCity.city}, {focusCity.country}</h4>
                  <div className="city-map-intel-metrics">
                    <span>{focusDimensions.countriesReachableByRail} countries reachable by rail in one day</span>
                    <span>{focusDimensions.carFreeErrands}% errands can be done car-free</span>
                    <span>{focusDimensions.commuteMinutes} min average commute</span>
                    <span>{focusDimensions.pediatricClinics} pediatric clinics in metro area</span>
                    <span>{focusDimensions.greenCoverage}% urban green coverage</span>
                  </div>
                  {focusNeighborhoods.length > 0 && (
                    <ul className="city-map-intel-neighborhoods">
                      {focusNeighborhoods.map((profile) => (
                        <li key={profile.name}>
                          <strong>{profile.name}</strong>
                          <small>{profile.note}</small>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <span>Select a city to open relocation intelligence.</span>
              )}
            </article>

            <article className="city-map-selection city-map-selection--routes" aria-label="Nearest city routes">
              <strong className="city-map-selection__headline">Closest strategic alternatives</strong>
              {focusConnections.length > 0 ? (
                <ul className="city-map-route-list">
                  {focusConnections.map(({ city, distanceKm, modes, travelHoursByMode, fastestMode }) => (
                    <li key={city.key}>
                      <button type="button" onClick={() => onSelectCity(city.key)}>
                        <span>{city.city}, {city.country}</span>
                        <small>
                          {formatDistance(distanceKm)}
                          {' · '}
                          {modes.map((mode) => TRANSPORT_MODE_META[mode].shortLabel).join('/')}
                          {' · fastest '}
                          {TRANSPORT_MODE_META[fastestMode].shortLabel}
                          {' '}
                          {formatHoursLabel(travelHoursByMode[fastestMode])}
                        </small>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <span>Select a city to reveal nearest relocation alternatives.</span>
              )}
            </article>
          </section>

          <section className="city-map-top-grid" aria-label="Strategic city cards">
            {connectivityRanking.slice(0, 6).map((networkRow, index) => {
              const city = mappableCityOptions.find((candidate) => candidate.key === networkRow.key);
              if (!city) {
                return null;
              }
              const dimensions = cityDimensionByKey.get(city.key);
              if (!dimensions) {
                return null;
              }

              return (
                <StrategicCityCard
                  key={city.key}
                  city={city}
                  dimensions={dimensions}
                  networkRow={networkRow}
                  rank={index + 1}
                  onOpen={() => onSelectCity(city.key)}
                />
              );
            })}
          </section>
        </section>
      </main>
    </div>
  );
};
