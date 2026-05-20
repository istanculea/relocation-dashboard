import { useMemo, useState } from 'react';
import { cityGeoData } from '../data/cityGeoData.js';
import { getNeighborhoodProfiles } from '../data/neighborhoodProfiles.js';
import { CityMapCanvas, StrategicCityCard } from './CityMapVisuals.jsx';
import { CityMapInsightsPanel } from './CityMapInsightsPanel.jsx';
import { panViewport, resetViewport, zoomViewport } from './cityMapViewport.js';
import {
  PERSONA_PROFILES,
  STRATEGIC_MODES,
  TRANSPORT_MODE_META,
  buildCityConnections,
  buildCityDimensions,
  buildCityNetworkConnections,
  buildConnectivityRanking,
  buildContrastLines,
  buildForecastSnapshot,
  buildIntelligenceRanking,
  buildUrbanDNA,
  buildWeeklyLifeSnapshot,
  formatHoursLabel,
  formatDistance,
} from './cityMapPageUtils.js';
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

  const topCityRankByKey = useMemo(
    () => new Map(intelligenceRanking.map((cityRow, index) => [cityRow.key, index + 1])),
    [intelligenceRanking],
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
  const selectedUrbanDNA = focusCity ? buildUrbanDNA(focusCity, focusIntel?.signals ?? {}) : '';
  const selectedWeeklyLife = focusCity ? buildWeeklyLifeSnapshot(focusCity, focusDimensions, focusIntel?.signals ?? {}) : [];
  const selectedForecast = focusCity ? buildForecastSnapshot(focusIntel?.signals ?? {}, focusCity) : null;
  const contrastLines = focusSignals && comparisonSignals
    ? buildContrastLines(focusSignals, comparisonSignals, combinedLensWeights)
    : [];
  const explanationLines = focusIntel
    ? [...selectedCityTruthGood.slice(0, 3), ...focusIntel.modeDrivers.slice(0, 2).map((item) => item.label)]
    : [];

  const handleZoom = (direction) => zoomViewport(setZoom, direction);
  const handlePan = (dx, dy) => panViewport(setPan, dx, dy);
  const handleResetViewport = () => resetViewport(setZoom, setPan);

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
            <button type="button" className="city-map-mini-btn city-map-mini-btn--reset" onClick={handleResetViewport}>Reset</button>
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

          <CityMapInsightsPanel
            comparisonCity={comparisonCity}
            contrastLines={contrastLines}
            explanationLines={explanationLines}
            focusCity={focusCity}
            focusConnections={focusConnections}
            focusDimensions={focusDimensions}
            focusIntel={focusIntel}
            focusNeighborhoods={focusNeighborhoods}
            onSelectCity={onSelectCity}
            selectedCityTruthBad={selectedCityTruthBad}
            selectedCityTruthGood={selectedCityTruthGood}
            selectedForecast={selectedForecast}
            selectedModeProfile={selectedModeProfile}
            selectedPersonaProfile={selectedPersonaProfile}
            selectedUrbanDNA={selectedUrbanDNA}
            selectedWeeklyLife={selectedWeeklyLife}
            transportModeMeta={TRANSPORT_MODE_META}
            formatDistance={formatDistance}
            formatHoursLabel={formatHoursLabel}
            radarRows={mappableCityOptions}
          />

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
