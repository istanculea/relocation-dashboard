/**
 * ClimateLogisticsPanel.jsx — src/components/
 *
 * Micro-climate & urban mobility matrix for a single selected city.
 *
 * Renders two sub-sections:
 *
 *   1. SUNSHINE / RAINFALL TIMELINE
 *      Horizontal flex timeline mapping monthly sunshine hours and
 *      rainfall totals using pure CSS sizing (no chart library needed).
 *      Data source: city.city360.ecoFactors or city.mobility fields.
 *
 *   2. CAR-FREE INDEX GRID
 *      Visual matrix contrasting:
 *        • Bike-lane km / score
 *        • Transit monthly pass cost
 *        • Car-need category (Low / Medium / High)
 *        • 15-minute city status
 *        • PM2.5 air quality
 *
 * ── Integration ──────────────────────────────────────────────────────────────
 * Render inside the City Explorer panel or as a standalone section in App.jsx.
 *
 *   import { ClimateLogisticsPanel } from './components/ClimateLogisticsPanel.jsx';
 *   <ClimateLogisticsPanel city={selectedCity} />
 *
 * Props
 * ─────
 * @prop {object} city  — full city row object (from scoreRankingRows / selectedCity)
 */

// ---------------------------------------------------------------------------
// Static sunshine / rainfall fallback data (EU city clusters)
// ---------------------------------------------------------------------------

// Average monthly sunshine hours (12-month array starting January)
const SUNSHINE_PROFILES = {
  iberia:      [160, 165, 195, 215, 250, 285, 320, 305, 250, 205, 155, 145],
  italy_north: [105, 120, 155, 185, 215, 235, 270, 255, 190, 145, 105,  90],
  italy_south: [150, 165, 195, 225, 265, 295, 335, 320, 260, 205, 150, 135],
  germany:     [ 55,  75, 120, 155, 195, 205, 210, 195, 150, 105,  60,  45],
  austria:     [ 65,  85, 135, 165, 205, 215, 240, 225, 165, 115,  65,  50],
  romania:     [ 75,  95, 145, 180, 225, 255, 290, 280, 215, 155,  90,  65],
  ireland:     [ 55,  70, 100, 135, 165, 160, 145, 140, 115,  90,  60,  50],
  default:     [120, 135, 165, 195, 225, 245, 265, 255, 210, 165, 120, 105],
};

// Average monthly rainfall mm (12-month array starting January)
const RAINFALL_PROFILES = {
  iberia:      [ 85,  70,  65,  55,  45,  20,  10,  15,  35,  60,  80,  90],
  italy_north: [ 55,  55,  65,  70,  80,  70,  55,  55,  65,  75,  75,  60],
  italy_south: [ 65,  60,  55,  45,  30,  15,   5,   8,  25,  55,  65,  70],
  germany:     [ 55,  45,  50,  50,  65,  75,  75,  65,  55,  45,  55,  55],
  austria:     [ 45,  40,  50,  55,  80,  90,  90,  80,  65,  55,  50,  45],
  romania:     [ 35,  35,  40,  50,  60,  65,  60,  50,  45,  40,  40,  38],
  ireland:     [105,  75,  75,  60,  60,  65,  65,  75,  75,  85, 100, 110],
  default:     [ 65,  60,  60,  60,  65,  60,  50,  50,  55,  65,  65,  65],
};

// Average monthly sunshine hours — per-city overrides (Jan–Dec)
// Sources: Klimatabelle / Climate-data.org / AEMET / Agência Portuguesa do Ambiente
const CITY_SUNSHINE_OVERRIDES = {
  // Iberia
  bilbao:      [100, 115, 155, 165, 200, 215, 250, 240, 195, 155, 105,  90],
  malaga:      [185, 200, 235, 265, 305, 335, 375, 360, 290, 235, 185, 165],
  // Italy north (incl. Lugo di Ravenna, Emilia-Romagna)
  lugo:        [105, 125, 158, 182, 218, 242, 278, 268, 198, 148, 102,  88],
  bologna:     [100, 120, 155, 180, 215, 240, 275, 265, 195, 145, 100,  85],
  milan:       [ 95, 115, 155, 180, 215, 235, 270, 260, 190, 140,  95,  80],
  reggioEmilia:[105, 125, 160, 185, 220, 245, 275, 268, 195, 148, 102,  88],
  udine:       [100, 118, 155, 185, 215, 235, 270, 255, 190, 142,  98,  85],
  padova:      [ 95, 115, 150, 180, 215, 240, 270, 260, 185, 140,  95,  82],
  trento:      [105, 125, 165, 185, 215, 240, 275, 262, 190, 148,  98,  88],
  sanLazzaro:  [102, 122, 158, 182, 218, 242, 272, 265, 192, 146, 100,  86],
  // Germany
  berlin:      [ 55,  75, 120, 155, 200, 210, 215, 200, 155, 110,  60,  45],
  cologne:     [ 50,  70, 115, 150, 195, 205, 210, 195, 150, 108,  58,  42],
  valencia:      [146, 157, 198, 218, 261, 291, 318, 303, 232, 182, 143, 131],
  hamburg:     [ 48,  65, 110, 145, 185, 190, 195, 180, 145, 102,  55,  40],
  munich:      [ 68,  90, 140, 170, 210, 220, 240, 225, 168, 120,  68,  55],
  // Austria
  vienna:      [ 62,  85, 135, 165, 205, 215, 240, 225, 168, 118,  65,  50],
  salzburg:    [ 58,  78, 130, 162, 200, 210, 235, 222, 165, 115,  60,  48],
  graz:        [ 65,  88, 138, 168, 208, 218, 242, 228, 170, 120,  68,  52],
  // Romania
  bucharest:   [ 75,  95, 148, 182, 228, 258, 295, 282, 215, 158,  90,  65],
  // Ireland
  dublin:      [ 55,  72, 105, 140, 170, 165, 150, 148, 118,  92,  62,  52],
  // UK
  bristol:     [ 60,  78, 112, 150, 180, 175, 165, 155, 130,  95,  65,  55],
  edinburgh:   [ 48,  65,  98, 130, 160, 158, 145, 140, 118,  85,  55,  42],
};

// Average monthly rainfall mm — per-city overrides (Jan–Dec)
const CITY_RAINFALL_OVERRIDES = {
  // Iberia
  bilbao:      [115,  90,  85,  75,  70,  45,  30,  35,  55,  85, 105, 115],
  malaga:      [ 80,  60,  55,  38,  22,   5,   1,   3,  20,  50,  72,  85],
  // Italy north (incl. Lugo di Ravenna, Emilia-Romagna)
  lugo:        [ 46,  46,  56,  66,  70,  58,  42,  46,  60,  68,  68,  50],
  bologna:     [ 48,  48,  58,  68,  72,  62,  45,  48,  62,  70,  70,  52],
  milan:       [ 50,  52,  62,  72,  80,  72,  52,  52,  68,  72,  72,  58],
  reggioEmilia:[ 45,  46,  58,  66,  70,  60,  44,  46,  60,  68,  68,  50],
  udine:       [ 85,  82,  90,  98, 108,  95,  75,  80,  98, 105, 100,  88],
  padova:      [ 55,  52,  62,  70,  78,  70,  52,  52,  68,  72,  72,  58],
  trento:      [ 62,  58,  68,  78,  88,  78,  58,  62,  72,  80,  78,  64],
  sanLazzaro:  [ 47,  47,  58,  67,  71,  61,  44,  47,  61,  69,  69,  51],
  // Germany
  berlin:      [ 45,  38,  42,  42,  55,  68,  68,  58,  48,  38,  48,  50],
  cologne:     [ 58,  48,  52,  52,  65,  78,  78,  68,  58,  48,  55,  58],
  valencia:      [ 32,  28,  35,  38,  30,  18,   8,  12,  52,  75,  56,  38],
  hamburg:     [ 65,  52,  55,  52,  65,  75,  72,  68,  62,  52,  62,  68],
  munich:      [ 55,  48,  58,  62,  85,  95,  95,  88,  72,  62,  58,  58],
  // Austria
  vienna:      [ 40,  38,  46,  52,  72,  82,  82,  72,  58,  48,  48,  42],
  salzburg:    [ 78,  68,  78,  82, 110, 125, 125, 112,  92,  78,  80,  80],
  graz:        [ 52,  48,  58,  65,  88, 100, 100,  90,  72,  58,  58,  55],
  // Romania
  bucharest:   [ 38,  38,  42,  52,  62,  68,  62,  52,  48,  42,  42,  40],
  // Ireland
  dublin:      [105,  75,  78,  62,  62,  68,  68,  80,  78,  88, 102, 112],
  // UK
  bristol:     [ 95,  72,  72,  60,  58,  65,  65,  72,  72,  82,  92, 100],
  edinburgh:   [ 95,  72,  78,  60,  58,  65,  65,  75,  75,  85,  98, 108],
};

// Average monthly high temperature °C (Jan–Dec) — per-country profiles
const TEMP_PROFILES = {
  iberia:      [14, 15, 18, 21, 24, 28, 32, 32, 28, 22, 17, 14],
  italy_north: [ 5,  8, 12, 17, 22, 26, 30, 29, 24, 17, 11,  6],
  italy_south: [13, 14, 17, 20, 24, 28, 32, 32, 27, 22, 17, 14],
  germany:     [ 3,  5,  9, 15, 20, 24, 26, 25, 20, 14,  7,  4],
  austria:     [ 3,  5, 10, 15, 20, 24, 26, 25, 20, 14,  7,  3],
  romania:     [ 3,  5, 11, 18, 24, 28, 31, 30, 24, 16,  8,  4],
  ireland:     [ 8,  8, 10, 13, 16, 18, 20, 20, 17, 14, 10,  8],
  default:     [ 8, 10, 14, 18, 22, 26, 29, 28, 23, 17, 12,  9],
};

// Per-city temperature high overrides (Jan–Dec)
const CITY_TEMP_OVERRIDES = {
  bilbao:      [12, 13, 15, 18, 21, 24, 26, 27, 24, 20, 15, 12],
  malaga:      [17, 18, 21, 23, 26, 29, 33, 33, 30, 25, 20, 17],
  // Lugo di Ravenna — Po Valley / Emilia-Romagna
  lugo:        [ 6,  8, 13, 18, 23, 27, 31, 30, 25, 19, 12,  7],
  bologna:     [ 6,  8, 13, 18, 23, 27, 31, 30, 25, 19, 12,  7],
  milan:       [ 5,  7, 12, 17, 22, 26, 30, 29, 24, 17, 11,  6],
  reggioEmilia:[ 6,  8, 13, 18, 23, 27, 31, 30, 25, 19, 12,  7],
  udine:       [ 5,  7, 12, 17, 22, 26, 29, 28, 23, 17, 10,  5],
  padova:      [ 6,  8, 13, 18, 23, 27, 30, 29, 24, 18, 11,  6],
  trento:      [ 4,  6, 11, 16, 21, 25, 28, 27, 22, 16,  9,  4],
  sanLazzaro:  [ 6,  8, 13, 18, 23, 27, 31, 30, 25, 19, 12,  7],
  bergamo:     [ 5,  7, 12, 17, 22, 26, 30, 29, 24, 17, 11,  6],
  parma:       [ 5,  8, 13, 18, 23, 27, 31, 30, 25, 19, 12,  6],
  verona:      [ 5,  8, 13, 18, 23, 27, 30, 29, 24, 17, 11,  6],
  modena:      [ 5,  8, 13, 18, 23, 27, 31, 30, 25, 19, 12,  6],
  berlin:      [ 3,  4,  9, 15, 20, 24, 26, 26, 21, 14,  8,  4],
  cologne:     [ 5,  6, 10, 15, 20, 23, 25, 25, 21, 15,  9,  5],
  valencia:      [15, 16, 19, 21, 24, 28, 31, 32, 28, 23, 18, 15],
  hamburg:     [ 4,  4,  8, 13, 18, 21, 23, 23, 19, 14,  8,  5],
  munich:      [ 1,  3,  8, 13, 18, 22, 24, 24, 19, 13,  6,  2],
  vienna:      [ 3,  5, 10, 16, 21, 25, 27, 26, 21, 14,  7,  3],
  salzburg:    [ 3,  4,  9, 14, 19, 22, 25, 24, 19, 13,  6,  3],
  graz:        [ 3,  5, 10, 15, 20, 24, 26, 26, 21, 14,  7,  3],
  bucharest:   [ 3,  5, 11, 18, 24, 28, 31, 31, 25, 17,  9,  4],
  dublin:      [ 8,  8, 10, 13, 16, 18, 20, 20, 17, 14, 10,  8],
  bristol:     [ 8,  8, 11, 14, 17, 20, 22, 22, 19, 15, 11,  8],
  edinburgh:   [ 7,  7,  9, 12, 15, 18, 20, 20, 17, 13,  9,  7],
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const getClimateProfile = (country = '') => {
  const c = country.toLowerCase();
  if (c.includes('spain')) return 'iberia';
  if (c.includes('italy')) {
    // Rough north vs south split — key-level overrides handle finer distinctions
    return 'italy_north';
  }
  if (c.includes('germany')) return 'germany';
  if (c.includes('austria')) return 'austria';
  if (c.includes('romania')) return 'romania';
  if (c.includes('ireland') || c.includes('united kingdom')) return 'ireland';
  return 'default';
};

const getSunshineData = (city) => {
  if (city?.key && CITY_SUNSHINE_OVERRIDES[city.key]) {
    return CITY_SUNSHINE_OVERRIDES[city.key];
  }
  return SUNSHINE_PROFILES[getClimateProfile(city?.country)] ?? SUNSHINE_PROFILES.default;
};

const getRainfallData = (city) => {
  if (city?.key && CITY_RAINFALL_OVERRIDES[city.key]) {
    return CITY_RAINFALL_OVERRIDES[city.key];
  }
  return RAINFALL_PROFILES[getClimateProfile(city?.country)] ?? RAINFALL_PROFILES.default;
};

const getTempData = (city) => {
  if (city?.key && CITY_TEMP_OVERRIDES[city.key]) {
    return CITY_TEMP_OVERRIDES[city.key];
  }
  return TEMP_PROFILES[getClimateProfile(city?.country)] ?? TEMP_PROFILES.default;
};

// Temperature → background colour (muted warm palette)
const tempBg = (t) => {
  if (t <=  5) return '#dbeafe';
  if (t <= 10) return '#bfdbfe';
  if (t <= 15) return '#d1fae5';
  if (t <= 20) return '#fef9c3';
  if (t <= 25) return '#fde68a';
  if (t <= 30) return '#fed7aa';
  return '#fca5a5';
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const parseBikeLanes = (text) => {
  const match = String(text ?? '').match(/(\d+(?:\.\d+)?)\s*\/\s*10/);
  if (match) return { type: 'score', value: parseFloat(match[1]), max: 10 };

  const km = String(text ?? '').match(/(\d+)\s*km/i);
  if (km) return { type: 'km', value: parseInt(km[1], 10), max: null };

  return { type: 'text', value: text ?? 'N/A', max: null };
};

const carNeedColour = (text) => {
  const t = String(text ?? '').toLowerCase();
  if (t.includes('low')) return 'carfree--low';
  if (t.includes('medium')) return 'carfree--medium';
  return 'carfree--high';
};

const pm25Label = (value) => {
  if (!Number.isFinite(value)) return { label: 'N/A', cls: '' };
  if (value <= 10) return { label: `${value} µg/m³ — Excellent`, cls: 'aqi--excellent' };
  if (value <= 12) return { label: `${value} µg/m³ — Good`,      cls: 'aqi--good' };
  if (value <= 15) return { label: `${value} µg/m³ — Moderate`,  cls: 'aqi--moderate' };
  if (value <= 20) return { label: `${value} µg/m³ — Elevated`,  cls: 'aqi--elevated' };
  return               { label: `${value} µg/m³ — Poor`,         cls: 'aqi--poor' };
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

export const SunshineRainfallTimeline = ({ city }) => {
  const sun  = getSunshineData(city);
  const rain = getRainfallData(city);
  const temp = getTempData(city);

  const maxSun  = Math.max(...sun);
  const maxRain = Math.max(...rain);

  const annualSun  = sun.reduce((a, b) => a + b, 0);
  const annualRain = rain.reduce((a, b) => a + b, 0);

  return (
    <div className="climate-timeline">
      <div className="climate-timeline__header">
        <h4 className="climate-timeline__title">Monthly Climate Profile</h4>
        <div className="climate-timeline__totals">
          <span title="Total annual sunshine hours">☀ {annualSun.toLocaleString()} hrs/yr</span>
          <span title="Total annual rainfall">🌧 {annualRain} mm/yr</span>
        </div>
      </div>
      <p className="climate-timeline__note">
        Representative averages for {city?.city ?? city?.country ?? 'this location'} · Jan–Dec.
      </p>

      {/* Temperature strip */}
      <div className="climate-timeline__row climate-timeline__row--temp">
        <span className="climate-timeline__axis-label">🌡 High °C</span>
        <div className="climate-temp-strip">
          {temp.map((t, i) => (
            <div
              key={i}
              className="climate-temp-cell"
              style={{ background: tempBg(t) }}
              title={`${MONTHS[i]}: avg high ${t}°C`}
            >
              <span className="climate-temp-cell__num">{t}°</span>
              <span className="climate-temp-cell__mo">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Sunshine bars */}
      <div className="climate-timeline__row" role="list" aria-label="Monthly sunshine hours">
        <span className="climate-timeline__axis-label">☀ Sun (hrs)</span>
        <div className="climate-timeline__bars">
          {sun.map((hrs, i) => (
            <div key={i} className="climate-bar climate-bar--sun" role="listitem" aria-label={`${MONTHS[i]}: ${hrs} hrs`}>
              <div className="climate-bar__track">
                <span className="climate-bar__val">{hrs}</span>
                <div
                  className="climate-bar__fill"
                  style={{ height: `${Math.round((hrs / maxSun) * 100)}%` }}
                />
              </div>
              <span className="climate-bar__month">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Rainfall bars */}
      <div className="climate-timeline__row" role="list" aria-label="Monthly rainfall mm">
        <span className="climate-timeline__axis-label">🌧 Rain (mm)</span>
        <div className="climate-timeline__bars">
          {rain.map((mm, i) => (
            <div key={i} className="climate-bar climate-bar--rain" role="listitem" aria-label={`${MONTHS[i]}: ${mm} mm`}>
              <div className="climate-bar__track">
                <span className="climate-bar__val">{mm}</span>
                <div
                  className="climate-bar__fill"
                  style={{ height: `${Math.round((mm / maxRain) * 100)}%` }}
                />
              </div>
              <span className="climate-bar__month">{MONTHS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CarFreeMatrix = ({ city }) => {
  const mob     = city?.mobility ?? {};
  const bike    = parseBikeLanes(mob.bikeLanes);
  const pm25    = pm25Label(mob.pm25);
  const carNeed = mob.carNeed ?? 'N/A';
  const pass    = mob.pass ?? 'N/A';
  const transit = mob.transitSummary ?? mob.fifteenMinute ?? null;

  return (
    <div className="carfree-matrix">
      <h4 className="carfree-matrix__title">Car-Free Index</h4>

      <dl className="carfree-grid">
        {/* Bike lanes */}
        <div className="carfree-cell">
          <dt className="carfree-cell__label">Cycling infrastructure</dt>
          <dd className="carfree-cell__value">
            {bike.type === 'score' && (
              <span className="carfree-score-bar" aria-label={`Bike score: ${bike.value}/10`}>
                <span
                  className="carfree-score-bar__fill"
                  style={{ width: `${(bike.value / bike.max) * 100}%` }}
                />
                <span className="carfree-score-bar__label">{bike.value} / 10</span>
              </span>
            )}
            {bike.type === 'km' && <span>{bike.value} km of lanes</span>}
            {bike.type === 'text' && <span>{bike.value}</span>}
          </dd>
        </div>

        {/* Car need */}
        <div className="carfree-cell">
          <dt className="carfree-cell__label">Car dependency</dt>
          <dd className={`carfree-cell__value carfree-cell__value--tag ${carNeedColour(carNeed)}`}>
            {carNeed}
          </dd>
        </div>

        {/* Transit pass */}
        <div className="carfree-cell">
          <dt className="carfree-cell__label">Monthly transit pass</dt>
          <dd className="carfree-cell__value carfree-cell__value--mono">{pass}</dd>
        </div>

        {/* Air quality */}
        <div className="carfree-cell">
          <dt className="carfree-cell__label">Air quality (PM2.5)</dt>
          <dd className={`carfree-cell__value ${pm25.cls}`}>{pm25.label}</dd>
        </div>

        {/* Transit summary */}
        {transit && (
          <div className="carfree-cell carfree-cell--wide">
            <dt className="carfree-cell__label">Transit profile</dt>
            <dd className="carfree-cell__value">{transit}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * ClimateLogisticsPanel
 *
 * @param {{ city: object }} props
 */
export const ClimateLogisticsPanel = ({ city }) => {
  if (!city) return null;

  return (
    <section
      className="climate-logistics-panel panel"
      aria-label={`Climate and mobility data for ${city.city}`}
    >
      <header className="climate-logistics-panel__header">
        <h3 className="climate-logistics-panel__title">
          Climate & Mobility — {city.city}
        </h3>
      </header>

      <div className="climate-logistics-panel__body">
        <SunshineRainfallTimeline city={city} />
        <CarFreeMatrix city={city} />
      </div>
    </section>
  );
};
