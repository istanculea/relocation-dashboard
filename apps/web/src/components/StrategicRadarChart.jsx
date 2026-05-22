/**
 * StrategicRadarChart.jsx — src/components/
 *
 * Dependency-free 5-axis radar chart rendered entirely with native React SVG.
 *
 * Features
 * ────────
 * • Plots the 5 MCDA strategic pillars for the selected city.
 * • Renders an animated translucent overlay polygon for the benchmark mean
 *   (average score across all currently filtered cities).
 * • CSS-only animation via a dashoffset/opacity keyframe; no JS timers.
 * • Zero external charting libraries.
 *
 * Integration
 * ───────────
 * File: src/components/StrategicRadarChart.jsx
 *
 * Usage in App.jsx (or any panel):
 *   import { StrategicRadarChart } from './components/StrategicRadarChart.jsx';
 *
 *   <StrategicRadarChart
 *     selectedCity={selectedCity}          // full city row object
 *     filteredRows={filteredComparisonRows} // for benchmark mean polygon
 *   />
 *
 * Props
 * ─────
 * @prop {object}   selectedCity   — full city row with strategicBalance.pillars
 * @prop {object[]} filteredRows   — all currently visible rows (benchmark mean)
 * @prop {number}   [size=420]     — SVG viewBox size in px
 */

import { useMemo } from 'react';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const PILLAR_KEYS = [
  'euRegistration',
  'diplomaRecognition',
  'realEstateHousing',
  'rentalMarket',
  'homeOwnership',
  'locationInfra',
  'cleanBasket',
  'childcareEducation',
  'healthMedical',
  'envPollution',
  'criminalityStreetSafe',
  'mobilityLogistics',
  'economyJobsTaxes',
  'climateResilience',
  'socialCapital',
];

const PILLAR_SHORT_LABELS = [
  'Residency',
  'Diploma',
  'Real Estate',
  'Rental',
  'Ownership',
  'Location',
  'Basket',
  'Childcare',
  'Healthcare',
  'Pollution',
  'Safety',
  'Mobility',
  'Economy',
  'Climate',
  'Social',
];

const RING_COUNT = 5;      // concentric reference rings (2, 4, 6, 8, 10)
const SCORE_MAX  = 10;

// ---------------------------------------------------------------------------
// Geometry helpers
// ---------------------------------------------------------------------------

/** Convert polar (angle in radians, radius) → {x, y} Cartesian, centred at (cx,cy) */
const polar = (cx, cy, r, angle) => ({
  x: cx + r * Math.cos(angle - Math.PI / 2),
  y: cy + r * Math.sin(angle - Math.PI / 2),
});

/** Build a closed SVG polygon points string from an array of {x,y} */
const pointsString = (pts) => pts.map(({ x, y }) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ');

/** Build an array of {x,y} vertices for a score array, normalised to radius `r` */
const scorePolygon = (scores, cx, cy, r) => {
  const n = scores.length;

  return scores.map((score, i) => {
    const angle = (2 * Math.PI * i) / n;
    const norm  = Math.max(0, Math.min(1, score / SCORE_MAX));

    return polar(cx, cy, r * norm, angle);
  });
};

// ---------------------------------------------------------------------------
// Data extraction
// ---------------------------------------------------------------------------

/**
 * Extract an ordered score array (length 5) from a city row's strategicBalance.
 * Returns 0 for any pillar that cannot be resolved.
 */
const extractScores = (row) => {
  if (!row?.strategicBalance?.pillars) return new Array(PILLAR_KEYS.length).fill(0);

  const map = new Map();

  for (const p of row.strategicBalance.pillars) {
    // Match by key first, then by partial label
    const key = PILLAR_KEYS.find(
      (k) => p.key === k
          || (p.label && PILLAR_SHORT_LABELS[PILLAR_KEYS.indexOf(k)]?.toLowerCase() === p.label.toLowerCase())
          || (p.label && p.label.toLowerCase().includes(k.slice(0, 7).toLowerCase())),
    );
    if (key) map.set(key, Number(p.score) || 0);
  }

  return PILLAR_KEYS.map((k) => map.get(k) ?? 0);
};

/**
 * Compute per-pillar mean score across an array of rows.
 */
const meanScores = (rows) => {
  if (!rows.length) return new Array(PILLAR_KEYS.length).fill(0);

  const sums = new Array(PILLAR_KEYS.length).fill(0);

  for (const row of rows) {
    const scores = extractScores(row);

    for (let i = 0; i < scores.length; i++) {
      sums[i] += scores[i];
    }
  }

  return sums.map((s) => s / rows.length);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const StrategicRadarChart = ({ selectedCity = null, filteredRows = [], size = 420 }) => {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.38;   // radar radius
  const labelR = size * 0.47;   // label orbit

  const n = PILLAR_KEYS.length;
  const axes = useMemo(
    () =>
      PILLAR_KEYS.map((key, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;

        return {
          key,
          label:   PILLAR_SHORT_LABELS[i],
          end:     polar(cx, cy, outerR, angle + Math.PI / 2),
          labelPt: polar(cx, cy, labelR, angle + Math.PI / 2),
        };
      }),
    [cx, cy, outerR, labelR, n],
  );

  // Score data
  const cityScores  = useMemo(() => extractScores(selectedCity), [selectedCity]);
  const benchScores = useMemo(() => meanScores(filteredRows), [filteredRows]);

  // Polygon vertices
  const cityPoly  = useMemo(() => scorePolygon(cityScores,  cx, cy, outerR), [cityScores,  cx, cy, outerR]);
  const benchPoly = useMemo(() => scorePolygon(benchScores, cx, cy, outerR), [benchScores, cx, cy, outerR]);

  // Concentric rings
  const rings = useMemo(
    () =>
      Array.from({ length: RING_COUNT }, (_, i) => {
        const r = outerR * ((i + 1) / RING_COUNT);
        const pts = PILLAR_KEYS.map((_, j) => {
          const angle = (2 * Math.PI * j) / n - Math.PI / 2;
          return polar(cx, cy, r, angle + Math.PI / 2);
        });

        return { r, label: ((i + 1) / RING_COUNT) * SCORE_MAX, pts };
      }),
    [cx, cy, outerR, n],
  );

  const cityName = selectedCity?.city ?? 'No city selected';

  // ── Empty / null state guard ─────────────────────────────────────────────
  if (!selectedCity && filteredRows.length === 0) {
    return (
      <figure className="radar-chart-figure radar-chart-figure--empty">
        <div className="radar-empty-state">
          <span className="radar-empty-state__icon" aria-hidden="true">◎</span>
          <p className="radar-empty-state__text">Select a city or apply filters to see the strategic radar.</p>
        </div>
      </figure>
    );
  }

  // Axis label text-anchor: left side → 'end', right side → 'start', top/bottom → 'middle'
  const textAnchor = (pt) => {
    const dx = pt.x - cx;
    if (Math.abs(dx) < size * 0.04) return 'middle';
    return dx < 0 ? 'end' : 'start';
  };

  return (
    <figure className="radar-chart-figure">
      <figcaption className="radar-chart-caption">
        <span className="radar-chart-city">{cityName}</span>
        <span className="radar-chart-sub">{PILLAR_KEYS.length}-pillar strategic balance vs. filtered mean</span>
      </figcaption>

      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="radar-chart-svg"
        role="img"
        aria-label={`Radar chart for ${cityName} across ${PILLAR_KEYS.length} strategic pillars`}
      >
        <defs>
          {/* Gradient fills */}
          <radialGradient id="radar-city-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--radar-city-core,  #2563eb)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--radar-city-edge,  #1d4ed8)" stopOpacity="0.18" />
          </radialGradient>
          <radialGradient id="radar-bench-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--radar-bench-core, #10b981)" stopOpacity="0.30" />
            <stop offset="100%" stopColor="var(--radar-bench-edge, #059669)" stopOpacity="0.10" />
          </radialGradient>
        </defs>

        {/* ── Background rings ────────────────────────────────────── */}
        {rings.map(({ pts, label }, i) => (
          <g key={i}>
            <polygon
              points={pointsString(pts)}
              fill="none"
              stroke="var(--radar-ring, rgba(148,163,184,0.35))"
              strokeWidth="0.8"
            />
            {/* Ring value label at the top axis */}
            <text
              x={cx}
              y={polar(cx, cy, (outerR * (i + 1)) / RING_COUNT, 0).y - 3}
              className="radar-ring-label"
              textAnchor="middle"
              dominantBaseline="auto"
            >
              {label.toFixed(0)}
            </text>
          </g>
        ))}

        {/* ── Axis spokes ─────────────────────────────────────────── */}
        {axes.map(({ key, end }) => (
          <line
            key={key}
            x1={cx}
            y1={cy}
            x2={end.x}
            y2={end.y}
            stroke="var(--radar-spoke, rgba(148,163,184,0.4))"
            strokeWidth="0.8"
          />
        ))}

        {/* ── Benchmark mean polygon (rendered first / below) ──────── */}
        {filteredRows.length > 0 && (
          <polygon
            points={pointsString(benchPoly)}
            fill="url(#radar-bench-grad)"
            stroke="var(--radar-bench-stroke, #10b981)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            className="radar-bench-poly"
          />
        )}

        {/* ── Selected city polygon ────────────────────────────────── */}
        <polygon
          points={pointsString(cityPoly)}
          fill="url(#radar-city-grad)"
          stroke="var(--radar-city-stroke, #2563eb)"
          strokeWidth="2"
          className="radar-city-poly"
        />

        {/* ── Vertex dots for selected city ───────────────────────── */}
        {cityPoly.map(({ x, y }, i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3.5"
            fill="var(--radar-city-stroke, #2563eb)"
            stroke="white"
            strokeWidth="1.2"
            className="radar-city-dot"
          >
            <title>{PILLAR_SHORT_LABELS[i]}: {cityScores[i].toFixed(1)}</title>
          </circle>
        ))}

        {/* ── Axis labels ─────────────────────────────────────────── */}
        {axes.map(({ key, label, labelPt }) => (
          <text
            key={key}
            x={labelPt.x}
            y={labelPt.y}
            className="radar-axis-label"
            textAnchor={textAnchor(labelPt)}
            dominantBaseline="middle"
          >
            {label}
          </text>
        ))}

        {/* ── Centre dot ──────────────────────────────────────────── */}
        <circle cx={cx} cy={cy} r="2.5" fill="var(--radar-spoke, #94a3b8)" />
      </svg>

      {/* ── Legend ──────────────────────────────────────────────────── */}
      <div className="radar-legend">
        <span className="radar-legend-item radar-legend-item--city">
          <span className="radar-legend-swatch" />
          {cityName}
        </span>
        {filteredRows.length > 0 && (
          <span className="radar-legend-item radar-legend-item--bench">
            <span className="radar-legend-swatch radar-legend-swatch--bench" />
            Filtered mean ({filteredRows.length} cities)
          </span>
        )}
      </div>
    </figure>
  );
};
