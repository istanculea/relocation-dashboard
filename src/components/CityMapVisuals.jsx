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
