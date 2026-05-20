import { useEffect, useMemo, useState } from 'react';
import { geoCentroid, geoMercator, geoPath } from 'd3-geo';
import { feature } from 'topojson-client';
import countriesTopology from 'world-atlas/countries-110m.json';
import { cityGeoData, projectGeoPoint } from '../data/cityGeoData.js';
import { getNeighborhoodProfiles } from '../data/neighborhoodProfiles.js';
import { strategicBalanceWeights } from '../data/dashboardConfig.js';
import { StrategicRadarChart } from './StrategicRadarChart.jsx';

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

const STRATEGIC_MODES = {
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

const PERSONA_PROFILES = {
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

const CONTRAST_PHRASE_REPLACEMENTS = {
  better: 'worse',
  stronger: 'weaker',
  higher: 'lower',
  more: 'less',
  lighter: 'heavier',
  lower: 'higher',
  less: 'more',
  easier: 'harder',
  faster: 'slower',
  quieter: 'noisier',
  wider: 'narrower',
};

const CONTRAST_PHRASE_PATTERN = new RegExp(`\\b(${Object.keys(CONTRAST_PHRASE_REPLACEMENTS).join('|')})\\b`, 'i');

const invertContrastPhrase = (phrase) => {
  const match = phrase.match(CONTRAST_PHRASE_PATTERN);

  if (!match) {
    return `weaker ${phrase}`;
  }

  const matchedWord = match[1];
  const replacement = CONTRAST_PHRASE_REPLACEMENTS[matchedWord.toLowerCase()] ?? matchedWord;
  return `${phrase.slice(0, match.index)}${replacement}${phrase.slice(match.index + matchedWord.length)}`;
};

const describeScoreBand = (score) => {
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

const buildIntelligenceRanking = (cityOptions, cityDimensionByKey, connectivityRanking, selectedModeKey, selectedPersonaKey) => {
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

const buildContrastLines = (focusSignals, compareSignals, weights) => {
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
    text: (() => {
      const phrase = CONTRAST_PHRASES[row.key] ?? SIGNAL_LABELS[row.key] ?? row.key;
      return `${row.delta >= 0 ? '+' : '-'} ${row.delta >= 0 ? phrase : invertContrastPhrase(phrase)}`;
    })(),
  }));
};

const buildWeeklyLifeSnapshot = (city, dimensions, signals) => {
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

const buildForecastSnapshot = (signals, city) => {
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

const buildUrbanDNA = (city, strategicFit = 0) => CITY_DNA[city?.key] ?? `${city?.city ?? 'This city'} is a ${describeScoreBand(strategicFit).toLowerCase()} relocation fit with a distinct urban rhythm.`;

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
  cityIntelligenceByKey,
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

          <g className="city-map-gravity-fields" aria-label="Mobility gravity fields">
            {cityOptions.map((city) => {
              const geo = cityGeoData[city.key];
              if (!geo) {
                return null;
              }

              const point = projectEuropePoint(geo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
              const intelligenceRow = cityIntelligenceByKey.get(city.key);
              const gravityScore = intelligenceRow?.strategicFit ?? getScoreValue(city);
              const radius = clampValue(34 + gravityScore * 4.8, 38, 84);

              return (
                <circle
                  key={`gravity-${city.key}`}
                  className={`city-map-gravity-field city-map-gravity-field--${intelligenceRow?.fitBand?.toLowerCase() ?? 'balanced'}`}
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                />
              );
            })}
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
                const intelligenceRow = cityIntelligenceByKey.get(city.key);
                const strategicScore = intelligenceRow?.strategicFit ?? dimensions?.strategic ?? getScoreValue(city);
                const radius = clampValue(22 + strategicScore * 3.4, 26, 58);

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
            const intelligenceRow = cityIntelligenceByKey.get(city.key);
            const strategic = intelligenceRow?.strategicFit ?? dimensions?.strategic ?? getScoreValue(city);
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

const StrategicCityCard = function strategicCityCard({ city, dimensions, intelligenceRow, networkRow, rank, onOpen, modeLabel, personaLabel }) {
  const topDrivers = intelligenceRow?.totalDrivers ?? [];
  const driverSummary = topDrivers
    .slice(0, 2)
    .map((driver) => driver.label)
    .join(' · ');

  return (
    <article className="city-map-strategic-card">
      <header className="city-map-strategic-card__header">
        <div>
          <p className="city-map-strategic-card__eyebrow">Tier {rank} · {intelligenceRow?.fitBand ?? 'Balanced'} fit</p>
          <h4>{city.city}</h4>
          <span>{city.country}</span>
        </div>
        <span className="city-map-strategic-card__score">{intelligenceRow?.strategicFit?.toFixed(1) ?? dimensions.strategic.toFixed(1)}</span>
      </header>

      <p className="city-map-strategic-card__summary">
        {modeLabel} · {personaLabel}
      </p>
      <p className="city-map-strategic-card__narrative">
        {intelligenceRow?.fitSummary ?? `${describeScoreBand(dimensions.strategic)} relocation fit.`}
      </p>

      {driverSummary && <p className="city-map-strategic-card__drivers">{driverSummary}</p>}

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
        Inspect strategic profile {networkRow ? `(${networkRow.links} active mobility corridors)` : ''}
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
  const [selectedModeKey, setSelectedModeKey] = useState('familyStability');
  const [selectedPersonaKey, setSelectedPersonaKey] = useState('internationalFamily');
  const [comparisonCityKey, setComparisonCityKey] = useState('');
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

  const intelligenceRanking = useMemo(
    () => buildIntelligenceRanking(
      mappableCityOptions,
      cityDimensionByKey,
      connectivityRanking,
      selectedModeKey,
      selectedPersonaKey,
    ),
    [cityDimensionByKey, connectivityRanking, mappableCityOptions, selectedModeKey, selectedPersonaKey],
  );

  const intelligenceByKey = useMemo(
    () => new Map(intelligenceRanking.map((row) => [row.key, row])),
    [intelligenceRanking],
  );

  const topCityRankByKey = useMemo(
    () => new Map(intelligenceRanking.map((cityRow, index) => [cityRow.key, index + 1])),
    [intelligenceRanking],
  );

  useEffect(() => {
    if (comparisonCityKey && comparisonCityKey === selectedCityKey) {
      setComparisonCityKey('');
    }
  }, [comparisonCityKey, selectedCityKey, setComparisonCityKey]);

  const rankingStripRows = useMemo(() => {
    const withDimensions = mappableCityOptions.map((city) => ({
      city,
      dimensions: cityDimensionByKey.get(city.key),
      network: connectivityRanking.find((row) => row.key === city.key),
      intelligence: intelligenceByKey.get(city.key),
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
      { label: 'Top Strategic Fit', row: sortBy((candidate) => candidate.intelligence?.strategicFit ?? 0) },
      { label: 'Best Family Stability', row: sortBy((candidate) => candidate.intelligence?.signals?.familyReadiness ?? 0) },
      { label: 'Best Rail Networks', row: bestRail },
      { label: 'Most Walkable', row: sortBy((candidate) => candidate.intelligence?.signals?.walkability ?? 0) },
      { label: 'Lowest Commute Burden', row: sortBy((candidate) => candidate.dimensions?.commuteMinutes ?? 100, 'asc') },
    ];
  }, [mappableCityOptions, cityDimensionByKey, connectivityRanking, cityConnectionsByKey, intelligenceByKey]);

  const focusCity = focusCityKey
    ? mappableCityOptions.find((city) => city.key === focusCityKey) ?? null
    : null;
  const focusDimensions = focusCity ? cityDimensionByKey.get(focusCity.key) : null;
  const focusIntel = focusCity ? intelligenceByKey.get(focusCity.key) ?? null : null;
  const focusConnections = focusCity ? cityConnectionsByKey.get(focusCity.key) ?? [] : [];
  const focusNeighborhoods = focusCity ? getNeighborhoodProfiles(focusCity.key).slice(0, 3) : [];
  const selectedModeProfile = STRATEGIC_MODES[selectedModeKey] ?? STRATEGIC_MODES.familyStability;
  const selectedPersonaProfile = PERSONA_PROFILES[selectedPersonaKey] ?? PERSONA_PROFILES.internationalFamily;
  const comparisonCity = comparisonCityKey
    ? mappableCityOptions.find((city) => city.key === comparisonCityKey) ?? null
    : intelligenceRanking.find((row) => row.key !== focusCity?.key)?.city ?? null;
  const comparisonIntel = comparisonCity ? intelligenceByKey.get(comparisonCity.key) ?? null : null;
  const comparisonSignals = comparisonIntel?.signals ?? null;
  const focusSignals = focusIntel?.signals ?? null;
  const combinedLensWeights = useMemo(() => {
    const merged = { ...selectedModeProfile.weights };
    Object.entries(selectedPersonaProfile.weights).forEach(([key, weight]) => {
      merged[key] = (merged[key] ?? 0) + weight;
    });
    return merged;
  }, [selectedModeProfile.weights, selectedPersonaProfile.weights]);

  const selectedCityTruthGood = focusIntel?.truthGood ?? [];
  const selectedCityTruthBad = focusIntel?.truthBad ?? [];
  const selectedUrbanDNA = focusCity ? buildUrbanDNA(focusCity, focusIntel?.strategicFit ?? 0) : '';
  const selectedWeeklyLife = focusCity ? buildWeeklyLifeSnapshot(focusCity, focusDimensions, focusIntel?.signals ?? {}) : [];
  const selectedForecast = focusCity ? buildForecastSnapshot(focusIntel?.signals ?? {}, focusCity) : null;
  const contrastLines = focusSignals && comparisonSignals
    ? buildContrastLines(focusSignals, comparisonSignals, combinedLensWeights)
    : [];
  const explanationLines = focusIntel
    ? [...selectedCityTruthGood.slice(0, 3), ...focusIntel.modeDrivers.slice(0, 2).map((item) => item.label)]
    : [];

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

          <section className="city-map-control-grid" aria-label="Strategic relocation controls">
            <div className="city-map-control-group">
              <p className="city-map-control-group__label">Discover</p>
              <label className="city-map-toolbar__label" htmlFor="city-map-picker-compact">Focus city</label>
              <select
                id="city-map-picker-compact"
                className="city-map-toolbar__select"
                value={selectedCity?.key ?? ''}
                onChange={(event) => onSelectCity(event.target.value || null)}
              >
                <option value="">Select a city...</option>
                {mappableCityOptions.map((city) => (
                  <option key={city.key} value={city.key}>{city.city}, {city.country}</option>
                ))}
              </select>
              <label className="city-map-neighbor-select-wrap" htmlFor="city-map-comparison-picker">
                Compare with
                <select
                  id="city-map-comparison-picker"
                  className="city-map-toolbar__select city-map-neighbor-select"
                  value={comparisonCityKey}
                  onChange={(event) => setComparisonCityKey(event.target.value)}
                >
                  <option value="">Auto</option>
                  {mappableCityOptions
                    .filter((city) => city.key !== selectedCityKey)
                    .map((city) => (
                      <option key={`compare-${city.key}`} value={city.key}>{city.city}, {city.country}</option>
                    ))}
                </select>
              </label>
            </div>

            <div className="city-map-control-group">
              <p className="city-map-control-group__label">Relocation priorities</p>
              <div className="city-map-layer-switches">
                {Object.entries(STRATEGIC_MODES).map(([modeKey, modeProfile]) => (
                  <button
                    key={modeKey}
                    type="button"
                    className={`city-map-layer-btn${selectedModeKey === modeKey ? ' city-map-layer-btn--active' : ''}`}
                    onClick={() => setSelectedModeKey(modeKey)}
                    aria-pressed={selectedModeKey === modeKey}
                  >
                    {modeProfile.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="city-map-control-group">
              <p className="city-map-control-group__label">Personas</p>
              <div className="city-map-layer-switches">
                {Object.entries(PERSONA_PROFILES).map(([personaKey, personaProfile]) => (
                  <button
                    key={personaKey}
                    type="button"
                    className={`city-map-layer-btn${selectedPersonaKey === personaKey ? ' city-map-layer-btn--active' : ''}`}
                    onClick={() => setSelectedPersonaKey(personaKey)}
                    aria-pressed={selectedPersonaKey === personaKey}
                  >
                    {personaProfile.label}
                  </button>
                ))}
              </div>
              <p className="city-map-control-group__tone">{selectedPersonaProfile.tone}</p>
            </div>

            <div className="city-map-control-group">
              <p className="city-map-control-group__label">Visualization</p>
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
                  Active mobility corridors
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
            </div>
          </section>

          <div className="city-map-toolbar">
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
                  cityIntelligenceByKey={intelligenceByKey}
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
              <p className="city-map-selection__eyebrow">Strategic profile</p>
              {focusCity && focusDimensions && focusIntel ? (
                <>
                  <h4>{focusCity.city}, {focusCity.country}</h4>
                  <p className="city-map-selection__summary">
                    {focusIntel.fitSummary}
                  </p>
                  <div className="city-map-selection__chips" aria-label="Active relocation lens">
                    <span>{selectedModeProfile.label}</span>
                    <span>{selectedPersonaProfile.label}</span>
                    <span>{focusIntel.fitBand} fit</span>
                  </div>
                  {explanationLines.length > 0 && (
                    <ul className="city-map-selection__bullets">
                      {explanationLines.slice(0, 4).map((line) => <li key={line}>{line}</li>)}
                    </ul>
                  )}
                  <div className="city-map-intel-metrics">
                    <span>{focusDimensions.countriesReachableByRail} countries reachable by rail in one day</span>
                    <span>{focusDimensions.carFreeErrands}% errands can be done car-free</span>
                    <span>{focusDimensions.commuteMinutes} min average commute</span>
                    <span>{focusDimensions.pediatricClinics} pediatric clinics in metro area</span>
                    <span>{focusDimensions.greenCoverage}% urban green coverage</span>
                  </div>
                  {selectedCityTruthGood.length > 0 && (
                    <div>
                      <strong className="city-map-selection__headline">Why this city ranks highly</strong>
                      <ul className="city-map-selection__bullets">
                        {selectedCityTruthGood.slice(0, 3).map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </div>
                  )}
                  {selectedWeeklyLife.length > 0 && (
                    <div>
                      <strong className="city-map-selection__headline">A week living here</strong>
                      <ul className="city-map-selection__bullets">
                        {selectedWeeklyLife.map((line) => <li key={line}>{line}</li>)}
                      </ul>
                    </div>
                  )}
                  {selectedUrbanDNA && (
                    <p className="city-map-selection__narrative">Urban DNA: {selectedUrbanDNA}</p>
                  )}
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

          <section className="city-map-deep-intel-grid" aria-label="Strategic intelligence details">
            <article className="city-map-selection city-map-selection--contrast">
              <p className="city-map-selection__eyebrow">Strategic contrast</p>
              <strong className="city-map-selection__headline">
                {comparisonCity ? `${focusCity?.city ?? 'Selected city'} compared with ${comparisonCity.city}` : 'No comparison selected'}
              </strong>
              {contrastLines.length > 0 ? (
                <ul className="city-map-selection__bullets">
                  {contrastLines.map((line) => <li key={line.key}>{line.text}</li>)}
                </ul>
              ) : (
                <span>Choose a comparison city to expose the tradeoffs.</span>
              )}
              {selectedCityTruthBad.length > 0 && (
                <>
                  <strong className="city-map-selection__headline">Hidden friction</strong>
                  <ul className="city-map-selection__bullets">
                    {selectedCityTruthBad.slice(0, 3).map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </>
              )}
            </article>

            <article className="city-map-selection city-map-selection--forecast">
              <p className="city-map-selection__eyebrow">Forecast layer</p>
              {selectedForecast ? (
                <>
                  <strong className="city-map-selection__headline">Infrastructure evolution</strong>
                  <ul className="city-map-timeline">
                    {selectedForecast.timeline.map((item) => (
                      <li key={item.year}>
                        <span>{item.year}</span>
                        <strong>{item.label}</strong>
                        <small>{item.detail}</small>
                      </li>
                    ))}
                  </ul>
                  <div className="city-map-forecast-notes">
                    <p>Projected rail integration: +{selectedForecast.railGrowth}% by 2035</p>
                    <p>Climate resilience outlook: {selectedForecast.climateState}</p>
                    <p>Affordability outlook: {selectedForecast.affordabilityState}</p>
                    <p>{selectedForecast.infrastructureState}</p>
                  </div>
                  <div className="city-map-radar-wrap">
                    <StrategicRadarChart selectedCity={focusCity} filteredRows={mappableCityOptions} size={360} />
                  </div>
                </>
              ) : (
                <span>Select a city to open the forecast layer.</span>
              )}
            </article>
          </section>

          <section className="city-map-top-grid" aria-label="Strategic city cards">
            {intelligenceRanking.slice(0, 6).map((rankingRow, index) => {
              const city = rankingRow.city;
              const dimensions = rankingRow.dimensions;
              if (!city || !dimensions) {
                return null;
              }

              return (
                <StrategicCityCard
                  key={city.key}
                  city={city}
                  dimensions={dimensions}
                  intelligenceRow={rankingRow}
                  networkRow={rankingRow.networkRow}
                  rank={index + 1}
                  modeLabel={selectedModeProfile.label}
                  personaLabel={selectedPersonaProfile.label}
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
