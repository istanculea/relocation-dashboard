import { useMemo, useRef, useState, useEffect } from 'react';
import { formatEuro } from '../utils/formatters.js';

// ── Zone metadata ─────────────────────────────────────────────────────────────
const ZONE_META = {
  'Good Value': { color: '#1f6d52', bg: 'rgba(47,127,98,0.16)', dot: '#2f7f62' },
  'Premium':    { color: '#2f6287', bg: 'rgba(55,106,146,0.15)', dot: '#376a92' },
  'Cheap':      { color: '#666677', bg: 'rgba(120,120,140,0.11)', dot: '#78788c' },
  'Poor Value': { color: '#a65e18', bg: 'rgba(197,124,42,0.15)', dot: '#c57c2a' },
};

// Fixed margins in px (SVG user units = screen px with dynamic viewBox)
const ML = 54, MR = 12, MT = 16, MB = 40;

const DOT_RADIUS = {
  selected: 14,
  hovered: 12,
  filtered: 10,
  dimmed: 7.5,
};

const SEPARATION_PRESETS = {
  soft: {
    minGap: 2,
    iterations: 42,
    repelStrength: 0.34,
    springStrength: 0.12,
    maxDisplacement: 16,
    labelSpacing: 18,
    maxLabels: 18,
  },
  medium: {
    minGap: 4,
    iterations: 64,
    repelStrength: 0.46,
    springStrength: 0.09,
    maxDisplacement: 26,
    labelSpacing: 24,
    maxLabels: 14,
  },
  strong: {
    minGap: 6,
    iterations: 86,
    repelStrength: 0.58,
    springStrength: 0.08,
    maxDisplacement: 36,
    labelSpacing: 30,
    maxLabels: 11,
  },
};

function resolveSeparationPreset(intensity) {
  return SEPARATION_PRESETS[intensity] ?? SEPARATION_PRESETS.medium;
}

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

function computePlotStats(rows, scenarioKey) {
  const scores = rows.map((r) => r.activeWeightedScore ?? 0);
  const budgets = rows.map((r) => r.budgets?.[scenarioKey]?.midpoint ?? 0);
  const minS = scores.length ? Math.min(...scores) : 0;
  const maxS = scores.length ? Math.max(...scores) : 10;
  const minB = budgets.length ? Math.min(...budgets) : 0;
  const maxB = budgets.length ? Math.max(...budgets) : 8000;
  const bSpan = Math.max(maxB - minB, 1);
  const sSpan = Math.max(maxS - minS, 0.1);

  return {
    mScore: medianOf(scores),
    mBudget: medianOf(budgets),
    xLo: minB - bSpan * 0.06,
    xHi: maxB + bSpan * 0.06,
    yLo: minS - sSpan * 0.10,
    yHi: maxS + sSpan * 0.10,
  };
}

function buildEnrichedRows(rows, scenarioKey, mScore, mBudget) {
  return rows.map((r) => {
    const score = r.activeWeightedScore ?? 0;
    const budget = r.budgets?.[scenarioKey]?.midpoint ?? 0;
    return { ...r, score, budget, zone: classifyZone(score, budget, mScore, mBudget) };
  });
}

function buildOrderedDots(enrichedRows, filteredKeys, selectedCityKey) {
  const dimmed = enrichedRows.filter((r) => !filteredKeys.has(r.key) && r.key !== selectedCityKey);
  const active = enrichedRows.filter((r) => filteredKeys.has(r.key) && r.key !== selectedCityKey);
  const top = enrichedRows.filter((r) => r.key === selectedCityKey);
  return [...dimmed, ...active, ...top];
}

function resolveDotRadius({ rowCount, isSelected, isHovered, isFiltered }) {
  const densityScale = rowCount >= 28 ? 0.8 : rowCount >= 22 ? 0.86 : rowCount >= 16 ? 0.92 : 1;
  const base = isSelected
    ? DOT_RADIUS.selected
    : isHovered
      ? DOT_RADIUS.hovered
      : isFiltered
        ? DOT_RADIUS.filtered
        : DOT_RADIUS.dimmed;
  return Math.max(5.4, base * densityScale);
}

function buildLayoutPositions({
  orderedDots,
  filteredKeys,
  selectedCityKey,
  hoveredCityKey,
  svgX,
  svgY,
  plotBounds,
  separationPreset,
}) {
  const nodes = orderedDots.map((row) => {
    const isFiltered = filteredKeys.has(row.key);
    const isSelected = row.key === selectedCityKey;
    const isHovered = row.key === hoveredCityKey;
    const x0 = svgX(row.budget);
    const y0 = svgY(row.score);
    const r = resolveDotRadius({
      rowCount: orderedDots.length,
      isSelected,
      isHovered,
      isFiltered,
    });
    return {
      key: row.key,
      x0,
      y0,
      x: x0,
      y: y0,
      r,
      pinned: isSelected,
    };
  });

  for (let iteration = 0; iteration < separationPreset.iterations; iteration += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy) || 0.0001;
        const minDist = a.r + b.r + separationPreset.minGap;

        if (dist >= minDist) {
          continue;
        }

        const overlap = (minDist - dist) * separationPreset.repelStrength;
        const ux = dx / dist;
        const uy = dy / dist;
        const moveA = b.pinned ? overlap : overlap * 0.5;
        const moveB = a.pinned ? overlap : overlap * 0.5;

        if (!a.pinned) {
          a.x -= ux * moveA;
          a.y -= uy * moveA;
        }
        if (!b.pinned) {
          b.x += ux * moveB;
          b.y += uy * moveB;
        }
      }
    }

    for (const node of nodes) {
      if (!node.pinned) {
        node.x += (node.x0 - node.x) * separationPreset.springStrength;
        node.y += (node.y0 - node.y) * separationPreset.springStrength;
      }

      const dx0 = node.x - node.x0;
      const dy0 = node.y - node.y0;
      const displacement = Math.hypot(dx0, dy0);
      if (displacement > separationPreset.maxDisplacement) {
        const scale = separationPreset.maxDisplacement / displacement;
        node.x = node.x0 + dx0 * scale;
        node.y = node.y0 + dy0 * scale;
      }

      node.x = Math.max(plotBounds.left + node.r, Math.min(plotBounds.right - node.r, node.x));
      node.y = Math.max(plotBounds.top + node.r, Math.min(plotBounds.bottom - node.r, node.y));
    }
  }

  return new Map(nodes.map((node) => [node.key, node]));
}

function buildVisibleLabelSet({ enrichedRows, filteredKeys, positions, separationPreset }) {
  const ranked = enrichedRows
    .filter((row) => filteredKeys.has(row.key))
    .sort((a, b) => b.score - a.score);
  const selected = [];
  const minLabelSpacing = separationPreset.labelSpacing;
  const maxLabels = separationPreset.maxLabels;

  for (const row of ranked) {
    const node = positions.get(row.key);
    if (!node) {
      continue;
    }

    const tooClose = selected.some((picked) => Math.hypot(node.x - picked.x, node.y - picked.y) < minLabelSpacing);
    if (tooClose) {
      continue;
    }

    selected.push({ key: row.key, x: node.x, y: node.y });
    if (selected.length >= maxLabels) {
      break;
    }
  }

  return new Set(selected.map((entry) => entry.key));
}

function getTooltipPosition({ cx, cy, tw, th, plotBounds }) {
  const tx = cx + 18 + tw > plotBounds.right ? cx - 18 - tw : cx + 18;
  const ty = Math.max(plotBounds.top + 2, Math.min(cy - th / 2, plotBounds.bottom - th));
  return { tx, ty };
}

function getDotVisualState({ row, filteredKeys, selectedCityKey, hoveredCityKey, svgX, svgY, layoutPositions, rowCount }) {
  const isFiltered = filteredKeys.has(row.key);
  const isSelected = row.key === selectedCityKey;
  const isHovered = row.key === hoveredCityKey;
  const zoneMeta = ZONE_META[row.zone] ?? ZONE_META.Cheap;
  const fallbackX = svgX(row.budget);
  const fallbackY = svgY(row.score);
  const node = layoutPositions?.get(row.key);
  const cx = node?.x ?? fallbackX;
  const cy = node?.y ?? fallbackY;
  const dotR = resolveDotRadius({ rowCount, isSelected, isHovered, isFiltered });

  return {
    isFiltered,
    isSelected,
    isHovered,
    zoneMeta,
    cx,
    cy,
    dotR,
    opacity: isFiltered ? 1 : 0.14,
  };
}

function ScatterDotRings({ isSelected, isHovered, cx, cy, dotR, zoneMeta }) {
  if (!isSelected && !isHovered) {
    return null;
  }

  return (
    <>
      <circle cx={cx} cy={cy} r={dotR + 8} fill="none" stroke={zoneMeta.dot} strokeWidth="2" opacity={0.3} />
      {isSelected && (
        <circle cx={cx} cy={cy} r={dotR + 3} fill="none" stroke={zoneMeta.dot} strokeWidth="1.5" opacity={0.55} />
      )}
    </>
  );
}

function ScatterDotLabel({ row, isFiltered, isSelected, isHovered, zoneMeta, cx, cy, dotR }) {
  if (isFiltered && !isSelected && !isHovered) {
    return (
      <text
        x={cx}
        y={cy - dotR - 4}
        fontSize="10.5"
        fontFamily="IBM Plex Sans, sans-serif"
        textAnchor="middle"
        fill={zoneMeta.color}
        opacity="0.9"
        fontWeight="600"
        stroke="rgba(255, 252, 246, 0.92)"
        strokeWidth="3"
        paintOrder="stroke"
        style={{ pointerEvents: 'none' }}
      >
        {row.city}
      </text>
    );
  }

  if (isSelected || isHovered) {
    return (
      <text
        x={cx}
        y={cy - dotR - 7}
        fontSize="13.5"
        fontFamily="IBM Plex Sans, sans-serif"
        textAnchor="middle"
        fill={zoneMeta.color}
        fontWeight="700"
        stroke="rgba(255, 252, 246, 0.96)"
        strokeWidth="3.5"
        paintOrder="stroke"
        style={{ pointerEvents: 'none' }}
      >
        {row.city}
      </text>
    );
  }

  return null;
}

function ScatterDot({
  row,
  filteredKeys,
  selectedCityKey,
  hoveredCityKey,
  svgX,
  svgY,
  layoutPositions,
  rowCount,
  showLabel,
  onHover,
  onSelect,
}) {
  const {
    isFiltered,
    isSelected,
    isHovered,
    zoneMeta,
    cx,
    cy,
    dotR,
    opacity,
  } = getDotVisualState({
    row,
    filteredKeys,
    selectedCityKey,
    hoveredCityKey,
    svgX,
    svgY,
    layoutPositions,
    rowCount,
  });

  return (
    <g
      key={row.key}
      style={{ cursor: 'pointer' }}
      onMouseEnter={() => onHover(row.key)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(row.key)}
      aria-label={`${row.city}: score ${row.score.toFixed(2)}, budget ${formatEuro(row.budget)}`}
    >
      <ScatterDotRings isSelected={isSelected} isHovered={isHovered} cx={cx} cy={cy} dotR={dotR} zoneMeta={zoneMeta} />
      <circle
        cx={cx}
        cy={cy}
        r={dotR}
        fill={zoneMeta.dot}
        opacity={opacity}
        stroke={isSelected || isHovered ? zoneMeta.dot : 'none'}
        strokeWidth={isSelected ? 2 : isHovered ? 1.5 : 0}
        strokeOpacity="0.6"
      />
      <ScatterDotLabel
        row={row}
        isFiltered={isFiltered && showLabel}
        isSelected={isSelected}
        isHovered={isHovered}
        zoneMeta={zoneMeta}
        cx={cx}
        cy={cy}
        dotR={dotR}
      />
    </g>
  );
}

function ScatterTooltip({ row, svgX, svgY, plotBounds, layoutPositions }) {
  if (!row) {
    return null;
  }

  const zoneMeta = ZONE_META[row.zone] ?? ZONE_META.Cheap;
  const node = layoutPositions?.get(row.key);
  const cx = node?.x ?? svgX(row.budget);
  const cy = node?.y ?? svgY(row.score);
  const tw = 186;
  const th = 96;
  const { tx, ty } = getTooltipPosition({ cx, cy, tw, th, plotBounds });

  return (
    <g style={{ pointerEvents: 'none' }}>
      <rect x={tx + 2} y={ty + 2} width={tw} height={th} rx="8" fill="rgba(0,0,0,0.10)" />
      <rect
        x={tx}
        y={ty}
        width={tw}
        height={th}
        rx="8"
        fill="rgba(255, 252, 246, 0.96)"
        stroke={zoneMeta.dot}
        strokeWidth="1.4"
        strokeOpacity="0.32"
      />
      <rect x={tx} y={ty} width={tw} height={5} rx="8" fill={zoneMeta.dot} opacity="0.72" />
      <text x={tx + 12} y={ty + 24} fontSize="13.5" fontFamily="IBM Plex Sans, sans-serif" fontWeight="700" fill="var(--ws-ink)">
        {row.city}, {row.country}
      </text>
      <text x={tx + 12} y={ty + 45} fontSize="11.2" fontFamily="IBM Plex Sans, sans-serif" fill="var(--ws-ink-2)">
        {'Score '}<tspan fontWeight="700" fill="var(--ws-ink)">{row.score.toFixed(2)}</tspan>
        {'  ·  Zone: '}<tspan fontWeight="700" fill={zoneMeta.color}>{row.zone}</tspan>
      </text>
      <text x={tx + 12} y={ty + 65} fontSize="11.2" fontFamily="IBM Plex Sans, sans-serif" fill="var(--ws-ink-2)">
        {'Budget '}<tspan fontWeight="700" fill="var(--ws-ink)">{formatEuro(row.budget)}/mo</tspan>
      </text>
      <text x={tx + 12} y={ty + 84} fontSize="10.3" fontFamily="IBM Plex Sans, sans-serif" fill="var(--ws-ink-3)">
        Click to open city profile
      </text>
    </g>
  );
}

export function AffordabilityScatterplot({
  rows = [],
  filteredRows = [],
  scenarioKey = 'base',
  selectedCityKey = null,
  hoveredCityKey = null,
  separationIntensity = 'medium',
  onHover = () => {},
  onSelect = () => {},
}) {
  const safeRows     = rows ?? [];
  const filteredKeys = useMemo(() => new Set((filteredRows ?? []).map((r) => r.key)), [filteredRows]);

  // ── Dynamic container sizing via ResizeObserver ───────────────────────────
  const containerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ w: 860, h: 360 });
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

  const { mScore, mBudget, xLo, xHi, yLo, yHi } = useMemo(
    () => computePlotStats(safeRows, scenarioKey),
    [safeRows, scenarioKey],
  );

  // Coordinate projectors
  const svgX = (v) => ML + ((v - xLo) / (xHi - xLo)) * PW;
  const svgY = (v) => MT + PH - ((v - yLo) / (yHi - yLo)) * PH;

  const enriched = useMemo(
    () => buildEnrichedRows(safeRows, scenarioKey, mScore, mBudget),
    [safeRows, scenarioKey, mScore, mBudget],
  );

  const orderedDots = useMemo(
    () => buildOrderedDots(enriched, filteredKeys, selectedCityKey),
    [enriched, filteredKeys, selectedCityKey],
  );

  const separationPreset = useMemo(
    () => resolveSeparationPreset(separationIntensity),
    [separationIntensity],
  );

  // Axis ticks — denser for more reference lines
  const xTicks = Array.from({ length: 7 }, (_, i) => xLo + ((xHi - xLo) * i) / 6);
  const yTicks = Array.from({ length: 6 }, (_, i) => yLo + ((yHi - yLo) * i) / 5);

  // Median divider positions
  const mX = svgX(mBudget);
  const mY = svgY(mScore);

  const tooltipRow = hoveredCityKey ? enriched.find((r) => r.key === hoveredCityKey) : null;

  const allFiltered = filteredKeys.size === safeRows.length;
  const plotBounds = { left: ML, right: ML + PW, top: MT, bottom: MT + PH };

  const layoutPositions = useMemo(
    () => buildLayoutPositions({
      orderedDots,
      filteredKeys,
      selectedCityKey,
      hoveredCityKey,
      svgX,
      svgY,
      plotBounds,
      separationPreset,
    }),
    [
      orderedDots,
      filteredKeys,
      selectedCityKey,
      hoveredCityKey,
      svgX,
      svgY,
      plotBounds.left,
      plotBounds.right,
      plotBounds.top,
      plotBounds.bottom,
      separationPreset,
    ],
  );

  const visibleLabelSet = useMemo(
    () => buildVisibleLabelSet({
      enrichedRows: enriched,
      filteredKeys,
      positions: layoutPositions,
      separationPreset,
    }),
    [enriched, filteredKeys, layoutPositions, separationPreset],
  );

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
            stroke="var(--ws-border)" strokeWidth="0.9" opacity="0.58" />
        ))}
        {yTicks.map((v, i) => (
          <line key={`gy${i}`} x1={ML} y1={svgY(v)} x2={ML + PW} y2={svgY(v)}
            stroke="var(--ws-border)" strokeWidth="0.9" opacity="0.58" />
        ))}

        {/* Median divider lines */}
        <line x1={mX} y1={MT} x2={mX} y2={MT + PH}
          stroke="var(--ws-border-strong)" strokeWidth="1.9" strokeDasharray="7 4" opacity="0.75" />
        <line x1={ML} y1={mY} x2={ML + PW} y2={mY}
          stroke="var(--ws-border-strong)" strokeWidth="1.9" strokeDasharray="7 4" opacity="0.75" />

        {/* Plot border */}
        <rect x={ML} y={MT} width={PW} height={PH} fill="none"
          stroke="var(--ws-border-strong)" strokeWidth="1.1" opacity="0.58" />

        {/* Quadrant corner labels */}
        <text x={ML + 10}      y={MT + 22}      fontSize="12" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Good Value'].color} opacity="0.74" fontWeight="700" letterSpacing="0.9">GOOD VALUE</text>
        <text x={ML + PW - 10} y={MT + 22}      fontSize="12" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Premium'].color}    opacity="0.74" fontWeight="700" textAnchor="end" letterSpacing="0.9">PREMIUM</text>
        <text x={ML + 10}      y={MT + PH - 10} fontSize="12" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Cheap'].color}      opacity="0.74" fontWeight="700" letterSpacing="0.9">CHEAP</text>
        <text x={ML + PW - 10} y={MT + PH - 10} fontSize="12" fontFamily="IBM Plex Sans, sans-serif" fill={ZONE_META['Poor Value'].color} opacity="0.74" fontWeight="700" textAnchor="end" letterSpacing="0.9">POOR VALUE</text>

        {/* X axis */}
        {xTicks.map((v, i) => (
          <g key={`xt${i}`}>
            <line x1={svgX(v)} y1={MT + PH} x2={svgX(v)} y2={MT + PH + 5}
              stroke="var(--ws-ink-3)" strokeWidth="1" />
            <text x={svgX(v)} y={MT + PH + 21} fontSize="12" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="var(--ws-ink-3)">
              {formatEuro(Math.round(v / 50) * 50)}
            </text>
          </g>
        ))}
        <text x={ML + PW / 2} y={H - 6} fontSize="13" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="var(--ws-ink-2)" fontWeight="700" letterSpacing="0.3">
          Monthly Budget
        </text>

        {/* Y axis */}
        {yTicks.map((v, i) => (
          <g key={`yt${i}`}>
            <line x1={ML - 5} y1={svgY(v)} x2={ML} y2={svgY(v)}
              stroke="var(--ws-ink-3)" strokeWidth="1" />
            <text x={ML - 9} y={svgY(v) + 4} fontSize="12" fontFamily="IBM Plex Sans, sans-serif" textAnchor="end" fill="var(--ws-ink-3)">
              {v.toFixed(1)}
            </text>
          </g>
        ))}
        <text x={15} y={MT + PH / 2} fontSize="13" fontFamily="IBM Plex Sans, sans-serif" textAnchor="middle" fill="var(--ws-ink-2)" fontWeight="700" letterSpacing="0.3"
          transform={`rotate(-90, 15, ${MT + PH / 2})`}>
          QoL Score
        </text>

        {/* City dots + labels */}
        {orderedDots.map((row) => (
          <ScatterDot
            key={row.key}
            row={row}
            filteredKeys={filteredKeys}
            selectedCityKey={selectedCityKey}
            hoveredCityKey={hoveredCityKey}
            svgX={svgX}
            svgY={svgY}
            layoutPositions={layoutPositions}
            rowCount={safeRows.length}
            showLabel={visibleLabelSet.has(row.key)}
            onHover={onHover}
            onSelect={onSelect}
          />
        ))}

        <ScatterTooltip
          row={tooltipRow}
          svgX={svgX}
          svgY={svgY}
          plotBounds={plotBounds}
          layoutPositions={layoutPositions}
        />
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
