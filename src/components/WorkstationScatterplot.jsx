import { useEffect, useRef, useState } from 'react';
import { formatEuro } from '../utils/formatters.js';

const fmt = (value) => (typeof value === 'number' ? value.toFixed(2) : '—');
const SCATTER_PAD = { top: 24, right: 20, bottom: 42, left: 54 };

const tierColor = (score) => {
  if (score >= 7.5) return { fill: 'rgba(47,127,98,0.82)', stroke: '#1d6049' };
  if (score >= 6.0) return { fill: 'rgba(55,106,146,0.78)', stroke: '#264d6e' };
  return { fill: 'rgba(197,124,42,0.78)', stroke: '#845c14' };
};

const ScatterDot = function scatterDot({
  bx,
  by,
  fill,
  isActive,
  isFiltered,
  isHovered,
  isSelected,
  onHover,
  onSelect,
  r,
  row,
  setTooltip,
  stroke,
  wrapRef,
}) {
  return (
    <g
      style={{ cursor: 'pointer' }}
      onMouseEnter={(event) => {
        onHover(row.key);
        const rect = wrapRef.current.getBoundingClientRect();
        setTooltip({
          row,
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        });
      }}
      onMouseLeave={() => {
        onHover(null);
        setTooltip(null);
      }}
      onClick={() => onSelect(row.key)}
    >
      {isSelected && (
        <circle cx={bx} cy={by} r={r + 6} fill="none" stroke={stroke} strokeWidth="1.5" opacity="0.35" />
      )}
      {isHovered && !isSelected && (
        <circle cx={bx} cy={by} r={r + 4} fill="none" stroke={stroke} strokeWidth="1" opacity="0.25" />
      )}
      <circle
        cx={bx}
        cy={by}
        r={r}
        fill={isSelected ? stroke : fill}
        stroke={stroke}
        strokeWidth={isActive ? 2 : 1}
        opacity={isFiltered ? 1 : 0.18}
        filter={isActive ? 'url(#ws-dot-glow)' : undefined}
        className="ws-scatter-bubble"
      />
      {!isActive && (
        <text
          x={bx}
          y={by + r + 10}
          textAnchor="middle"
          className="ws-scatter-dot-label"
          opacity={isFiltered ? 1 : 0.25}
          pointerEvents="none"
        >
          {row.city.slice(0, 4).trimEnd()}
        </text>
      )}
    </g>
  );
};

const ActiveScatterLabel = function activeScatterLabel({ activeKey, maxS, minS, pw, rows, scenarioKey, toX, toY }) {
  if (!activeKey) {
    return null;
  }

  const row = rows.find((entry) => entry.key === activeKey);
  if (!row) {
    return null;
  }

  const bx = toX(row.budgets[scenarioKey].midpoint);
  const by = toY(row.activeWeightedScore);
  const baseR = 6 + (row.activeWeightedScore - minS) / (maxS - minS + 0.01) * 5;
  const r = baseR + 2.5;
  const { stroke } = tierColor(row.activeWeightedScore);
  const labelWidth = row.city.length * 7 + 16;
  const labelY = by - r - 14 < SCATTER_PAD.top + 8 ? by + r + 20 : by - r - 8;
  const rawLabelX = bx - labelWidth / 2;
  const labelX = Math.max(SCATTER_PAD.left + 2, Math.min(rawLabelX, SCATTER_PAD.left + pw - labelWidth - 2));

  return (
    <g pointerEvents="none">
      <rect x={labelX} y={labelY - 12} width={labelWidth} height={16} rx="4" ry="4" fill={stroke} opacity="0.92" />
      <text
        x={labelX + labelWidth / 2}
        y={labelY - 1}
        textAnchor="middle"
        style={{ fontSize: '10px', fontWeight: 700, fill: '#fff', letterSpacing: '0.02em', fontFamily: 'inherit' }}
      >
        {row.city}
      </text>
    </g>
  );
};

const ScatterTooltip = function scatterTooltip({ h, rows, scenarioKey, tooltip, w }) {
  if (!tooltip) {
    return null;
  }

  const { row, x, y } = tooltip;
  const pm = row.mobility?.pm25;
  const pmLabel = pm != null ? `${pm} µg/m³` : '—';
  const rank = rows.findIndex((entry) => entry.key === row.key) + 1;
  const tooltipX = x + 14 + 180 > w ? x - 194 : x + 14;
  const tooltipY = Math.max(4, Math.min(y - 10, h - 110));

  return (
    <div className="ws-scatter-tooltip" style={{ left: tooltipX, top: tooltipY }}>
      <div className="ws-scatter-tooltip__city">{row.city}</div>
      <div className="ws-scatter-tooltip__country">{row.country} · #{rank}</div>
      <div className="ws-scatter-tooltip__row">
        <span>Score</span><strong>{fmt(row.activeWeightedScore)}</strong>
      </div>
      <div className="ws-scatter-tooltip__row">
        <span>Budget/mo</span><strong>{formatEuro(row.budgets[scenarioKey].midpoint)}</strong>
      </div>
      <div className="ws-scatter-tooltip__row">
        <span>Air Quality (PM2.5)</span><strong>{pmLabel}</strong>
      </div>
    </div>
  );
};

export function Scatterplot({ rows, filteredRows, scenarioKey, selectedCityKey, hoveredCityKey, onHover, onSelect }) {
  const svgRef = useRef(null);
  const wrapRef = useRef(null);
  const [dims, setDims] = useState({ w: 400, h: 200 });
  const [tooltip, setTooltip] = useState(null);
  const safeRows = Array.isArray(rows) ? rows : [];
  const safeFilteredRows = Array.isArray(filteredRows) ? filteredRows : [];
  const filteredKeys = new Set(safeFilteredRows.map((row) => row.key));

  useEffect(() => {
    const element = wrapRef.current;
    if (!element) {
      return undefined;
    }

    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setDims({ w: Math.max(width, 100), h: Math.max(height, 80) });
    });

    resizeObserver.observe(element);
    const rect = element.getBoundingClientRect();

    setDims({ w: rect.width || 400, h: rect.height || 200 });

    return () => resizeObserver.disconnect();
  }, []);

  const { w, h } = dims;
  const plotWidth = Math.max(w - SCATTER_PAD.left - SCATTER_PAD.right, 1);
  const plotHeight = Math.max(h - SCATTER_PAD.top - SCATTER_PAD.bottom, 1);

  const budgetValues = safeRows.map((row) => row.budgets?.[scenarioKey]?.midpoint ?? 0);
  const scoreValues = safeRows.map((row) => row.activeWeightedScore ?? 0);
  const minB = budgetValues.length ? Math.min(...budgetValues) : 0;
  const maxB = budgetValues.length ? Math.max(...budgetValues) : 1;
  const minS = scoreValues.length ? Math.min(...scoreValues) : 0;
  const maxS = scoreValues.length ? Math.max(...scoreValues) : 1;
  const budgetSpan = Math.max(maxB - minB, 1);
  const scoreSpan = Math.max(maxS - minS, 1);
  const padB = budgetSpan * 0.12;
  const padS = scoreSpan * 0.12;
  const B0 = minB - padB;
  const B1 = maxB + padB;
  const S0 = minS - padS;
  const S1 = maxS + padS;
  const toX = (budget) => SCATTER_PAD.left + ((budget - B0) / Math.max(B1 - B0, 1e-6)) * plotWidth;
  const toY = (score) => SCATTER_PAD.top + plotHeight - ((score - S0) / Math.max(S1 - S0, 1e-6)) * plotHeight;
  const sorted = [...safeRows].sort((a, b) => (b.activeWeightedScore ?? 0) - (a.activeWeightedScore ?? 0));
  const activeKey = hoveredCityKey ?? selectedCityKey;

  return (
    <div className="ws-scatter-wrap" ref={wrapRef}>
      <svg
        ref={svgRef}
        className="ws-scatter-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Scatterplot of relocation score versus monthly budget"
      >
        <defs>
          <filter id="ws-dot-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="rgba(35, 55, 79, 0.25)" />
          </filter>
        </defs>

        <line x1={SCATTER_PAD.left} x2={SCATTER_PAD.left + plotWidth} y1={SCATTER_PAD.top + plotHeight} y2={SCATTER_PAD.top + plotHeight} className="ws-scatter-axis" />
        <line x1={SCATTER_PAD.left} x2={SCATTER_PAD.left} y1={SCATTER_PAD.top} y2={SCATTER_PAD.top + plotHeight} className="ws-scatter-axis" />

        <text x={SCATTER_PAD.left + plotWidth / 2} y={h - 10} className="ws-scatter-axis-label" textAnchor="middle">
          Budget per month
        </text>
        <text x={11} y={SCATTER_PAD.top + plotHeight / 2} className="ws-scatter-axis-label" textAnchor="middle" transform={`rotate(-90, 11, ${SCATTER_PAD.top + plotHeight / 2})`}>
          Score
        </text>

        {sorted.map((row) => {
          const budget = row.budgets?.[scenarioKey]?.midpoint ?? 0;
          const score = row.activeWeightedScore ?? 0;
          const bx = toX(budget);
          const by = toY(score);
          const baseR = 8 + ((score - minS) / (scoreSpan + 0.01)) * 4;
          const isFiltered = filteredKeys.has(row.key);
          const isSelected = row.key === selectedCityKey;
          const isHovered = row.key === hoveredCityKey;
          const isActive = isSelected || isHovered;
          const r = isActive ? baseR + 2.5 : baseR;
          const { fill, stroke } = tierColor(score);

          return (
            <ScatterDot
              key={row.key}
              bx={bx}
              by={by}
              fill={fill}
              isActive={isActive}
              isFiltered={isFiltered}
              isHovered={isHovered}
              isSelected={isSelected}
              onHover={onHover}
              onSelect={onSelect}
              r={r}
              row={row}
              setTooltip={setTooltip}
              stroke={stroke}
              wrapRef={wrapRef}
            />
          );
        })}

        <ActiveScatterLabel activeKey={activeKey} maxS={maxS} minS={minS} pw={plotWidth} rows={safeRows} scenarioKey={scenarioKey} toX={toX} toY={toY} />
      </svg>

      <ScatterTooltip h={h} rows={safeRows} scenarioKey={scenarioKey} tooltip={tooltip} w={w} />
    </div>
  );
 }
