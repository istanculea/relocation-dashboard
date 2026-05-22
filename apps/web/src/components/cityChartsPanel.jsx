import { useMemo, useState } from 'react';
import { priorityPresets, scenarioMeta } from '../data/dashboardConfig.js';
import { formatScore } from './familyComparisonTableHelpers.js';

// ── Colour helpers ─────────────────────────────────────────────
const COUNTRY_COLOURS = {
  Italy: '#2f7f62',
  Germany: '#376a92',
  Austria: '#6a5bab',
  Spain: '#c57c2a',
  Romania: '#b24d48',
  'United Kingdom': '#5a7a55',
  default: '#5f696d',
};

// 12-stop distinct palette — one per city slot, no two adjacent colours too similar
const CITY_PALETTE = [
  '#2f7f62', '#376a92', '#c57c2a', '#b24d48',
  '#6a5bab', '#3d8a8a', '#a06f30', '#5a7a55',
  '#7a4f9e', '#2d6b8e', '#8b4513', '#4a7c59',
];

// 10-stop accessible palette for multi-city radar
const RADAR_PALETTE = CITY_PALETTE;

const scoreColour = (score) => {
  if (score >= 8.2) return '#1d6049';
  if (score >= 7.0) return '#274d75';
  if (score >= 6.0) return '#845c14';
  return '#843d2b';
};

const tierLabel = (score) => {
  if (score >= 8.2) return 'Strong';
  if (score >= 7.0) return 'Good';
  if (score >= 6.0) return 'Mixed';
  return 'Drag';
};

const safeSpan = (minValue, maxValue, fallback = 1) => {
  const span = maxValue - minValue;
  return span > 0 ? span : fallback;
};

const paddedDomain = (values, {
  padRatio = 0.08,
  minSpan = 1,
  floor = Number.NEGATIVE_INFINITY,
  ceil = Number.POSITIVE_INFINITY,
  round = null,
} = {}) => {
  if (!values.length) {
    return { min: 0, max: minSpan };
  }

  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const span = Math.max(rawMax - rawMin, minSpan);
  const pad = span * padRatio;

  let min = Math.max(floor, rawMin - pad);
  let max = Math.min(ceil, rawMax + pad);

  if (round) {
    min = round.down(min);
    max = round.up(max);
  }

  if (max <= min) {
    max = Math.min(ceil, min + minSpan);
  }

  return { min, max };
};

// ── Quality of Life Bubble Chart ───────────────────────────────
// X = monthly budget, Y = QoL (strategic balance score), bubble size = active lens score
const BubbleChart = function bubbleChart({ rows, selectedCityKey, onSelectCity, scenarioKey, lensKey }) {
  const [tooltip, setTooltip] = useState(null);

  if (!rows.length) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3>Quality of Life vs Budget</h3>
          <p>Chart unavailable because there are no cities in the current result set.</p>
        </div>
      </div>
    );
  }

  const W = 760;
  const H = 480;
  const PAD = { top: 40, right: 36, bottom: 72, left: 74 };
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;

  // Assign a stable per-city colour index based on sorted key order so colours don't jump
  const cityColourMap = useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.key.localeCompare(b.key));
    return Object.fromEntries(sorted.map((r, i) => [r.key, CITY_PALETTE[i % CITY_PALETTE.length]]));
  }, [rows]);

  const budgets = rows.map((r) => r.budgets[scenarioKey].midpoint);
  const qolScores = rows.map((r) => r.strategicBalance.weightedScore);
  const lensScores = rows.map((r) => r.activeWeightedScore);

  const { min: minBudget, max: maxBudget } = paddedDomain(budgets, {
    padRatio: 0.06,
    minSpan: 400,
    round: {
      down: (value) => Math.floor(value / 200) * 200,
      up: (value) => Math.ceil(value / 200) * 200,
    },
  });

  const { min: minQol, max: maxQol } = paddedDomain(qolScores, {
    padRatio: 0.12,
    minSpan: 1,
    floor: 0,
    ceil: 10,
  });

  const minLens = Math.min(...lensScores);
  const maxLens = Math.max(...lensScores);

  const midBudget = (minBudget + maxBudget) / 2;
  const midQol = (minQol + maxQol) / 2;

  const budgetSpan = safeSpan(minBudget, maxBudget, 1);
  const qolSpan = safeSpan(minQol, maxQol, 1);

  const toX = (budget) => PAD.left + ((budget - minBudget) / budgetSpan) * plotW;
  const toY = (score) => PAD.top + plotH - ((score - minQol) / qolSpan) * plotH;
  const toR = (score) => 7 + ((score - minLens) / (Math.max(maxLens - minLens, 0.01))) * 11;

  const xTicks = 5;
  const yTicks = 5;
  const xStep = (maxBudget - minBudget) / xTicks;
  const yStep = (maxQol - minQol) / yTicks;
  const xTickValues = Array.from({ length: xTicks + 1 }, (_, i) => minBudget + i * xStep);
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => minQol + i * yStep);

  // Quadrant midpoints for labels
  const qMidX1 = toX((minBudget + midBudget) / 2);
  const qMidX2 = toX((midBudget + maxBudget) / 2);
  const qMidY1 = toY((midQol + maxQol) / 2);
  const qMidY2 = toY((minQol + midQol) / 2);

  // Smart label placement: position label above/below depending on vertical space
  const getLabelAnchor = (cx) => {
    if (cx < PAD.left + plotW * 0.2) return 'start';
    if (cx > PAD.left + plotW * 0.8) return 'end';
    return 'middle';
  };
  const getLabelDy = (cy, r) => (cy - r - 8 < PAD.top + 10 ? r + 16 : -(r + 6));

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>Quality of Life vs Budget</h3>
        <p>
          Each bubble plots a city's Quality of Life score (Y axis, Balanced Decision lens) against its monthly household budget (X axis,{' '}
          <strong>{scenarioMeta[scenarioKey].label}</strong> scenario). Bubble size reflects the active{' '}
          <strong>{priorityPresets[lensKey].label}</strong> lens score — larger bubble = higher lens ranking.
          Top-left quadrant is the sweet spot: high quality of life at lower cost.
        </p>
      </div>
      <div className="chart-scroll-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="scatter-svg" aria-label="Bubble chart: Quality of life vs monthly budget">
          {/* Quadrant fills */}
          <rect x={PAD.left} y={PAD.top} width={toX(midBudget) - PAD.left} height={toY(midQol) - PAD.top}
            fill="rgba(47,127,98,0.06)" />
          <rect x={toX(midBudget)} y={PAD.top} width={PAD.left + plotW - toX(midBudget)} height={toY(midQol) - PAD.top}
            fill="rgba(55,106,146,0.04)" />
          <rect x={PAD.left} y={toY(midQol)} width={toX(midBudget) - PAD.left} height={PAD.top + plotH - toY(midQol)}
            fill="rgba(197,124,42,0.04)" />
          <rect x={toX(midBudget)} y={toY(midQol)} width={PAD.left + plotW - toX(midBudget)} height={PAD.top + plotH - toY(midQol)}
            fill="rgba(178,77,72,0.04)" />

          {/* Quadrant labels */}
          <text x={qMidX1} y={qMidY1} textAnchor="middle" fontSize="10" fill="rgba(47,127,98,0.5)" fontWeight="700" letterSpacing="0.06em">BEST VALUE</text>
          <text x={qMidX2} y={qMidY1} textAnchor="middle" fontSize="10" fill="rgba(55,106,146,0.4)" fontWeight="700" letterSpacing="0.06em">PREMIUM</text>
          <text x={qMidX1} y={qMidY2} textAnchor="middle" fontSize="10" fill="rgba(197,124,42,0.4)" fontWeight="700" letterSpacing="0.06em">BUDGET</text>
          <text x={qMidX2} y={qMidY2} textAnchor="middle" fontSize="10" fill="rgba(178,77,72,0.4)" fontWeight="700" letterSpacing="0.06em">POOR VALUE</text>

          {/* Divider lines */}
          <line x1={toX(midBudget)} y1={PAD.top} x2={toX(midBudget)} y2={PAD.top + plotH}
            stroke="rgba(31,42,46,0.12)" strokeWidth="1" strokeDasharray="5,4" />
          <line x1={PAD.left} y1={toY(midQol)} x2={PAD.left + plotW} y2={toY(midQol)}
            stroke="rgba(31,42,46,0.12)" strokeWidth="1" strokeDasharray="5,4" />

          {/* Grid lines */}
          {xTickValues.map((val) => (
            <line key={`xg-${val}`} x1={toX(val)} y1={PAD.top} x2={toX(val)} y2={PAD.top + plotH}
              stroke="rgba(31,42,46,0.05)" strokeWidth="1" />
          ))}
          {yTickValues.map((val) => (
            <line key={`yg-${val}`} x1={PAD.left} y1={toY(val)} x2={PAD.left + plotW} y2={toY(val)}
              stroke="rgba(31,42,46,0.05)" strokeWidth="1" />
          ))}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="rgba(31,42,46,0.2)" strokeWidth="1.5" />
          <line x1={PAD.left} y1={PAD.top + plotH} x2={PAD.left + plotW} y2={PAD.top + plotH} stroke="rgba(31,42,46,0.2)" strokeWidth="1.5" />

          {/* X ticks */}
          {xTickValues.map((val) => (
            <g key={`xt-${val}`}>
              <line x1={toX(val)} y1={PAD.top + plotH} x2={toX(val)} y2={PAD.top + plotH + 6} stroke="rgba(31,42,46,0.25)" strokeWidth="1" />
              <text x={toX(val)} y={PAD.top + plotH + 20} textAnchor="middle" fontSize="11" fill="rgba(31,42,46,0.55)">
                €{(val / 1000).toFixed(1)}k
              </text>
            </g>
          ))}

          {/* Y ticks */}
          {yTickValues.map((val) => (
            <g key={`yt-${val}`}>
              <line x1={PAD.left - 6} y1={toY(val)} x2={PAD.left} y2={toY(val)} stroke="rgba(31,42,46,0.25)" strokeWidth="1" />
              <text x={PAD.left - 10} y={toY(val) + 4} textAnchor="end" fontSize="11" fill="rgba(31,42,46,0.55)">
                {val.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text x={PAD.left + plotW / 2} y={H - 10} textAnchor="middle" fontSize="12" fill="rgba(31,42,46,0.6)" fontWeight="600">
            Monthly Budget ({scenarioMeta[scenarioKey].budgetLabel})
          </text>
          <text x={16} y={PAD.top + plotH / 2} textAnchor="middle" fontSize="12" fill="rgba(31,42,46,0.6)" fontWeight="600"
            transform={`rotate(-90, 16, ${PAD.top + plotH / 2})`}>
            Quality of Life Score
          </text>

          {/* Bubbles — non-selected first, selected on top */}
          {[...rows]
            .sort((a, b) => (a.key === selectedCityKey ? 1 : b.key === selectedCityKey ? -1 : 0))
            .map((row) => {
              const cx = toX(row.budgets[scenarioKey].midpoint);
              const cy = toY(row.strategicBalance.weightedScore);
              const r = toR(row.activeWeightedScore);
              const isSelected = row.key === selectedCityKey;
              const colour = cityColourMap[row.key];
              const anchor = getLabelAnchor(cx);
              const labelDy = getLabelDy(cy, r);
              const shortName = row.city.length > 12 ? row.city.slice(0, 11) + '…' : row.city;

              return (
                <g
                  key={row.key}
                  className="scatter-dot"
                  tabIndex={0}
                  role="button"
                  aria-label={`${row.city}: QoL ${row.strategicBalance.weightedScore.toFixed(2)}, budget €${row.budgets[scenarioKey].midpoint}`}
                  onClick={() => onSelectCity(row.key)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectCity(row.key)}
                  onMouseEnter={() => setTooltip({ row, cx, cy, r })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  {/* Invisible hit target */}
                  <circle cx={cx} cy={cy} r={r + 8} fill="transparent" />
                  {/* Glow ring on selected */}
                  {isSelected && (
                    <circle cx={cx} cy={cy} r={r + 9} fill="transparent" stroke={colour} strokeWidth="2" opacity="0.35" />
                  )}
                  {/* Main bubble */}
                  <circle
                    cx={cx} cy={cy} r={r}
                    fill={colour}
                    fillOpacity={isSelected ? 0.92 : 0.65}
                    stroke={isSelected ? '#fff' : 'rgba(255,255,255,0.6)'}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />
                  {/* City label */}
                  <text
                    x={cx}
                    y={cy + labelDy}
                    dy={labelDy > 0 ? '0.85em' : '0'}
                    textAnchor={anchor}
                    fontSize="10.5"
                    fill={colour}
                    fontWeight="700"
                    style={{ paintOrder: 'stroke', stroke: 'rgba(255,252,245,0.85)', strokeWidth: 3, strokeLinejoin: 'round' }}
                  >
                    {shortName}
                  </text>
                </g>
              );
            })}

          {/* Tooltip */}
          {tooltip && (() => {
            const { row, cx, cy } = tooltip;
            const tw = 210;
            const th = 80;
            const tx = cx + 18 > PAD.left + plotW - tw ? cx - tw - 14 : cx + 14;
            const ty = Math.max(PAD.top, Math.min(cy - th / 2, PAD.top + plotH - th));
            const colour = cityColourMap[row.key];
            return (
              <g className="scatter-tooltip" pointerEvents="none">
                <rect x={tx} y={ty} width={tw} height={th} rx="10" fill="rgba(255,250,240,0.97)" stroke={colour} strokeWidth="1.5" />
                <text x={tx + 12} y={ty + 19} fontSize="12" fontWeight="700" fill="#1f2a2e">{row.city}, {row.country}</text>
                <text x={tx + 12} y={ty + 35} fontSize="10.5" fill="#5f696d">
                  QoL: <tspan fontWeight="700" fill={colour}>{row.strategicBalance.weightedScore.toFixed(2)}</tspan>
                  {' '}· {tierLabel(row.strategicBalance.weightedScore)}
                </text>
                <text x={tx + 12} y={ty + 50} fontSize="10.5" fill="#5f696d">
                  {priorityPresets[lensKey].label}: <tspan fontWeight="700">{formatScore(row.activeWeightedScore)}</tspan>
                </text>
                <text x={tx + 12} y={ty + 65} fontSize="10.5" fill="#5f696d">
                  Budget: <tspan fontWeight="700">€{row.budgets[scenarioKey].midpoint.toLocaleString()}/mo</tspan>
                </text>
              </g>
            );
          })()}
        </svg>
      </div>

      {/* Colour legend */}
      <div className="chart-legend">
        <span className="chart-legend-item chart-legend-item--size">
          <svg width="32" height="16" viewBox="0 0 32 16" aria-hidden="true">
            <circle cx="6" cy="8" r="4" fill="#5f696d" opacity="0.6" />
            <circle cx="24" cy="8" r="8" fill="#5f696d" opacity="0.6" />
          </svg>
          Bubble size = {priorityPresets[lensKey].label} score
        </span>
        {[...rows]
          .sort((a, b) => a.city.localeCompare(b.city))
          .map((r) => (
            <span key={r.key} className="chart-legend-item">
              <span className="chart-legend-dot" style={{ background: cityColourMap[r.key] }} />
              {r.city}
            </span>
          ))}
      </div>
    </div>
  );
};

// ── Horizontal Bar Chart ───────────────────────────────────────
const BarChart = function barChart({ rows, selectedCityKey, onSelectCity, lensKey }) {
  if (!rows.length) {
    return (
      <div className="chart-container">
        <div className="chart-header">
          <h3>City Rankings</h3>
          <p>Chart unavailable because there are no cities in the current result set.</p>
        </div>
      </div>
    );
  }

  const sorted = useMemo(() => [...rows].sort((a, b) => b.activeWeightedScore - a.activeWeightedScore), [rows]);
  const maxScore = 10;
  const BAR_H = 28;
  const GAP = 6;
  const LABEL_W = 148;
  const SCORE_W = 38;
  const BAR_W = 340;
  const W = LABEL_W + BAR_W + SCORE_W + 24;
  const H = sorted.length * (BAR_H + GAP) + 40;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>City Rankings</h3>
        <p>Overall score under the <strong>{priorityPresets[lensKey].label}</strong> lens, sorted highest to lowest. Click any bar to select that city.</p>
      </div>
      <div className="chart-scroll-wrap chart-scroll-wrap--bar">
        <svg viewBox={`0 0 ${W} ${H}`} className="bar-svg" aria-label="Horizontal bar chart of city scores">
          {/* Score axis ticks */}
          {[0, 2, 4, 6, 8, 10].map((val) => {
            const x = LABEL_W + (val / maxScore) * BAR_W;
            return (
              <g key={`bt-${val}`}>
                <line x1={x} y1={16} x2={x} y2={H - 8} stroke="rgba(31,42,46,0.06)" strokeWidth="1" strokeDasharray="3,3" />
                <text x={x} y={12} textAnchor="middle" fontSize="9" fill="rgba(31,42,46,0.4)">{val}</text>
              </g>
            );
          })}

          {sorted.map((row, index) => {
            const y = 28 + index * (BAR_H + GAP);
            const bw = (row.activeWeightedScore / maxScore) * BAR_W;
            const isSelected = row.key === selectedCityKey;
            const colour = COUNTRY_COLOURS[row.country] ?? COUNTRY_COLOURS.default;
            const shortName = row.city.length > 17 ? row.city.slice(0, 16) + '…' : row.city;

            return (
              <g
                key={row.key}
                className="bar-row"
                tabIndex={0}
                role="button"
                aria-label={`${row.city}: ${formatScore(row.activeWeightedScore)}`}
                onClick={() => onSelectCity(row.key)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelectCity(row.key)}
              >
                {/* Hover target */}
                <rect x={0} y={y - 2} width={W} height={BAR_H + 2} fill="transparent" />

                {/* Selected highlight */}
                {isSelected && (
                  <rect x={0} y={y - 3} width={W} height={BAR_H + 4} rx="6" fill={colour} fillOpacity="0.08" />
                )}

                {/* Country colour swatch */}
                <rect x={6} y={y + BAR_H / 2 - 5} width={8} height={10} rx="3" fill={colour} opacity="0.9" />

                {/* City label */}
                <text x={LABEL_W - 8} y={y + BAR_H / 2 + 4} textAnchor="end" fontSize="11" fill={isSelected ? colour : '#1f2a2e'} fontWeight={isSelected ? '700' : '500'}>
                  #{index + 1} {shortName}
                </text>

                {/* Background track */}
                <rect x={LABEL_W} y={y} width={BAR_W} height={BAR_H} rx="6" fill="rgba(31,42,46,0.05)" />

                {/* Score bar */}
                <rect x={LABEL_W} y={y} width={bw} height={BAR_H} rx="6" fill={colour} opacity={isSelected ? 0.95 : 0.7} />

                {/* Score label */}
                <text x={LABEL_W + bw + 6} y={y + BAR_H / 2 + 4} fontSize="11" fill={colour} fontWeight="700">
                  {formatScore(row.activeWeightedScore)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Country legend */}
      <div className="chart-legend">
        {Object.entries(COUNTRY_COLOURS)
          .filter(([k]) => k !== 'default' && sorted.some((r) => r.country === k))
          .map(([country, colour]) => (
            <span key={country} className="chart-legend-item">
              <span className="chart-legend-dot" style={{ background: colour }} />
              {country}
            </span>
          ))}
      </div>
    </div>
  );
};

// ── Multi-city Pillar Radar (top 10 by Strategic Balance) ─────
const PillarRadar = function pillarRadar({ rows, selectedCity }) {
  const [hiddenCities, setHiddenCities] = useState(new Set());

  const top10 = useMemo(() => {
    const sorted = [...rows]
      .filter((r) => r.strategicBalance?.pillars?.length)
      .sort((a, b) => b.strategicBalance.weightedScore - a.strategicBalance.weightedScore);
    const top = sorted.slice(0, 10);
    if (selectedCity && !top.some((r) => r.key === selectedCity.key)) {
      top[top.length - 1] = selectedCity;
    }
    return top;
  }, [rows, selectedCity]);

  const toggleCity = (key) => {
    setHiddenCities((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const showAll = () => setHiddenCities(new Set());

  if (!top10.length || !top10[0].strategicBalance?.pillars) return null;

  const pillars = top10[0].strategicBalance.pillars;
  const n = pillars.length;
  const CX = 230;
  const CY = 230;
  const R = 170;
  const levels = [2, 4, 6, 8, 10];

  const angle = (i) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i, r) => ({
    x: CX + r * Math.cos(angle(i)),
    y: CY + r * Math.sin(angle(i)),
  });
  const toRadius = (score) => (score / 10) * R;

  const cityPath = (cityRow) =>
    cityRow.strategicBalance.pillars
      .map((p, i) => {
        const pt = point(i, toRadius(p.score));
        return `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(' ') + ' Z';

  const visibleCities = top10.filter((r) => !hiddenCities.has(r.key));
  const hasHidden = hiddenCities.size > 0;

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h3>{pillars.length}-Pillar Radar — Top 10 Cities</h3>
        <p>
          Strategic Balance Matrix scores across all {pillars.length} family-relocation pillars for the top 10 cities by Quality of Life score.
          Click any legend item to show or hide that city.
          {selectedCity && ` The selected city (${selectedCity.city}) is highlighted with a solid outline.`}
        </p>
      </div>
      <div className="radar-layout">
        <div className="chart-scroll-wrap chart-scroll-wrap--radar">
          <svg viewBox="0 0 460 460" className="radar-svg" aria-label="Multi-city radar chart of 12 strategic pillars">
            {/* Web grid */}
            {levels.map((level) => {
              const pts = Array.from({ length: n }, (_, i) => point(i, (level / 10) * R));
              const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ') + ' Z';
              return <path key={level} d={d} fill="none" stroke="rgba(31,42,46,0.09)" strokeWidth="1" />;
            })}

            {/* Spokes */}
            {pillars.map((_, i) => {
              const outer = point(i, R);
              return <line key={i} x1={CX} y1={CY} x2={outer.x.toFixed(1)} y2={outer.y.toFixed(1)} stroke="rgba(31,42,46,0.09)" strokeWidth="1" />;
            })}

            {/* Level labels */}
            {levels.map((level) => (
              <text key={level} x={CX + 4} y={CY - (level / 10) * R + 4} fontSize="8" fill="rgba(31,42,46,0.35)">{level}</text>
            ))}

            {/* City polygons — non-selected first, selected city last (on top) */}
            {[...visibleCities]
              .sort((a, b) => (selectedCity && a.key === selectedCity.key ? 1 : selectedCity && b.key === selectedCity.key ? -1 : 0))
              .map((cityRow) => {
                const idx = top10.findIndex((r) => r.key === cityRow.key);
                const colour = RADAR_PALETTE[idx % RADAR_PALETTE.length];
                const isSelected = selectedCity && cityRow.key === selectedCity.key;
                return (
                  <path
                    key={cityRow.key}
                    d={cityPath(cityRow)}
                    fill={colour}
                    fillOpacity={isSelected ? 0.2 : 0.07}
                    stroke={colour}
                    strokeWidth={isSelected ? 2.8 : 1.4}
                    strokeOpacity={isSelected ? 1 : 0.65}
                  />
                );
              })}

            {/* Visible city data points — large dots for selected, small for others */}
            {visibleCities
              .flatMap((cityRow) => {
                const idx = top10.findIndex((r) => r.key === cityRow.key);
                const colour = RADAR_PALETTE[idx % RADAR_PALETTE.length];
                const isSelected = selectedCity && cityRow.key === selectedCity.key;
                return cityRow.strategicBalance.pillars.map((p, i) => {
                  const pt = point(i, toRadius(p.score));
                  return (
                    <circle key={`${cityRow.key}-${i}`} cx={pt.x.toFixed(1)} cy={pt.y.toFixed(1)}
                      r={isSelected ? 4.5 : 2.5}
                      fill={colour}
                      fillOpacity={isSelected ? 1 : 0.55}
                      stroke={isSelected ? '#fff' : 'none'}
                      strokeWidth="1.5"
                    />
                  );
                });
              })}

            {/* Pillar labels */}
            {pillars.map((p, i) => {
              const labelPt = point(i, R + 24);
              const textAnchor = labelPt.x < CX - 10 ? 'end' : labelPt.x > CX + 10 ? 'start' : 'middle';
              const words = p.label.split(' ');
              const line1 = words.slice(0, Math.ceil(words.length / 2)).join(' ');
              const line2 = words.slice(Math.ceil(words.length / 2)).join(' ');
              return (
                <text key={i} x={labelPt.x.toFixed(1)} y={labelPt.y.toFixed(1)} textAnchor={textAnchor} fontSize="9" fill="#1f2a2e" fontWeight="600">
                  <tspan x={labelPt.x.toFixed(1)} dy="0">{line1}</tspan>
                  {line2 && <tspan x={labelPt.x.toFixed(1)} dy="11">{line2}</tspan>}
                </text>
              );
            })}
          </svg>
        </div>

        {/* City legend with toggle */}
        <div className="radar-legend">
          {hasHidden && (
            <button type="button" className="radar-legend-showall" onClick={showAll}>
              Show all
            </button>
          )}
          {top10.map((cityRow, idx) => {
            const colour = RADAR_PALETTE[idx % RADAR_PALETTE.length];
            const isSelected = selectedCity && cityRow.key === selectedCity.key;
            const isHidden = hiddenCities.has(cityRow.key);
            return (
              <button
                key={cityRow.key}
                type="button"
                className={[
                  'radar-legend-item',
                  isSelected ? 'radar-legend-item--active' : '',
                  isHidden ? 'radar-legend-item--hidden' : '',
                ].filter(Boolean).join(' ')}
                onClick={() => toggleCity(cityRow.key)}
                aria-pressed={!isHidden}
                title={isHidden ? `Show ${cityRow.city}` : `Hide ${cityRow.city}`}
              >
                <span className="radar-legend-swatch" style={{ background: isHidden ? 'rgba(31,42,46,0.2)' : colour }} />
                <span className="radar-legend-city">
                  {cityRow.city}
                  <span className="radar-legend-score">{cityRow.strategicBalance.weightedScore.toFixed(2)}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ── Main panel export ──────────────────────────────────────────
export const CityChartsPanel = function cityChartsPanel({ rows, filteredRows, selectedCity, scenarioKey, lensKey, onSelectCity, isPrinting }) {
  const [activeChart, setActiveChart] = useState('bubble');
  const displayRows = filteredRows.length ? filteredRows : rows;

  return (
    <section className="panel stack-gap-lg charts-panel">
      <div className="section-title">
        <p>Step 3 — Sense-Check</p>
        <h2>Score Charts — See the Data Visually</h2>
        <span>
          Three views of the same underlying data to help you sense-check the rankings before committing to a
          shortlist. The bubble chart maps quality of life against monthly budget; the bar chart shows the full
          ranking by active lens; and the pillar radar reveals how the top 10 cities balance their strengths
          across all family-relocation pillars. Click any bubble or bar to switch the active city.
        </span>
      </div>

      <div className="chart-tab-row">
        {[
          { key: 'bubble', label: 'Quality of Life vs Budget' },
          { key: 'bar', label: 'City Rankings' },
          { key: 'radar', label: 'Pillar Radar — Top 10' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            className={activeChart === key ? 'chart-tab chart-tab--active' : 'chart-tab'}
            onClick={() => setActiveChart(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {isPrinting ? (
        <>
          <BubbleChart rows={displayRows} selectedCityKey={selectedCity?.key ?? null} onSelectCity={onSelectCity} scenarioKey={scenarioKey} lensKey={lensKey} />
          <BarChart rows={displayRows} selectedCityKey={selectedCity?.key ?? null} onSelectCity={onSelectCity} lensKey={lensKey} />
          <PillarRadar rows={displayRows} selectedCity={selectedCity} />
        </>
      ) : (
        <>
          {activeChart === 'bubble' && (
            <BubbleChart rows={displayRows} selectedCityKey={selectedCity?.key ?? null} onSelectCity={onSelectCity} scenarioKey={scenarioKey} lensKey={lensKey} />
          )}
          {activeChart === 'bar' && (
            <BarChart rows={displayRows} selectedCityKey={selectedCity?.key ?? null} onSelectCity={onSelectCity} lensKey={lensKey} />
          )}
          {activeChart === 'radar' && (
            <PillarRadar rows={displayRows} selectedCity={selectedCity} />
          )}
        </>
      )}

      {displayRows.length < rows.length && (
        <p className="chart-filter-note">Showing {displayRows.length} of {rows.length} cities based on active shortlist filters. Clear filters to see all cities in the charts.</p>
      )}
    </section>
  );
};
