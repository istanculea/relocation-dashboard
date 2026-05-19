import { useEffect, useMemo, useState } from 'react';
import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesTopology from 'world-atlas/countries-110m.json';
import { cityGeoData, projectGeoPoint } from '../data/cityGeoData.js';
import { getNeighborhoodProfiles } from '../data/neighborhoodProfiles.js';

const VIEWBOX_WIDTH = 1180;
const VIEWBOX_HEIGHT = 760;
const OVERLAY_OFFSETS = [
  { dx: 38, dy: -26 },
  { dx: -42, dy: -16 },
  { dx: 24, dy: 34 },
];

const EUROPE_EXTENTS = {
  minLon: -25,
  maxLon: 45,
  minLat: 34,
  maxLat: 72,
};

const GRID_LATS = [38, 42, 46, 50, 54];
const GRID_LONS = [-8, -2, 4, 10, 16, 22, 28];
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
        featureIndex: index,
        d: pathBuilder(countryFeature),
      }))
      .filter((pathEntry) => Boolean(pathEntry.d)),
  };
};

const MAIN_EUROPE_MAP = createEuropeMapGeometry(VIEWBOX_WIDTH, VIEWBOX_HEIGHT, 26);
const MINI_MAP_WIDTH = 280;
const MINI_MAP_HEIGHT = 156;
const MINI_EUROPE_MAP = createEuropeMapGeometry(MINI_MAP_WIDTH, MINI_MAP_HEIGHT, 10);

const createCityFocusedMapGeometry = (cityGeo, width, height, padding = 10) => {
  const lonSpan = 18;
  const latSpan = 12;
  const focusBounds = {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [cityGeo.lon - lonSpan / 2, cityGeo.lat - latSpan / 2],
        [cityGeo.lon + lonSpan / 2, cityGeo.lat - latSpan / 2],
        [cityGeo.lon + lonSpan / 2, cityGeo.lat + latSpan / 2],
        [cityGeo.lon - lonSpan / 2, cityGeo.lat + latSpan / 2],
        [cityGeo.lon - lonSpan / 2, cityGeo.lat - latSpan / 2],
      ]],
    },
  };
  const mapProjection = geoMercator()
    .fitExtent(
      [[padding, padding], [width - padding, height - padding]],
      focusBounds,
    );
  const pathBuilder = geoPath(mapProjection);

  return {
    projection: mapProjection,
    paths: europeCountryFeatures
      .map((countryFeature, index) => ({
        key: `city-country-${index}`,
        featureIndex: index,
        d: pathBuilder(countryFeature),
      }))
      .filter((pathEntry) => Boolean(pathEntry.d)),
  };
};

const findClosestCountryFeatureIndex = (cityGeo) => {
  let closestFeatureIndex = null;
  let minDistance = Number.POSITIVE_INFINITY;

  europeCountryFeatures.forEach((countryFeature, featureIndex) => {
    const [centroidLon, centroidLat] = geoCentroid(countryFeature);
    const distance = computeDistanceKm(cityGeo, { lat: centroidLat, lon: centroidLon });

    if (distance < minDistance) {
      minDistance = distance;
      closestFeatureIndex = featureIndex;
    }
  });

  return closestFeatureIndex;
};

const projectEuropePoint = (geo, mapGeometry, width, height) => {
  const projected = mapGeometry.projection([geo.lon, geo.lat]);

  if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
    return { x: projected[0], y: projected[1] };
  }

  return projectGeoPoint(geo, width, height);
};

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

const getScoreValue = (city) => {
  if (Number.isFinite(city?.activeWeightedScore)) {
    return city.activeWeightedScore;
  }

  if (Number.isFinite(city?.weightedScore)) {
    return city.weightedScore;
  }

  return Number.isFinite(city?.score) ? city.score : 0;
};

const getScoreTier = (score) => {
  if (score >= 7.6) {
    return 'standout';
  }
  if (score >= 7.2) {
    return 'strong';
  }
  if (score >= 6.8) {
    return 'solid';
  }
  return 'watch';
};

const formatDistance = (distanceKm) => `${Math.round(distanceKm).toLocaleString()} km`;

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
    connectivityScore: Number(((entry.weightedScore / maxScore) * 72).toFixed(1)),
    modeCount: entry.modes.size,
  }));
};

const MapViewportControls = function mapViewportControls({
  onZoomIn,
  onZoomOut,
  onReset,
  onPanLeft,
  onPanRight,
  onPanUp,
  onPanDown,
}) {
  return (
    <div className="city-map-viewport-controls" role="group" aria-label="Map viewport controls">
      <button type="button" className="city-map-mini-btn" onClick={onZoomIn}>+</button>
      <button type="button" className="city-map-mini-btn" onClick={onZoomOut}>-</button>
      <button type="button" className="city-map-mini-btn" onClick={onPanUp}>↑</button>
      <button type="button" className="city-map-mini-btn" onClick={onPanDown}>↓</button>
      <button type="button" className="city-map-mini-btn" onClick={onPanLeft}>←</button>
      <button type="button" className="city-map-mini-btn" onClick={onPanRight}>→</button>
      <button type="button" className="city-map-mini-btn city-map-mini-btn--reset" onClick={onReset}>Reset</button>
    </div>
  );
};

const CityMapLegend = function cityMapLegend() {
  const items = [
    { key: 'standout', label: 'Standout score', score: '≥ 7.6' },
    { key: 'strong', label: 'Strong fit', score: '7.2 - 7.59' },
    { key: 'solid', label: 'Solid fit', score: '6.8 - 7.19' },
    { key: 'watch', label: 'Watchlist', score: '< 6.8' },
  ];

  return (
    <div className="city-map-legend" role="list" aria-label="Map legend">
      {items.map((item) => (
        <div key={item.key} className="city-map-legend__item" role="listitem">
          <span className={`city-map-legend__dot city-map-legend__dot--${item.key}`} aria-hidden="true" />
          <span className="city-map-legend__text">
            <strong>{item.label}</strong>
            <small>{item.score}</small>
          </span>
        </div>
      ))}
    </div>
  );
};

const ConnectivityMiniMap = function connectivityMiniMap({ cityKey, cityLabel }) {
  const geo = cityGeoData[cityKey];
  const miniMapGeometry = useMemo(
    () => (geo ? createCityFocusedMapGeometry(geo, MINI_MAP_WIDTH, MINI_MAP_HEIGHT, 10) : MINI_EUROPE_MAP),
    [geo],
  );
  const point = geo ? projectEuropePoint(geo, miniMapGeometry, MINI_MAP_WIDTH, MINI_MAP_HEIGHT) : null;
  const highlightedFeatureIndex = useMemo(
    () => (geo ? findClosestCountryFeatureIndex(geo) : null),
    [geo],
  );

  return (
    <svg
      className="city-map-mini-svg"
      viewBox={`0 0 ${MINI_MAP_WIDTH} ${MINI_MAP_HEIGHT}`}
      role="img"
      aria-label="Mini map preview"
    >
      <rect x="0" y="0" width={MINI_MAP_WIDTH} height={MINI_MAP_HEIGHT} rx="10" />
      <g className="city-map-mini-svg__countries">
        {miniMapGeometry.paths.map((countryPath) => (
          <path
            key={countryPath.key}
            className={countryPath.featureIndex === highlightedFeatureIndex ? 'city-map-mini-svg__country--active' : ''}
            d={countryPath.d}
          />
        ))}
      </g>
      {point && (
        <g className="city-map-mini-svg__city">
          <circle cx={point.x} cy={point.y} r="6" />
          <circle cx={point.x} cy={point.y} r="11" />
        </g>
      )}
      {point && (
        <text className="city-map-mini-svg__label" x="10" y={MINI_MAP_HEIGHT - 10}>
          {cityLabel}
        </text>
      )}
    </svg>
  );
};

const ConnectivityCard = function connectivityCard({ cityRow, rank, onOpen }) {
  return (
    <article className="city-map-connectivity-tile">
      <div className="city-map-connectivity-tile__header">
        <div>
          <h5>{cityRow.city}</h5>
          <p>{cityRow.country}</p>
        </div>
        <span className="city-map-connectivity-tile__rank">{rank}</span>
      </div>

      <ConnectivityMiniMap cityKey={cityRow.key} cityLabel={cityRow.city} />

      <dl className="city-map-connectivity-tile__metrics">
        <div>
          <dt>Transport links</dt>
          <dd>{cityRow.links}</dd>
        </div>
        <div>
          <dt>Mode diversity</dt>
          <dd>{cityRow.modeCount}</dd>
        </div>
        <div>
          <dt>Avg fastest trip</dt>
          <dd>{cityRow.avgFastestHours ? formatHoursLabel(cityRow.avgFastestHours) : 'N/A'}</dd>
        </div>
      </dl>

      <button
        type="button"
        className="city-map-connectivity-tile__cta"
        onClick={onOpen}
      >
        Connectivity score {cityRow.connectivityScore}
      </button>
    </article>
  );
};

const CityMapCanvas = function cityMapCanvas({
  cityOptions,
  selectedCityKey,
  hoveredCityKey,
  onSelectCity,
  onHoverCity,
  showLabels,
  showConnections,
  showNeighborhoods,
  activeTransportModes,
  cityNetworkConnections,
  topCityRankByKey,
  zoom,
  pan,
}) {
  const selectedGeo = selectedCityKey ? cityGeoData[selectedCityKey] : null;
  const selectedCity = cityOptions.find((city) => city.key === selectedCityKey) ?? null;
  const selectedPoint = selectedGeo
    ? projectEuropePoint(selectedGeo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT)
    : null;
  const overlays = selectedCity
    ? getNeighborhoodProfiles(selectedCity.key).slice(0, 3)
    : [];
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
        aria-label="Map of shortlisted relocation cities in Europe"
      >
        <defs>
          <linearGradient id="cityMapBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dce8f2" />
            <stop offset="40%" stopColor="#e6f1f1" />
            <stop offset="100%" stopColor="#f7efe0" />
          </linearGradient>
          <radialGradient id="cityMapGlow" cx="0.5" cy="0.4" r="0.7">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.85)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
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

            return (
              <line key={`lat-${lat}`} x1="0" y1={y} x2={VIEWBOX_WIDTH} y2={y} />
            );
          })}
          {GRID_LONS.map((lon) => {
            const x = projectEuropePoint({ lat: 48, lon }, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT).x;

            return (
              <line key={`lon-${lon}`} x1={x} y1="0" x2={x} y2={VIEWBOX_HEIGHT} />
            );
          })}
        </g>
        <g className="city-map-viewport" transform={viewportTransform} clipPath="url(#cityMapClip)">
          <g className="city-map-regions" aria-label="Europe regional backdrop">
            {MAIN_EUROPE_MAP.paths.map((countryPath) => (
              <path key={countryPath.key} d={countryPath.d} className="city-map-region" />
            ))}
          </g>

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
                const midX = (fromPoint.x + toPoint.x) / 2;
                const midY = (fromPoint.y + toPoint.y) / 2;
                const lineLength = Math.hypot(toPoint.x - fromPoint.x, toPoint.y - fromPoint.y);
                const showTimeLabel = lineLength > 86;

                return (
                  <g key={connection.key}>
                    <line
                      className={`city-map-network__line city-map-network__line--${connection.primaryMode}${isSelectedEdge ? ' city-map-network__line--selected' : ''}${isHoveredEdge ? ' city-map-network__line--hover' : ''}`}
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={toPoint.x}
                      y2={toPoint.y}
                    >
                      <title>
                        {`${connection.fromCity.city} ⇄ ${connection.toCity.city} • ${formatDistance(connection.distanceKm)} • fastest ${TRANSPORT_MODE_META[connection.fastestMode].label.toLowerCase()} (${formatHoursLabel(connection.travelHoursByMode[connection.fastestMode])}) • ${connection.modeTimeLabel}`}
                      </title>
                    </line>
                    {showTimeLabel && (
                      <text
                        className={`city-map-network__label${isSelectedEdge ? ' city-map-network__label--selected' : ''}`}
                        x={midX}
                        y={midY - 5}
                        textAnchor="middle"
                      >
                        {connection.modeTimeLabel}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          )}

          {selectedGeo && showNeighborhoods && overlays.length > 0 && (
            <g className="city-map-overlays" aria-label="Neighborhood overlays">
              {overlays.map((overlay, index) => {
                const offset = OVERLAY_OFFSETS[index % OVERLAY_OFFSETS.length];
                const x = selectedPoint.x + offset.dx;
                const y = selectedPoint.y + offset.dy;

                return (
                  <g key={overlay.name} className="city-map-overlay">
                    <circle cx={x} cy={y} r="24" />
                    <text x={x} y={y + 4} textAnchor="middle">{overlay.name}</text>
                  </g>
                );
              })}
            </g>
          )}

          {sortedCityOptions.map((city) => {
            const geo = cityGeoData[city.key];
            if (!geo) {
              return null;
            }

            const point = projectEuropePoint(geo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
            const score = getScoreValue(city);
            const pointRadius = clampValue(5.5 + (score - 6.2) * 2.1, 5.5, 12);
            const isActive = city.key === selectedCityKey;
            const isHovered = city.key === hoveredCityKey;
            const tier = getScoreTier(score);

            return (
              <g
                key={city.key}
                className={`city-map-point city-map-point--${tier}${isActive ? ' city-map-point--active' : ''}${isHovered ? ' city-map-point--hover' : ''}`}
                onClick={() => onSelectCity(city.key)}
                onMouseEnter={() => onHoverCity(city.key)}
                onMouseLeave={() => onHoverCity(null)}
                role="button"
                tabIndex={0}
                aria-label={`${city.city}, ${city.country}. Score ${score.toFixed(2)}.`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelectCity(city.key);
                  }
                }}
              >
                <title>{`${city.city}, ${city.country} • Score ${score.toFixed(2)}`}</title>
                <circle cx={point.x} cy={point.y} r={isActive ? pointRadius + 2 : pointRadius} />
                {showLabels && <text x={point.x + pointRadius + 5} y={point.y + 4}>{city.city}</text>}
                {topCityRankByKey.has(city.key) && (
                  <g className="city-map-rank-pin" aria-hidden="true">
                    <circle cx={point.x - pointRadius - 8} cy={point.y - pointRadius - 8} r="9" />
                    <text x={point.x - pointRadius - 8} y={point.y - pointRadius - 5} textAnchor="middle">
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
  const [showNeighborhoods, setShowNeighborhoods] = useState(true);
  const [nearestNeighborCount, setNearestNeighborCount] = useState(3);
  const [activeTransportModes, setActiveTransportModes] = useState({
    road: true,
    rail: true,
    air: true,
  });
  const [hoveredCityKey, setHoveredCityKey] = useState(null);
  const [detailCityKey, setDetailCityKey] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const mappableCityOptions = cityOptions.filter((city) => cityGeoData[city.key]);
  const missingGeoCount = Math.max(0, cityOptions.length - mappableCityOptions.length);
  const selectedCityKey = selectedCity?.key ?? null;
  const focusCityKey = hoveredCityKey ?? selectedCityKey;
  const focusCity = focusCityKey
    ? mappableCityOptions.find((city) => city.key === focusCityKey) ?? null
    : null;
  const detailCity = detailCityKey
    ? mappableCityOptions.find((city) => city.key === detailCityKey) ?? null
    : null;
  const selectedConnections = useMemo(
    () => buildCityConnections(mappableCityOptions, selectedCityKey, 6),
    [mappableCityOptions, selectedCityKey],
  );
  const detailConnections = useMemo(
    () => buildCityConnections(mappableCityOptions, detailCityKey, 7),
    [mappableCityOptions, detailCityKey],
  );
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
  const mappedCountriesCount = useMemo(
    () => new Set(mappableCityOptions.map((city) => city.country)).size,
    [mappableCityOptions],
  );
  const connectivityRanking = useMemo(
    () => buildConnectivityRanking(mappableCityOptions, visibleNetworkConnections, 10),
    [mappableCityOptions, visibleNetworkConnections],
  );
  const topCityRankByKey = useMemo(
    () => new Map(connectivityRanking.map((cityRow, index) => [cityRow.key, index + 1])),
    [connectivityRanking],
  );
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
  const enabledModeCount = Object.values(activeTransportModes).filter(Boolean).length;

  const focusScore = getScoreValue(focusCity);
  const focusTier = focusCity ? getScoreTier(focusScore) : null;

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

  const handleSelectCity = (cityKey) => {
    onSelectCity(cityKey);
    if (cityKey) {
      setDetailCityKey(cityKey);
    }
  };

  const closeDetailDrawer = () => {
    setDetailCityKey(null);
  };

  useEffect(() => {
    if (!detailCity) {
      return undefined;
    }

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeDetailDrawer();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [detailCity]);

  return (
    <div className="app-shell explorer-page-shell">
      <header className="ws-header">
        <div className="ws-header__brand">
          <span className="ws-header__title">City Geographic Map</span>
          <span className="ws-header__subtitle">Phase 1 · City points across Europe</span>
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
            ← Dashboard
          </button>
        </div>
      </header>

      <main className="dashboard">
        <section className="panel stack-gap-lg city-map-panel">
          <section className="city-map-hero" aria-label="Connectivity map summary">
            <div className="city-map-hero__copy">
              <p className="city-map-hero__eyebrow">Europe Connectivity Atlas</p>
              <h3>The Most Connected Cities Across Europe</h3>
              <p>
                Interactive real-Europe basemap with transport links, travel-time intelligence,
                and ranked urban connectivity cards.
              </p>
            </div>
            <div className="city-map-hero__stats" role="list" aria-label="Connectivity quick stats">
              <div role="listitem">
                <strong>{mappableCityOptions.length}</strong>
                <span>Mapped cities</span>
              </div>
              <div role="listitem">
                <strong>{visibleNetworkConnections.length}</strong>
                <span>Visible links</span>
              </div>
              <div role="listitem">
                <strong>{enabledModeCount}</strong>
                <span>Modes enabled</span>
              </div>
              <div role="listitem">
                <strong>{averageFastestTripHours ? formatHoursLabel(averageFastestTripHours) : 'N/A'}</strong>
                <span>Avg fastest trip</span>
              </div>
            </div>
          </section>

          <div className="city-map-toolbar">
            <label className="city-map-toolbar__label" htmlFor="city-map-picker">City selector</label>
            <select
              id="city-map-picker"
              className="city-map-toolbar__select"
              value={selectedCity?.key ?? ''}
              onChange={(event) => handleSelectCity(event.target.value || null)}
            >
              <option value="">Select a city...</option>
              {mappableCityOptions.map((city) => (
                <option key={city.key} value={city.key}>{city.city}, {city.country}</option>
              ))}
            </select>
            <span className="city-map-toolbar__meta">
              {mappableCityOptions.length} mapped city points
              {missingGeoCount > 0 ? ` · ${missingGeoCount} pending coordinates` : ''}
              {` · ${mappedCountriesCount} countries`}
            </span>
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
              Connections
            </button>
            <button
              type="button"
              className={`city-map-layer-btn${showNeighborhoods ? ' city-map-layer-btn--active' : ''}`}
              onClick={() => setShowNeighborhoods((value) => !value)}
              aria-pressed={showNeighborhoods}
            >
              Neighborhoods
            </button>
            <span className="city-map-overlay-hint">
              City marker size reflects score. Color reflects strategic tier.
            </span>
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

            <span className="city-map-overlay-hint">
              {visibleNetworkConnections.length} visible network links
            </span>
          </div>

          <CityMapLegend />

          <MapViewportControls
            onZoomIn={() => handleZoom('in')}
            onZoomOut={() => handleZoom('out')}
            onReset={resetViewport}
            onPanLeft={() => handlePan(24, 0)}
            onPanRight={() => handlePan(-24, 0)}
            onPanUp={() => handlePan(0, 20)}
            onPanDown={() => handlePan(0, -20)}
          />

          <div className="city-map-connectivity-board">
            <div className="city-map-connectivity-board__map">
              {mappableCityOptions.length ? (
                <CityMapCanvas
                  cityOptions={mappableCityOptions}
                  selectedCityKey={selectedCity?.key ?? null}
                  hoveredCityKey={hoveredCityKey}
                  onSelectCity={handleSelectCity}
                  onHoverCity={setHoveredCityKey}
                  showLabels={showLabels}
                  showConnections={showConnections}
                  showNeighborhoods={showNeighborhoods}
                  activeTransportModes={activeTransportModes}
                  cityNetworkConnections={cityNetworkConnections}
                  topCityRankByKey={topCityRankByKey}
                  zoom={zoom}
                  pan={pan}
                />
              ) : (
                <div className="city-map-selection city-map-selection--empty">Map is unavailable until city coordinates are loaded.</div>
              )}
            </div>
          </div>

          <section className="city-map-top-grid" aria-label="Top connected city cards">
            {connectivityRanking.map((cityRow, index) => (
              <ConnectivityCard
                key={cityRow.key}
                cityRow={cityRow}
                rank={index + 1}
                onOpen={() => handleSelectCity(cityRow.key)}
              />
            ))}
          </section>

          {detailCity && (
            <div className="city-map-drawer-backdrop" role="presentation" onClick={closeDetailDrawer}>
              <aside
                className="city-map-drawer"
                role="dialog"
                aria-modal="true"
                aria-label={`${detailCity.city} connectivity details`}
                onClick={(event) => event.stopPropagation()}
              >
                <header className="city-map-drawer__header">
                  <div>
                    <p>Connectivity dossier</p>
                    <h4>{detailCity.city}, {detailCity.country}</h4>
                  </div>
                  <button type="button" className="city-map-drawer__close" onClick={closeDetailDrawer}>Close</button>
                </header>

                <div className="city-map-drawer__body">
                  <ConnectivityMiniMap cityKey={detailCity.key} cityLabel={detailCity.city} />

                  <div className="city-map-drawer__meta">
                    <span>Score {getScoreValue(detailCity).toFixed(2)}</span>
                    <span>PM2.5 {Number.isFinite(detailCity.pm25) ? detailCity.pm25.toFixed(1) : 'N/A'}</span>
                    <span>Verified sections {detailCity.verifiedCount ?? 0}</span>
                    <span>Midpoint budget €{Math.round(detailCity.scenarioBudget ?? 0).toLocaleString()}</span>
                  </div>

                  <h5>Closest city connections</h5>
                  <ul className="city-map-drawer__links">
                    {detailConnections.map((connection) => (
                      <li key={connection.city.key}>
                        <span>{connection.city.city}, {connection.city.country}</span>
                        <small>{formatDistance(connection.distanceKm)} · {buildModeTimeLabel(connection.travelHoursByMode, connection.modes)}</small>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            </div>
          )}

          <div className="city-map-intel-grid">
            <article className="city-map-selection">
              {focusCity
                ? `${focusCity.city}, ${focusCity.country} ${hoveredCityKey ? 'highlighted' : 'selected'}`
                : 'No city selected'}
              {focusCity && (
                <>
                  <strong className="city-map-selection__headline">Score {focusScore.toFixed(2)} · {focusTier}</strong>
                  <span>Monthly midpoint budget: €{Math.round(focusCity.scenarioBudget ?? 0).toLocaleString()}</span>
                  <span>PM2.5 annual average: {Number.isFinite(focusCity.pm25) ? focusCity.pm25.toFixed(1) : 'N/A'}</span>
                  <span>Verified sections: {focusCity.verifiedCount ?? 0}</span>
                </>
              )}
            </article>

            <article className="city-map-selection city-map-selection--routes" aria-label="Nearest city routes">
              <strong className="city-map-selection__headline">Nearest city links</strong>
              {selectedConnections.length > 0 ? (
                <ul className="city-map-route-list">
                  {selectedConnections.map(({ city, distanceKm, modes, primaryMode, travelHoursByMode, fastestMode }) => {
                    const modeLabels = modes.map((mode) => TRANSPORT_MODE_META[mode].shortLabel).join('/');
                    const modeTimeLabel = buildModeTimeLabel(travelHoursByMode, modes);

                    return (
                      <li key={city.key}>
                        <button type="button" onClick={() => handleSelectCity(city.key)}>
                          <span>{city.city}, {city.country}</span>
                          <small>{formatDistance(distanceKm)} · {modeLabels} · primary {TRANSPORT_MODE_META[primaryMode].label.toLowerCase()} · fastest {TRANSPORT_MODE_META[fastestMode].shortLabel} {formatHoursLabel(travelHoursByMode[fastestMode])}</small>
                          <small>{modeTimeLabel}</small>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <span>Select a city to reveal nearest relocation alternatives.</span>
              )}
            </article>
          </div>
        </section>
      </main>
    </div>
  );
};
