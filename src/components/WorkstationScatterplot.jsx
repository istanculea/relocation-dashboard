import { useMemo, useRef, useState, useEffect } from 'react';
import { formatEuro } from '../utils/formatters.js';

// ── Zone metadata ─────────────────────────────────────────────────────────────
const ZONE_META = {
  'Good Value': { color: '#2f7f62', bg: 'rgba(47,127,98,0.12)',   dot: '#2f7f62' },
  'Premium':    { color: '#376a92', bg: 'rgba(55,106,146,0.12)',  dot: '#376a92' },
  'Cheap':      { color: '#78788c', bg: 'rgba(120,120,140,0.09)', dot: '#78788c' },
  'Poor Value': { color: '#c57c2a', bg: 'rgba(197,124,42,0.12)',  dot: '#c57c2a' },
};

// Fixed margins in px (SVG user units = screen px with dynamic viewBox)
const ML = 68, MR = 22, MT = 24, MB = 52;

function medianOf(arr) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function classifyZone(score, budget, mScore, mBudget) {
  const lowCost = budget <= mBudget;
  const highQol = score >= mScore;
  if (lowCost && highQol)  return 'Good Value';
  if (!lowCost && highQol) return 'Premium';
  if (lowCost && !highQol) return 'Cheap';
  return 'Poor Value';
}

export function AffordabilityScatterplot({
  rows = [],
  filteredRows = [],
  scenarioKey = 'base',
  selectedCityKey = null,
  hoveredCityKey = null,
  onHover = () => {},
  onSelect = () => {},
}) {
  const safeRows     = rows ?? [];
  const filteredKeys = useMemo(() => new Set((filteredRows ?? []).map((r) => r.key)), [filteredRows]);

  // ── Dynamic container sizing via ResizeObserver ───────────────────────────
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 860, h: 340 });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 20 && height > 20) setContainerSize({ w: Math.round(width), h: Math.round(height) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W  = containerSize.w;
  const H  = containerSize.h;
  const PW = W - ML - MR;
  const PH = H - MT - MB;

  // Compute axis ranges and medians stable across filter changes
  const { mScore, mBudget, xLo, xHi, yLo, yHi } = useMemo(() => {
    const scores  = safeRows.map((r) => r.activeWeightedScore ?? 0);
    const budgets = safeRows.map((r) => r.budgets?.[scenarioKey]?.midpoint ?? 0);
    const minS = scores.length  ? Math.min(...scores)  : 0;
    const maxS = scores.length  ? Math.max(...scores)  : 10;
    const minB = budgets.length ? Math.min(...budgets) : 0;
    const maxB = budgets.length ? Math.max(...budgets) : 8000;
    const bSpan = Math.max(maxB - minB, 1);
    const sSpan = Math.max(maxS - minS, 0.1);
    return {
      mScore:  medianOf(scores),
      mBudget: medianOf(budgets),
      xLo: minB - bSpan * 0.06,
      xHi: maxB + bSpan * 0.06,
      yLo: minS - sSpan * 0.10,
      yHi: maxS + sSpan * 0.10,
    };
  }, [safeRows, scenarioKey]);

  // Coordinate projectors
  const svgX = (v) => ML + ((v - xLo) / (xHi - xLo)) * PW;
  const svgY = (v) => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;

  // Enrich rows with budget, score, zone
  const enriched = useMemo(() =>
    safeRows.map((r) => {
      const score  = r.activeWeightedScore ?? 0;
      const budget = r.budgets?.[scenarioKey]?.midpoint ?? 0;
      return { ...r, score, budget, zone: classifyZone(score, budget, mScore, mBudget) };
    }),
  [safeRows, scenarioKey, mScore, mBudget]);

  // Draw order: dimmed first, active next, selected on top
  const orderedDots = useMemo(() => {
    const dimmed = enriched.filter((r) => !filteredKeys.has(r.key) && r.key !== selectedCityKey);
    const active = enriched.filter((r) =>  filteredKeys.has(r.key) && r.key !== selectedCityKey);
    const top    = enriched.filter((r) => r.key === selectedCityKey);
    return [...dimmed, ...active, ...top];
  }, [enriched, filteredKeys, selectedCityKey]);

  // Axis ticks — denser for more reference lines
  const xTicks = Array.from({ length: 7 }, (_, i) => xLo + ((xHi - xLo) * i) / 6);
  const yTicks = Array.from({ length: 6 }, (_, i) => yLo + ((yHi - yLo) * i) / 5);

  // Median divider positions
  const mX = svgX(mBudget);
  const mY = svgY(mScore);

  // Tooltip row
  const tooltipRow = hoveredCityKey ? enriched.find((r) => r.key === hoveredCityKey) : null;

  const allFiltered = filteredKeys.size === safeRows.length;

  return (
    <div className="scp-wrap" ref={containerRef}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="scp-svg"
        aria-label="Affordability and Quality of Life scatterplot"
      >
        {/* Quadrant backgrounds */}
        <rect x={ML}  y={MT}  width={mX - ML}       height={mY - MT}       fill={ZONE_META['Good Value'].bg} />
        <rect x={mX}  y={MT}  width={ML + PW - mX}   height={mY - MT}       fill={ZONE_META['Premium'].bg} />
        <rect x={ML}  y={mY}  width={mX - ML}       height={MT + PH - mY}  fill={ZONE_META['Cheap'].bg} />
        <rect x={mX}  y={mY}  width={ML + PW - mX}   height={MT + PH - mY}  fill={ZONE_META['Poor Value'].bg} />

        {/* Light gridlines */}
        {xTicks.map((v, i) => (
          <line key={`gx${i}`} x1={svgX(v)} y1={MT} x2={svgX(v)} y2={MT + PH}
            stroke="var(--ws-border)" strokeWidth="0.8" opacity="0.5" />
        ))}
        {yTicks.map((v, i) => (
          <line key={`gy${i}`} x1={ML} y1={svgY(v)} x2={ML + PW} y2={svgY(v)}
            stroke="var(--ws-border)" strokeWidth="0.8" opacity="0.5" />
        ))}

        {/* Median divider lines */}
        <line x1={mX} y1={MT} x2={mX} y2={MT + PH}
          stroke="var(--ws-border-strong)" strokeWidth="1.8" strokeDasharray="7 4" opacity="0.7" />
        <line x1={ML} y1={mY} x2={ML + PW} y2={mY}
          stroke="var(--ws-border-strong)" strokeWidth="1.8" strokeDasharray="7 4" opacity="0.7" />

        {/* Plot border */}
        <rect x={ML} y={MT} width={PW} height={PH} fill="none"
          stroke="var(--ws-border-strong)" strokeWidth="1" opacity="0.5" />

        {/* Quadrant corner labels */}
        <text x={ML + 10}      y={MT + 20}      fontSize="10.5" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Good Value'].color} opacity="0.7" fontWeight="700" letterSpacing="0.9">GOOD VALUE</text>
        <text x={ML + PW - 10} y={MT + 20}      fontSize="10.5" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Premium'].color}    opacity="0.7" fontWeight="700" textAnchor="end" letterSpacing="0.9">PREMIUM</text>
        <text x={ML + 10}      y={MT + PH - 10} fontSize="10.5" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Cheap'].color}      opacity="0.7" fontWeight="700" letterSpacing="0.9">CHEAP</text>
        <text x={ML + PW - 10} y={MT + PH - 10} fontSize="10.5" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Poor Value'].color} opacity="0.7" fontWeight="700" textAnchor="end" letterSpacing="0.9">POOR VALUE</text>

        {/* X axis */}
        {xTicks.map((v, i) => (
          <g key={`xt${i}`}>
            <line x1={svgX(v)} y1={MT + PH} x2={svgX(v)} y2={MT + PH + 5}
              stroke="var(--ws-ink-3)" strokeWidth="1" />
            <text x={svgX(v)} y={MT + PH + 19} fontSize="10.5" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="var(--ws-ink-3)">
              {formatEuro(Math.round(v / 50) * 50)}
            </text>
          </g>
        ))}
        <text x={ML + PW / 2} y={H - 7} fontSize="11.5" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="var(--ws-ink-2)" fontWeight="600" letterSpacing="0.3">
          Monthly Budget
        </text>

        {/* Y axis */}
        {yTicks.map((v, i) => (
          <g key={`yt${i}`}>
            <line x1={ML - 5} y1={svgY(v)} x2={ML} y2={svgY(v)}
              stroke="var(--ws-ink-3)" strokeWidth="1" />
            <text x={ML - 9} y={svgY(v) + 4} fontSize="10.5" fontFamily="IBM Plex Sans, sans-serif" textAnchor="end" fill="var(--ws-ink-3)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={15} y={MT + PH / 2} fontSize="11.5" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="var(--ws-ink-2)" fontWeight="600" letterSpacing="0.3"
          transform={`rotate(-90, 15, ${MT + PH / 2})`}>
          QoL Score
        </text>

        {/* City dots + labels */}
        {orderedDots.map((r) => {
          const isFiltered = filteredKeys.has(r.key);
          const isSelected = r.key === selectedCityKey;
          const isHov      = r.key === hoveredCityKey;
          const zm         = ZONE_META[r.zone] ?? ZONE_META['Cheap'];
          const opacity    = isFiltered ? 1 : 0.14;
          const cx         = svgX(r.budget);
          const cy         = svgY(r.score);
          const dotR       = isSelected ? 11 : isHov ? 10 : isFiltered ? 8 : 6;

          return (
            <g
              key={r.key}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => onHover(r.key)}
              onMouseLeave={() => onHover(null)}
              onClick={() => onSelect(r.key)}
              aria-label={`${r.city}: score ${r.score.toFixed(2)}, budget ${formatEuro(r.budget)}`}
            >
              {/* Outer glow ring for selected/hovered */}
              {(isSelected || isHov) && (
                <circle cx={cx} cy={cy} r={dotR + 8} fill="none"
                  stroke={zm.dot} strokeWidth="2" opacity={0.3} />
              )}
              {/* Inner accent ring for selected */}
              {isSelected && (
                <circle cx={cx} cy={cy} r={dotR + 3} fill="none"
                  stroke={zm.dot} strokeWidth="1.5" opacity={0.55} />
              )}
              {/* Main dot */}
              <circle cx={cx} cy={cy} r={dotR}
                fill={zm.dot}
                opacity={opacity}
                stroke={isSelected || isHov ? zm.dot : 'none'}
                strokeWidth={isSelected ? 2 : isHov ? 1.5 : 0}
                strokeOpacity="0.6"
              />
              {/* City label — always for active cities (non-selected, non-hovered) */}
              {isFiltered && !isSelected && !isHov && (
                <text x={cx} y={cy - dotR - 4} fontSize="10" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle"
                  fill={zm.color} opacity="0.9" fontWeight="600" style={{ pointerEvents: 'none' }}>
                  {r.city}
                </text>
              )}
              {/* Bold label on hover or selection */}
              {(isSelected || isHov) && (
                <text x={cx} y={cy - dotR - 7} fontSize="12.5" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle"
                  fill={zm.color} fontWeight="700" style={{ pointerEvents: 'none' }}>
                  {r.city}
                </text>
              )}
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltipRow && (() => {
          const r  = tooltipRow;
          const zm = ZONE_META[r.zone] ?? ZONE_META['Cheap'];
          const cx = svgX(r.budget);
          const cy = svgY(r.score);
          const tw = 186, th = 90;
          const tx = cx + 18 + tw > ML + PW ? cx - 18 - tw : cx + 18;
          const ty = Math.max(MT + 2, Math.min(cy - th / 2, MT + PH - th));
          return (
            <g style={{ pointerEvents: 'none' }}>
              {/* Drop shadow approximation */}
              <rect x={tx + 2} y={ty + 2} width={tw} height={th} rx="6"
                fill="rgba(0,0,0,0.12)" />
              <rect x={tx} y={ty} width={tw} height={th} rx="6"
                fill="var(--ws-surface-2)" stroke={zm.dot} strokeWidth="1.5" strokeOpacity="0.35" />
              {/* Zone accent bar at top */}
              <rect x={tx} y={ty} width={tw} height={4} rx="6"
                fill={zm.dot} opacity="0.7" />
              <text x={tx + 12} y={ty + 23} fontSize="13.5" fontFamily="IBM Plex Sans, sans-serif" fontWeight="700" fill="var(--ws-ink)">
                {r.city}, {r.country}
              </text>
              <text x={tx + 12} y={ty + 43} fontSize="11" fontFamily="IBM Plex Sans, sans-serif" fill="var(--ws-ink-2)">
                {'Score '}<tspan fontWeight="700" fill="var(--ws-ink)">{r.score.toFixed(2)}</tspan>
                {'  ·  Zone: '}<tspan fontWeight="700" fill={zm.color}>{r.zone}</tspan>
              </text>
              <text x={tx + 12} y={ty + 62} fontSize="11" fontFamily="IBM Plex Sans, sans-serif" fill="var(--ws-ink-2)">
                {'Budget '}<tspan fontWeight="700" fill="var(--ws-ink)">{formatEuro(r.budget)}/mo</tspan>
              </text>
              <text x={tx + 12} y={ty + 80} fontSize="10" fontFamily="IBM Plex Sans, sans-serif" fill="var(--ws-ink-3)">
                Click to open city profile
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Filter note */}
      {!allFiltered && filteredKeys.size > 0 && (
        <div className="scp-filter-note">
          {filteredKeys.size} of {safeRows.length} cities · {safeRows.length - filteredKeys.size} dimmed
        </div>
      )}
      {filteredKeys.size === 0 && safeRows.length > 0 && (
        <div className="scp-filter-note scp-filter-note--warn">No cities match current filters</div>
      )}
    </div>
  );
}

// WorkstationLayout.jsx imports { Scatterplot }
export { AffordabilityScatterplot as Scatterplot };
