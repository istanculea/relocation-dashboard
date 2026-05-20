import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesTopology from 'world-atlas/countries-110m.json';
import { cityGeoData, projectGeoPoint } from '../data/cityGeoData.js';
import { strategicBalanceWeights } from '../data/dashboardConfig.js';

export const VIEWBOX_WIDTH = 1180;
export const VIEWBOX_HEIGHT = 760;

const EUROPE_EXTENTS = {
  minLon: -25,
  maxLon: 45,
  minLat: 34,
  maxLat: 72,
};

export const GRID_LATS = [38, 42, 46, 50, 54, 58, 62];
export const GRID_LONS = [-8, -2, 4, 10, 16, 22, 28, 34];

export const TRANSPORT_MODE_META = {
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

export const clampValue = (value, min, max) => Math.max(min, Math.min(max, value));

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

export const MAIN_EUROPE_MAP = createEuropeMapGeometry(VIEWBOX_WIDTH, VIEWBOX_HEIGHT, 26);

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

export const projectEuropePoint = (geo, mapGeometry, width, height) => {
  const projected = mapGeometry.projection([geo.lon, geo.lat]);

  if (projected && Number.isFinite(projected[0]) && Number.isFinite(projected[1])) {
    return { x: projected[0], y: projected[1] };
  }

  return projectGeoPoint(geo, width, height);
};

export const getScoreValue = (city) => {
  if (Number.isFinite(city?.activeWeightedScore)) {
    return city.activeWeightedScore;
  }
  if (Number.isFinite(city?.weightedScore)) {
    return city.weightedScore;
  }
  return Number.isFinite(city?.score) ? city.score : 0;
};

export const formatHoursLabel = (hoursValue) => {
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

export const formatDistance = (distanceKm) => `${Math.round(distanceKm).toLocaleString()} km`;

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

export const buildCityConnections = (cityOptions, selectedCityKey, maxConnections = 4) => {
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

export const buildCityNetworkConnections = (cityOptions, nearestCount = 3) => {
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

export const buildConnectivityRanking = (cityOptions, networkConnections, topN = 5) => {
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

export const STRATEGIC_MODES = {
  familyStability: {
    label: 'Family Stability',
    detail: 'Prioritises childcare, healthcare, safety, green space, and a lighter commute burden.',
    weights: {
      familyReadiness: 0.28,
      healthcare: 0.20,
      safety: 0.18,
      greenSpace: 0.12,
      commuteEfficiency: 0.12,
      accessibility: 0.06,
      affordability: 0.04,
    },
  },
  careerAcceleration: {
    label: 'Career Acceleration',
    detail: 'Prioritises business mobility, connectivity, airport reach, and infrastructure reliability.',
    weights: {
      businessMobility: 0.22,
      connectivity: 0.20,
      airportReach: 0.16,
      railIntegration: 0.14,
      infrastructure: 0.12,
      digitalization: 0.10,
      commuteEfficiency: 0.06,
    },
  },
  climateResilience: {
    label: 'Climate Resilience',
    detail: 'Prioritises long-term resilience, climate comfort, green space, and urban stability.',
    weights: {
      resilience: 0.26,
      climateComfort: 0.20,
      greenSpace: 0.16,
      safety: 0.12,
      commuteEfficiency: 0.10,
      infrastructure: 0.08,
      urbanCalm: 0.08,
    },
  },
  carFreeLifestyle: {
    label: 'Car-Free Lifestyle',
    detail: 'Prioritises walkability, transit reach, accessibility, and a low car-need daily rhythm.',
    weights: {
      mobility: 0.24,
      walkability: 0.18,
      accessibility: 0.16,
      railIntegration: 0.14,
      commuteEfficiency: 0.12,
      safety: 0.08,
      urbanCalm: 0.08,
    },
  },
  highSavingsPotential: {
    label: 'High Savings Potential',
    detail: 'Prioritises affordability, housing pressure, administrative efficiency, and low friction.',
    weights: {
      affordability: 0.24,
      housing: 0.22,
      adminEase: 0.14,
      commuteEfficiency: 0.12,
      resilience: 0.08,
      safety: 0.08,
      socialEase: 0.06,
      connectivity: 0.06,
    },
  },
  crossEuropeMobility: {
    label: 'Cross-Europe Mobility',
    detail: 'Prioritises rail integration, airport reach, multimodal transport, and continental leverage.',
    weights: {
      connectivity: 0.24,
      railIntegration: 0.20,
      airportReach: 0.18,
      mobility: 0.14,
      infrastructure: 0.10,
      businessMobility: 0.08,
      commuteEfficiency: 0.06,
    },
  },
  remoteSlowLiving: {
    label: 'Remote Slow Living',
    detail: 'Prioritises urban calm, affordability, green space, climate comfort, and daily ease.',
    weights: {
      urbanCalm: 0.22,
      greenSpace: 0.18,
      affordability: 0.16,
      safety: 0.12,
      climateComfort: 0.10,
      socialEase: 0.08,
      commuteEfficiency: 0.08,
      walkability: 0.06,
    },
  },
};

export const PERSONA_PROFILES = {
  remoteITEngineer: {
    label: 'Remote IT / Engineer',
    tone: 'Optimized for high-efficiency remote work and continental mobility.',
    weights: {
      connectivity: 0.20,
      digitalization: 0.18,
      railIntegration: 0.16,
      airportReach: 0.14,
      infrastructure: 0.14,
      commuteEfficiency: 0.08,
      businessMobility: 0.06,
      socialEase: 0.04,
    },
  },
  internationalFamily: {
    label: 'International Family',
    tone: 'Focused on long-term stability, healthy urban living, and family logistics.',
    weights: {
      familyReadiness: 0.26,
      safety: 0.16,
      greenSpace: 0.14,
      accessibility: 0.12,
      healthcare: 0.12,
      commuteEfficiency: 0.10,
      walkability: 0.06,
      housing: 0.04,
    },
  },
  psychologistPsychotherapist: {
    label: 'Psychologist / Psychotherapist',
    tone: 'Prioritizes emotional sustainability, healthy rhythm, and long-term well-being.',
    weights: {
      urbanCalm: 0.22,
      healthcare: 0.18,
      socialEase: 0.14,
      greenSpace: 0.12,
      affordability: 0.12,
      commuteEfficiency: 0.10,
      safety: 0.08,
      digitalization: 0.04,
    },
  },
  startupFounder: {
    label: 'Startup Founder',
    tone: 'Built for business mobility, talent access, and operational scalability.',
    weights: {
      businessMobility: 0.22,
      connectivity: 0.18,
      airportReach: 0.16,
      digitalization: 0.14,
      infrastructure: 0.12,
      mobility: 0.08,
      affordability: 0.05,
      adminEase: 0.05,
    },
  },
  freelancer: {
    label: 'Freelancer',
    tone: 'Optimized for flexible independent living with balanced cost and lifestyle quality.',
    weights: {
      affordability: 0.22,
      housing: 0.16,
      urbanCalm: 0.14,
      walkability: 0.12,
      socialEase: 0.10,
      greenSpace: 0.10,
      digitalization: 0.08,
      commuteEfficiency: 0.08,
    },
  },
};

const CITY_DNA = {
  bilbao: 'Compact civic city with strong family rhythm, pragmatic mobility, and a grounded Atlantic feel.',
  bucharest: 'High-velocity capital with a sharp cost advantage, strong potential, and meaningful daily friction.',
  bologna: 'Dense civic city balancing university energy, healthcare access, and manageable everyday routines.',
  lugo: 'Small-scale provincial city with quieter rhythms, low-cost stability, and a slower civic pulse.',
  milan: 'High-intensity continental gateway optimized for business mobility, talent access, and European reach.',
  reggioEmilia: 'Quietly efficient family city with low-friction routines and a strong local stability profile.',
  cologne: 'International Rhine hub with broad opportunity, a relaxed social tone, and strong transport depth.',
  valencia: 'Mediterranean balance city prioritising affordability, daylight, and a slower urban rhythm.',
  vienna: 'Institutionally stable family-oriented capital with exceptional infrastructure reliability and civic polish.',
};

const SIGNAL_LABELS = {
  familyReadiness: 'Family readiness',
  healthcare: 'Healthcare',
  safety: 'Safety',
  greenSpace: 'Green space',
  commuteEfficiency: 'Commute efficiency',
  connectivity: 'Connectivity',
  mobility: 'Mobility',
  affordability: 'Affordability',
  housing: 'Housing pressure',
  resilience: 'Resilience',
  accessibility: 'Accessibility',
  infrastructure: 'Infrastructure',
  railIntegration: 'Rail integration',
  airportReach: 'Airport reach',
  digitalization: 'Digital administration',
  adminEase: 'Administrative ease',
  urbanCalm: 'Urban calm',
  economicMomentum: 'Economic momentum',
  businessMobility: 'Business mobility',
  socialEase: 'Social ease',
  climateComfort: 'Climate comfort',
  walkability: 'Walkability',
  frictionEase: 'Daily friction ease',
};

const CONTRAST_PHRASES = {
  familyReadiness: 'stronger family infrastructure',
  healthcare: 'better healthcare access',
  safety: 'higher day-to-day safety',
  greenSpace: 'more green-space breathing room',
  commuteEfficiency: 'lighter commute burden',
  connectivity: 'stronger continental connectivity',
  mobility: 'more flexible multimodal mobility',
  affordability: 'lower housing pressure',
  housing: 'less housing pressure',
  resilience: 'more resilient long-term profile',
  accessibility: 'easier daily access',
  infrastructure: 'stronger infrastructure quality',
  railIntegration: 'better rail integration',
  airportReach: 'wider airport reach',
  digitalization: 'more digital administration',
  adminEase: 'lighter administrative load',
  urbanCalm: 'quieter daily rhythm',
  economicMomentum: 'stronger economic momentum',
  businessMobility: 'faster business mobility',
  socialEase: 'easier social soft landing',
  climateComfort: 'better climate comfort',
  walkability: 'better walkability',
  frictionEase: 'less hidden friction',
};

export const describeScoreBand = (score) => {
  if (score >= 8.6) {
    return 'Exceptional';
  }
  if (score >= 7.2) {
    return 'Strong';
  }
  if (score >= 5.8) {
    return 'Balanced';
  }
  if (score >= 4.4) {
    return 'Mixed';
  }
  return 'Fragile';
};

const firstSentence = (text) => {
  if (typeof text !== 'string' || text.trim().length === 0) {
    return '';
  }

  return text.trim().match(/^[^.!?]+[.!?]?/)?.[0] ?? text.trim();
};

const scoreFromKeywords = (text, keywordPairs, fallback = 6) => {
  const normalized = String(text ?? '').toLowerCase();

  for (const [needle, score] of keywordPairs) {
    if (normalized.includes(needle)) {
      return score;
    }
  }

  return fallback;
};

const parseBureaucracyScore = (text) => {
  if (typeof text !== 'string') {
    return null;
  }

  const match = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  return match ? Number(match[1]) : null;
};

const parseDigitalizationScore = (text) => scoreFromKeywords(text, [
  ['very high', 9.0],
  ['medium-high', 7.8],
  ['high', 8.6],
  ['medium-low', 5.1],
  ['medium', 6.2],
  ['low', 4.0],
], 6.0);

const parseNarrativeEaseScore = (text) => scoreFromKeywords(text, [
  ['easier socially', 8.8],
  ['open, social', 8.7],
  ['well-established', 8.4],
  ['good fit', 8.1],
  ['manageable', 7.2],
  ['workable', 7.0],
  ['used to international', 7.8],
  ['need to integrate locally', 5.9],
  ['thin-network', 5.5],
  ['hard', 4.8],
], 6.4);

const parseDescriptorScore = (text) => {
  if (typeof text !== 'string') {
    return null;
  }

  const explicitScore = text.match(/(\d+(?:\.\d+)?)\s*\/\s*10/);

  if (explicitScore) {
    return Number(explicitScore[1]);
  }

  const normalized = text.toLowerCase();

  if (normalized.includes('yes')) {
    return 8.8;
  }

  if (normalized.includes('partial')) {
    return 6.4;
  }

  if (normalized.includes('good') || normalized.includes('strong')) {
    return 7.8;
  }

  if (normalized.includes('weak') || normalized.includes('no')) {
    return 4.2;
  }

  return null;
};

const weightedAverageScore = (signals, weights) => {
  let weightedTotal = 0;
  let totalWeight = 0;

  Object.entries(weights).forEach(([key, weight]) => {
    const score = signals[key];

    if (Number.isFinite(score) && weight > 0) {
      weightedTotal += score * weight;
      totalWeight += weight;
    }
  });

  return totalWeight > 0 ? weightedTotal / totalWeight : 0;
};

const buildContributionRows = (signals, weights, limit = 4) => Object.entries(weights)
  .map(([key, weight]) => ({
    key,
    label: SIGNAL_LABELS[key] ?? key,
    weight,
    score: signals[key] ?? 0,
    contribution: (signals[key] ?? 0) * weight,
  }))
  .filter((entry) => entry.weight > 0)
  .sort((left, right) => right.contribution - left.contribution)
  .slice(0, limit);

const normalizeScore = (value) => clampValue(value, 0, 10);

const buildCitySignals = (city, dimensions, networkRow) => {
  const scores = city?.scores ?? {};
  const city360 = city?.city360 ?? {};
  const connectivity = dimensions?.connectivity ?? 0;
  const mobility = dimensions?.mobility ?? 0;
  const family = dimensions?.family ?? 0;
  const resilience = dimensions?.resilience ?? 0;
  const affordability = dimensions?.affordability ?? 0;
  const housing = Number.isFinite(scores.housing) ? scores.housing : affordability;
  const childcare = Number.isFinite(scores.childcare) ? scores.childcare : family;
  const healthcare = Number.isFinite(scores.healthcare) ? scores.healthcare : family;
  const safety = Number.isFinite(scores.safety) ? scores.safety : resilience;
  const environment = Number.isFinite(scores.environment) ? scores.environment : resilience;
  const commuteMinutes = dimensions?.commuteMinutes ?? 35;
  const commuteEfficiency = clampValue(10 - ((commuteMinutes - 16) / 4.2), 0, 10);
  const walkability = clampValue((parseDescriptorScore(city360.fifteenMinute) ?? 6) * 0.55
    + (parseDescriptorScore(city360.bikeLanes) ?? 6) * 0.25
    + commuteEfficiency * 0.2, 0, 10);
  const greenSpace = normalizeScore((environment * 0.6) + (resilience * 0.4));
  const railIntegration = normalizeScore((connectivity * 0.55) + (mobility * 0.45));
  const airportReach = normalizeScore((connectivity * 0.7) + ((networkRow?.modeCount ?? 2) * 0.9));
  const digitalization = parseDigitalizationScore(city360.digitalization);
  const bureaucracyScore = parseBureaucracyScore(city360.adminBureaucracy);
  const socialEase = parseNarrativeEaseScore(city360.fittingIn ?? city360.community ?? city360.personality);
  const adminEase = Number.isFinite(bureaucracyScore)
    ? clampValue(10 - bureaucracyScore, 0, 10)
    : clampValue((digitalization + socialEase) / 2, 0, 10);
  const accessibility = normalizeScore((mobility * 0.35) + (family * 0.25) + (healthcare * 0.2) + (safety * 0.2));
  const infrastructure = normalizeScore((connectivity * 0.35) + (mobility * 0.35) + (safety * 0.15) + (commuteEfficiency * 0.15));
  const familyReadiness = normalizeScore((childcare * 0.28) + (healthcare * 0.25) + (safety * 0.22) + (greenSpace * 0.15) + (accessibility * 0.1));
  const urbanCalm = normalizeScore((safety * 0.3) + (greenSpace * 0.25) + (commuteEfficiency * 0.25) + (socialEase * 0.2));
  const businessMobility = normalizeScore((connectivity * 0.28) + (airportReach * 0.22) + (digitalization * 0.22) + (adminEase * 0.18) + (mobility * 0.1));
  const economicMomentum = normalizeScore((connectivity * 0.3) + (infrastructure * 0.25) + (digitalization * 0.2) + (adminEase * 0.15) + (affordability * 0.1));
  const climateComfort = normalizeScore((resilience * 0.55) + (greenSpace * 0.25) + (urbanCalm * 0.2));
  const frictionEase = normalizeScore((adminEase * 0.38) + (digitalization * 0.24) + (commuteEfficiency * 0.2) + (socialEase * 0.18));

  return {
    familyReadiness,
    healthcare,
    safety,
    greenSpace,
    commuteEfficiency,
    connectivity,
    mobility,
    affordability,
    housing,
    resilience,
    accessibility,
    infrastructure,
    railIntegration,
    airportReach,
    digitalization,
    adminEase,
    urbanCalm,
    economicMomentum,
    businessMobility,
    socialEase,
    climateComfort,
    walkability,
    frictionEase,
    city360,
  };
};

export const buildIntelligenceRanking = (cityOptions, cityDimensionByKey, connectivityRanking, selectedModeKey, selectedPersonaKey) => {
  const connectivityByKey = new Map(connectivityRanking.map((row) => [row.key, row]));
  const modeProfile = STRATEGIC_MODES[selectedModeKey] ?? STRATEGIC_MODES.familyStability;
  const personaProfile = PERSONA_PROFILES[selectedPersonaKey] ?? PERSONA_PROFILES.internationalFamily;
  const combinedWeights = { ...modeProfile.weights };

  Object.entries(personaProfile.weights).forEach(([key, weight]) => {
    combinedWeights[key] = (combinedWeights[key] ?? 0) + weight;
  });

  return cityOptions
    .map((city) => {
      const dimensions = cityDimensionByKey.get(city.key);
      const networkRow = connectivityByKey.get(city.key);

      if (!dimensions) {
        return null;
      }

      const signals = buildCitySignals(city, dimensions, networkRow);
      const modeScore = weightedAverageScore(signals, modeProfile.weights);
      const personaScore = weightedAverageScore(signals, personaProfile.weights);
      const strategicFit = normalizeScore((modeScore * 0.55) + (personaScore * 0.45));

      return {
        key: city.key,
        city,
        dimensions,
        networkRow,
        signals,
        modeScore,
        personaScore,
        strategicFit,
        fitBand: describeScoreBand(strategicFit),
        fitSummary: `${describeScoreBand(modeScore)} ${modeProfile.label.toLowerCase()} fit with ${describeScoreBand(personaScore).toLowerCase()} ${personaProfile.label.toLowerCase()} alignment.`,
        drivers: buildContributionRows(signals, {
          ...modeProfile.weights,
          ...personaProfile.weights,
        }, 4),
        modeDrivers: buildContributionRows(signals, modeProfile.weights, 3),
        personaDrivers: buildContributionRows(signals, personaProfile.weights, 3),
        totalDrivers: buildContributionRows(signals, combinedWeights, 4),
        dna: CITY_DNA[city.key] ?? `${city.city} is a ${describeScoreBand(strategicFit).toLowerCase()} relocation fit with a distinct geographic identity.`,
        truthGood: city?.city360?.honestTruth?.good ?? [],
        truthBad: city?.city360?.honestTruth?.bad ?? [],
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.strategicFit - left.strategicFit || right.modeScore - left.modeScore)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
};

export const buildContrastLines = (focusSignals, compareSignals, weights) => {
  const contrastRows = Object.entries(weights)
    .map(([key, weight]) => ({
      key,
      weight,
      delta: (focusSignals[key] ?? 0) - (compareSignals[key] ?? 0),
    }))
    .filter((row) => row.weight > 0)
    .sort((left, right) => Math.abs(right.delta * right.weight) - Math.abs(left.delta * left.weight))
    .slice(0, 4);

  return contrastRows.map((row) => ({
    key: row.key,
    text: `${row.delta >= 0 ? '+' : '-'} ${CONTRAST_PHRASES[row.key] ?? SIGNAL_LABELS[row.key] ?? row.key}`,
  }));
};

export const buildWeeklyLifeSnapshot = (city, dimensions) => {
  const city360 = city?.city360 ?? {};
  const errandsCarFree = dimensions?.carFreeErrands ?? 0;
  const commuteMinutes = dimensions?.commuteMinutes ?? 35;

  return [
    `Average commute sits around ${commuteMinutes} min, with ${errandsCarFree}% of errands manageable without a car.`,
    city360.fifteenMinute ? firstSentence(city360.fifteenMinute) : 'Neighbourhood routines shape the week more than long cross-city commutes.',
    city360.traffic ? firstSentence(city360.traffic) : 'Transit reliability defines the working week here.',
    city360.community ? firstSentence(city360.community) : 'Community routines and social rhythm are a meaningful part of the fit.',
  ].filter(Boolean);
};

export const buildForecastSnapshot = (signals, city) => {
  const city360 = city?.city360 ?? {};
  const railGrowth = clampValue(Math.round((signals.railIntegration * 1.8) + (signals.connectivity * 0.6) - 3), 4, 18);
  const climateState = signals.resilience >= 7.8
    ? 'Stable to 2035, with limited downside from climate stress.'
    : signals.resilience >= 6.2
      ? 'Moderate degradation risk after 2035, mostly from heat and resilience pressure.'
      : 'Rising climate and infrastructure stress warrants caution.';
  const affordabilityState = signals.affordability >= 7.6
    ? 'Pressure should stay manageable in the medium term.'
    : signals.affordability >= 5.8
      ? 'Moderate pressure remains, especially in prime districts.'
      : 'Housing competition likely to intensify.';
  const infrastructureState = city360.futureProofing ? firstSentence(city360.futureProofing) : 'Infrastructure investment remains the key forecast lever.';

  return {
    railGrowth,
    climateState,
    affordabilityState,
    infrastructureState,
    timeline: [
      { year: '2015', label: 'Legacy baseline', detail: 'Earlier infrastructure, less digital administration, and a weaker strategic lens.' },
      { year: '2025', label: 'Current state', detail: `${describeScoreBand(signals.connectivity)} connectivity and ${describeScoreBand(signals.resilience).toLowerCase()} resilience.` },
      { year: '2035', label: 'Projected', detail: `Projected rail integration: +${railGrowth}% by 2035. ${climateState}` },
    ],
  };
};

export const buildUrbanDNA = (city, signals) => CITY_DNA[city?.key] ?? `${city?.city ?? 'This city'} is a ${describeScoreBand(signals?.strategic ?? 0).toLowerCase()} relocation fit with a distinct urban rhythm.`;

export const buildArcPath = (fromPoint, toPoint, curvature = 0.18) => {
  const dx = toPoint.x - fromPoint.x;
  const dy = toPoint.y - fromPoint.y;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = -dy / length;
  const normalY = dx / length;
  const controlX = (fromPoint.x + toPoint.x) / 2 + normalX * length * curvature;
  const controlY = (fromPoint.y + toPoint.y) / 2 + normalY * length * curvature;
  return `M ${fromPoint.x} ${fromPoint.y} Q ${controlX} ${controlY} ${toPoint.x} ${toPoint.y}`;
};

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

export const buildCityDimensions = (city, networkRow, closestConnections) => {
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
