import { cityGeoData, projectGeoPoint } from '../data/cityGeoData.js';
import { getNeighborhoodProfiles } from '../data/neighborhoodProfiles.js';

const VIEWBOX_WIDTH = 980;
const VIEWBOX_HEIGHT = 620;
const OVERLAY_OFFSETS = [
  { dx: 38, dy: -26 },
  { dx: -42, dy: -16 },
  { dx: 24, dy: 34 },
];

const CityMapCanvas = function cityMapCanvas({ cityOptions, selectedCityKey, onSelectCity }) {
  const selectedGeo = selectedCityKey ? cityGeoData[selectedCityKey] : null;
  const selectedCity = cityOptions.find((city) => city.key === selectedCityKey) ?? null;
  const overlays = selectedCity
    ? getNeighborhoodProfiles(selectedCity.key).slice(0, 3)
    : [];

  return (
    <svg
      className="city-map-svg"
      viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
      role="img"
      aria-label="Map of shortlisted relocation cities in Europe"
    >
      <defs>
        <linearGradient id="cityMapBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#e4f1f6" />
          <stop offset="100%" stopColor="#f7efe0" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} rx="24" fill="url(#cityMapBg)" />
      <g>
        {selectedGeo && overlays.length > 0 && (() => {
          const cityPoint = projectGeoPoint(selectedGeo, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);

          return (
            <g className="city-map-overlays" aria-label="Neighborhood overlays">
              {overlays.map((overlay, index) => {
                const offset = OVERLAY_OFFSETS[index % OVERLAY_OFFSETS.length];
                const x = cityPoint.x + offset.dx;
                const y = cityPoint.y + offset.dy;

                return (
                  <g key={overlay.name} className="city-map-overlay">
                    <circle cx={x} cy={y} r="22" />
                    <text x={x} y={y + 4} textAnchor="middle">{overlay.name}</text>
                  </g>
                );
              })}
            </g>
          );
        })()}

        {cityOptions.map((city) => {
          const geo = cityGeoData[city.key];
          if (!geo) {
            return null;
          }

          const point = projectGeoPoint(geo, VIEWBOX_WIDTH, VIEWBOX_HEIGHT);
          const isActive = city.key === selectedCityKey;

          return (
            <g
              key={city.key}
              className={`city-map-point${isActive ? ' city-map-point--active' : ''}`}
              onClick={() => onSelectCity(city.key)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onSelectCity(city.key);
                }
              }}
            >
              <circle cx={point.x} cy={point.y} r={isActive ? 10 : 7} />
              <text x={point.x + 12} y={point.y + 4}>{city.city}</text>
            </g>
          );
        })}
      </g>
    </svg>
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
          <div className="section-title">
            <p>City Map</p>
            <h3>Pick a city by location</h3>
            <span>Selecting a point updates the shared city context for explorer and dashboard cards.</span>
          </div>

          <p className="city-map-overlay-hint">Select a city to reveal top neighborhood overlays from the district table.</p>

          <CityMapCanvas cityOptions={cityOptions} selectedCityKey={selectedCity?.key ?? null} onSelectCity={onSelectCity} />

          <div className="city-map-selection">
            {selectedCity
              ? `${selectedCity.city}, ${selectedCity.country} selected`
              : 'No city selected'}
          </div>
        </section>
      </main>
    </div>
  );
};
