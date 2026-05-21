import { cityGeoData } from '../data/cityGeoData.js';
import {
  GRID_LATS,
  GRID_LONS,
  MAIN_EUROPE_MAP,
  VIEWBOX_HEIGHT,
  VIEWBOX_WIDTH,
  buildArcPath,
  clampValue,
  describeScoreBand,
  formatDistance,
  getScoreValue,
  projectEuropePoint,
} from './cityMapPageUtils.js';

const ATLAS_FOCUS = {
  centerX: VIEWBOX_WIDTH * 0.515,
  centerY: VIEWBOX_HEIGHT * 0.58,
  width: VIEWBOX_WIDTH * 0.43,
  height: VIEWBOX_HEIGHT * 0.46,
};

const CITY_LABEL_LAYOUT = {
  milan: { dx: 16, dy: -8, anchor: 'start' },
  vienna: { dx: 18, dy: 4, anchor: 'start' },
  bologna: { dx: 14, dy: -10, anchor: 'start' },
  reggioEmilia: { dx: 16, dy: 14, anchor: 'start' },
  bilbao: { dx: 14, dy: 4, anchor: 'start' },
  valencia: { dx: 12, dy: 16, anchor: 'start' },
  cologne: { dx: 14, dy: -12, anchor: 'start' },
  lugoDiRavenna: { dx: 14, dy: 5, anchor: 'start' },
  bucharest: { dx: 14, dy: -8, anchor: 'start' },
};

const CITY_LABEL_ABBREVIATIONS = {
  sanLazzaro: 'San Lazzaro',
  reggioEmilia: 'Reggio E.',
  lugo: 'Lugo Ravenna',
};

const CITY_LABEL_CANDIDATES = [
  { dx: 14, dy: -10, anchor: 'start' },
  { dx: 14, dy: 12, anchor: 'start' },
  { dx: -14, dy: -10, anchor: 'end' },
  { dx: -14, dy: 12, anchor: 'end' },
  { dx: 0, dy: -15, anchor: 'middle' },
  { dx: 0, dy: 17, anchor: 'middle' },
  { dx: 20, dy: 2, anchor: 'start' },
  { dx: -20, dy: 2, anchor: 'end' },
];

const boxesOverlap = (left, right, pad = 2) => !(
  left.x2 + pad < right.x1
  || right.x2 + pad < left.x1
  || left.y2 + pad < right.y1
  || right.y2 + pad < left.y1
);

const estimateLabelWidth = (text) => Math.max(46, 10 + text.length * 6.7);

const buildLabelVariants = (cityKey, cityName) => {
  const explicit = CITY_LABEL_ABBREVIATIONS[cityKey];
  const compact = cityName
    .replace(/\bdi\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
  const words = cityName.split(' ').filter(Boolean);
  const short = words.length >= 2
    ? `${words[0]} ${words[1].charAt(0)}.`
    : `${cityName.slice(0, 11)}.`;

  return [cityName, explicit, compact, short]
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
};

const buildLabelCandidates = (cityKey) => {
  const preferred = CITY_LABEL_LAYOUT[cityKey];
  if (!preferred) {
    return CITY_LABEL_CANDIDATES;
  }
  return [preferred, ...CITY_LABEL_CANDIDATES.filter((candidate) => (
    candidate.dx !== preferred.dx || candidate.dy !== preferred.dy || candidate.anchor !== preferred.anchor
  ))];
};

const computeLabelBox = (x, y, anchor, textWidth, textHeight) => {
  if (anchor === 'end') {
    return { x1: x - textWidth, y1: y - textHeight, x2: x, y2: y + 3 };
  }
  if (anchor === 'middle') {
    return { x1: x - textWidth / 2, y1: y - textHeight, x2: x + textWidth / 2, y2: y + 3 };
  }
  return { x1: x, y1: y - textHeight, x2: x + textWidth, y2: y + 3 };
};

const makeCityLabelPlacements = ({
  nodeVisuals,
  showLabels,
  selectedCityKey,
  hoveredCityKey,
}) => {
  if (!showLabels) {
    return new Map();
  }

  const nodesByPriority = [...nodeVisuals].sort((left, right) => {
    const leftPriority = (left.isActive ? 1000 : 0)
      + (left.isHovered ? 900 : 0)
      + (Number.isFinite(left.rank) ? (420 - left.rank * 6) : 0)
      + left.strategic * 8;
    const rightPriority = (right.isActive ? 1000 : 0)
      + (right.isHovered ? 900 : 0)
      + (Number.isFinite(right.rank) ? (420 - right.rank * 6) : 0)
      + right.strategic * 8;
    return rightPriority - leftPriority;
  });

  const occupied = [];
  const placements = new Map();
  const boundary = { left: 16, right: VIEWBOX_WIDTH - 16, top: 16, bottom: VIEWBOX_HEIGHT - 16 };

  const pointBoxes = nodeVisuals.map((node) => ({
    key: node.city.key,
    x1: node.point.x - node.pointRadius - 3,
    y1: node.point.y - node.pointRadius - 3,
    x2: node.point.x + node.pointRadius + 3,
    y2: node.point.y + node.pointRadius + 3,
  }));

  nodesByPriority.forEach((node) => {
    const labelVariants = buildLabelVariants(node.city.key, node.city.city);
    const candidates = buildLabelCandidates(node.city.key);
    const textHeight = 14;

    for (const text of labelVariants) {
      const textWidth = estimateLabelWidth(text);
      for (const candidate of candidates) {
        const x = node.point.x + (candidate.anchor === 'middle' ? candidate.dx : Math.sign(candidate.dx || 1) * node.pointRadius + candidate.dx);
        const y = node.point.y + candidate.dy;
        const labelBox = computeLabelBox(x, y, candidate.anchor, textWidth, textHeight);

        if (
          labelBox.x1 < boundary.left
          || labelBox.x2 > boundary.right
          || labelBox.y1 < boundary.top
          || labelBox.y2 > boundary.bottom
        ) {
          continue;
        }

        if (occupied.some((box) => boxesOverlap(box, labelBox, 5))) {
          continue;
        }

        const collidesNode = pointBoxes.some((pointBox) => pointBox.key !== node.city.key && boxesOverlap(pointBox, labelBox, 2));
        if (collidesNode) {
          continue;
        }

        const leaderX = candidate.anchor === 'end'
          ? x - 6
          : candidate.anchor === 'middle'
            ? x
            : x + 6;

        placements.set(node.city.key, {
          text,
          x,
          y,
          anchor: candidate.anchor,
          leaderX,
          leaderY: y - 4,
        });
        occupied.push(labelBox);
        return;
      }
    }

    if (node.city.key === selectedCityKey || node.city.key === hoveredCityKey) {
      const fallbackText = buildLabelVariants(node.city.key, node.city.city)[0];
      const textWidth = estimateLabelWidth(fallbackText);
      const fallbackCandidates = [
        { x: node.point.x + node.pointRadius + 12, y: node.point.y - 10, anchor: 'start' },
        { x: node.point.x - node.pointRadius - 12, y: node.point.y - 10, anchor: 'end' },
        { x: node.point.x, y: node.point.y - node.pointRadius - 14, anchor: 'middle' },
      ];

      for (const candidate of fallbackCandidates) {
        const labelBox = computeLabelBox(candidate.x, candidate.y, candidate.anchor, textWidth, 14);
        if (
          labelBox.x1 < boundary.left
          || labelBox.x2 > boundary.right
          || labelBox.y1 < boundary.top
          || labelBox.y2 > boundary.bottom
        ) {
          continue;
        }
        if (occupied.some((box) => boxesOverlap(box, labelBox, 5))) {
          continue;
        }

        const leaderX = candidate.anchor === 'end'
          ? candidate.x - 6
          : candidate.anchor === 'middle'
            ? candidate.x
            : candidate.x + 6;

        placements.set(node.city.key, {
          text: fallbackText,
          x: candidate.x,
          y: candidate.y,
          anchor: candidate.anchor,
          leaderX,
          leaderY: candidate.y - 4,
        });
        occupied.push(labelBox);
        break;
      }
    }
  });

  return placements;
};

const getHubTier = (rank) => {
  if (rank <= 2) return 'major';
  if (rank <= 5) return 'secondary';
  return 'peripheral';
};

const getHubScale = (tier) => {
  if (tier === 'major') return 1.16;
  if (tier === 'secondary') return 1.0;
  return 0.88;
};

export const CityMapCanvas = function cityMapCanvas({
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
  const visibleNetworkConnections = cityNetworkConnections.filter((connection) =>
    connection.modes.some((mode) => activeTransportModes[mode]),
  );

  const sortedCityOptions = [...cityOptions]
    .sort((left, right) => getScoreValue(left) - getScoreValue(right));

  const strongestCity = sortedCityOptions.at(-1) ?? null;
  const selectedGeo = selectedCityKey
    ? cityGeoData[selectedCityKey]
    : (strongestCity ? cityGeoData[strongestCity.key] : null);
  const selectedPoint = selectedGeo
    ? projectEuropePoint(selectedGeo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT)
    : null;

  const projectedCityPoints = cityOptions
    .map((city) => {
      const geo = cityGeoData[city.key];
      if (!geo) {
        return null;
      }
      return projectEuropePoint(geo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
    })
    .filter(Boolean);

  const bounds = projectedCityPoints.reduce((acc, point) => ({
    minX: Math.min(acc.minX, point.x),
    maxX: Math.max(acc.maxX, point.x),
    minY: Math.min(acc.minY, point.y),
    maxY: Math.max(acc.maxY, point.y),
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minY: Number.POSITIVE_INFINITY,
    maxY: Number.NEGATIVE_INFINITY,
  });

  const spanX = Math.max(bounds.maxX - bounds.minX, 1);
  const spanY = Math.max(bounds.maxY - bounds.minY, 1);
  const baseScale = projectedCityPoints.length > 1
    ? clampValue(
      Math.min(ATLAS_FOCUS.width / spanX, ATLAS_FOCUS.height / spanY),
      0.62,
      1.9,
    )
    : 1.0;
  const baseTranslateX = projectedCityPoints.length > 0
    ? ATLAS_FOCUS.centerX - ((bounds.minX + bounds.maxX) / 2) * baseScale
    : 0;
  const baseTranslateY = projectedCityPoints.length > 0
    ? ATLAS_FOCUS.centerY - ((bounds.minY + bounds.maxY) / 2) * baseScale
    : 0;
  const viewportScaleX = baseScale * zoom;
  const viewportScaleY = viewportScaleX * 0.93;
  const viewportTransform = `translate(${baseTranslateX + pan.x} ${baseTranslateY + pan.y}) scale(${viewportScaleX} ${viewportScaleY})`;

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
            <stop offset="0%" stopColor="#121c2b" />
            <stop offset="55%" stopColor="#1a273a" />
            <stop offset="100%" stopColor="#1f3045" />
          </linearGradient>
          <radialGradient id="cityMapGlow" cx="0.45" cy="0.35" r="0.8">
            <stop offset="0%" stopColor="rgba(93, 169, 236, 0.2)" />
            <stop offset="100%" stopColor="rgba(47, 127, 98, 0)" />
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
              const rank = topCityRankByKey.get(city.key) ?? Number.POSITIVE_INFINITY;
              const hubTier = getHubTier(rank);
              const radius = clampValue(34 + gravityScore * 4.8, 38, 84);

              return (
                <circle
                  key={`gravity-${city.key}`}
                  className={`city-map-gravity-field city-map-gravity-field--${intelligenceRow?.fitBand?.toLowerCase() ?? 'balanced'} city-map-gravity-field--${hubTier}`}
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
                const rank = topCityRankByKey.get(city.key) ?? Number.POSITIVE_INFINITY;
                if (rank > 5) {
                  return null;
                }
                const hubTier = getHubTier(rank);
                const radius = clampValue(22 + strategicScore * 3.4, 26, 58);

                return (
                  <circle
                    key={`heat-${city.key}`}
                    className={`city-map-heat-zone city-map-heat-zone--${hubTier}`}
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

                const fromStrategic = cityIntelligenceByKey.get(connection.fromCity.key)?.strategicFit
                  ?? cityDimensionByKey.get(connection.fromCity.key)?.strategic
                  ?? getScoreValue(connection.fromCity);
                const toStrategic = cityIntelligenceByKey.get(connection.toCity.key)?.strategicFit
                  ?? cityDimensionByKey.get(connection.toCity.key)?.strategic
                  ?? getScoreValue(connection.toCity);
                const corridorIntensity = clampValue((((fromStrategic + toStrategic) / 2) - 5.4) / 2.5, 0.2, 1);
                const corridorStrokeWidth = connection.primaryMode === 'rail'
                  ? 1.8 + corridorIntensity * 1.9
                  : connection.primaryMode === 'air'
                    ? 1.2 + corridorIntensity * 1.5
                    : 0.75 + corridorIntensity * 1.2;
                const corridorStyle = {
                  '--corridor-intensity': corridorIntensity.toFixed(3),
                  strokeWidth: corridorStrokeWidth,
                  opacity: 0.2 + corridorIntensity * 0.74,
                };

                const lineClasses = [
                  'city-map-network__line',
                  `city-map-network__line--${connection.primaryMode}`,
                  isSelectedEdge ? 'city-map-network__line--selected' : '',
                  isHoveredEdge ? 'city-map-network__line--hover' : '',
                ].filter(Boolean).join(' ');

                if (connection.primaryMode === 'air') {
                  return (
                    <g key={connection.key}>
                      <path
                        className={lineClasses}
                        style={corridorStyle}
                        d={buildArcPath(fromPoint, toPoint, 0.22)}
                      >
                        <title>
                          {`${connection.fromCity.city} ⇄ ${connection.toCity.city} • ${formatDistance(connection.distanceKm)} • ${connection.modeTimeLabel}`}
                        </title>
                      </path>
                      <path
                        className={`${lineClasses} city-map-network__line--flow`}
                        d={buildArcPath(fromPoint, toPoint, 0.22)}
                        style={corridorStyle}
                      />
                    </g>
                  );
                }

                return (
                  <g key={connection.key}>
                    <line
                      className={lineClasses}
                      style={corridorStyle}
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={toPoint.x}
                      y2={toPoint.y}
                    >
                      <title>
                        {`${connection.fromCity.city} ⇄ ${connection.toCity.city} • ${formatDistance(connection.distanceKm)} • ${connection.modeTimeLabel}`}
                      </title>
                    </line>
                    <line
                      className={`${lineClasses} city-map-network__line--flow`}
                      style={corridorStyle}
                      x1={fromPoint.x}
                      y1={fromPoint.y}
                      x2={toPoint.x}
                      y2={toPoint.y}
                    />
                  </g>
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

          {(() => {
            const nodeVisuals = sortedCityOptions
              .map((city) => {
                const geo = cityGeoData[city.key];
                if (!geo) {
                  return null;
                }
                const point = projectEuropePoint(geo, MAIN_EUROPE_MAP, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
                const dimensions = cityDimensionByKey.get(city.key);
                const intelligenceRow = cityIntelligenceByKey.get(city.key);
                const strategic = intelligenceRow?.strategicFit ?? dimensions?.strategic ?? getScoreValue(city);
                const rank = topCityRankByKey.get(city.key) ?? Number.POSITIVE_INFINITY;
                const hubTier = getHubTier(rank);
                const hubScale = getHubScale(hubTier);
                const pointRadius = clampValue((6.1 + (strategic - 5.6) * 1.55) * hubScale, 5.2, 13.6);
                const isActive = city.key === selectedCityKey;
                const isHovered = city.key === hoveredCityKey;

                return {
                  city,
                  point,
                  strategic,
                  rank,
                  hubTier,
                  pointRadius,
                  isActive,
                  isHovered,
                };
              })
              .filter(Boolean);

            const labelPlacements = makeCityLabelPlacements({
              nodeVisuals,
              showLabels,
              selectedCityKey,
              hoveredCityKey,
            });

            return nodeVisuals.map((node) => {
              const { city, point, strategic, hubTier, pointRadius, isActive, isHovered } = node;
              const labelPlacement = labelPlacements.get(city.key);

              return (
              <g
                key={city.key}
                className={`city-map-point city-map-point--${hubTier}${isActive ? ' city-map-point--active' : ''}${isHovered ? ' city-map-point--hover' : ''}`}
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
                {labelPlacement && (
                  <g className="city-map-label">
                    <line x1={point.x + pointRadius * 0.72} y1={point.y} x2={labelPlacement.leaderX} y2={labelPlacement.leaderY} />
                    <text x={labelPlacement.x} y={labelPlacement.y} textAnchor={labelPlacement.anchor}>{labelPlacement.text}</text>
                  </g>
                )}
                {topCityRankByKey.has(city.key) && (
                  <g className="city-map-rank-pin" aria-hidden="true">
                    <circle cx={point.x - pointRadius - 9} cy={point.y - pointRadius - 8} r="9.5" />
                    <text x={point.x - pointRadius - 9} y={point.y - pointRadius - 5} textAnchor="middle">
                      {topCityRankByKey.get(city.key)}
                    </text>
                  </g>
                )}
              </g>
              );
            });
          })()}
        </g>
      </svg>
    </div>
  );
};

export const StrategicCityCard = function strategicCityCard({ city, dimensions, intelligenceRow, networkRow, rank, onOpen, modeLabel, personaLabel }) {
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
