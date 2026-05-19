import { useCallback, useEffect, useState } from 'react';
import { priorityPresets, scenarioMeta } from '../data/dashboardConfig.js';
import { PaneD } from './WorkstationDossierPanel.jsx';
import { useShortlist } from '../context/DashboardContext.jsx';
import { Scatterplot } from './WorkstationScatterplot.jsx';
import { formatEuro } from '../utils/formatters.js';
import { WatchlistAlertsPanel } from './WatchlistAlertsPanel.jsx';

// ── Inline SVG icons ─────────────────────────────────────────────────────────
const IconPdf = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
    <path d="M2 1h5.5L10 3.5V11H2V1zm5 0v2.5h2.5M4 5.5h4M4 7h4M4 8.5h2.5" stroke="currentColor" strokeWidth="1" fill="none"/>
  </svg>
);
const IconXls = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="1" width="10" height="10" rx="1.5"/>
    <path d="M4 4.5 8 7.5M8 4.5 4 7.5M1 3h10"/>
  </svg>
);
const IconCsv = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
    <rect x="1" y="1" width="10" height="10" rx="1.5"/>
    <path d="M1 4h10M1 7h10M4.5 1v10M7.5 1v10"/>
  </svg>
);
const IconJson = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.2">
    <path d="M4 1.5C3 1.5 2.5 2 2.5 3v2.5c0 .7-.5 1-.5 1s.5.3.5 1V10c0 1 .5 1.5 1.5 1.5"/>
    <path d="M8 1.5c1 0 1.5.5 1.5 1.5v2.5c0 .7.5 1 .5 1s-.5.3-.5 1V10c0 1-.5 1.5-1.5 1.5"/>
  </svg>
);

const fmt = (v) => (typeof v === 'number' ? v.toFixed(2) : '—');

// ── Ranking Feed Row ──────────────────────────────────────────────────────────
function FeedRow({ row, rank, isSelected, isHovered, isFiltered, isCompared, onHover, onSelect, onCompareToggle }) {
  const pm = row.mobility?.pm25 ?? null;
  const airClass = pm === null ? '' : pm <= 10 ? 'ws-feed-cell--air-low' : pm <= 20 ? 'ws-feed-cell--air-mid' : 'ws-feed-cell--air-high';
  return (
    <div
      className={[
        'ws-feed-row',
        isSelected ? 'ws-feed-row--selected' : '',
        isHovered && !isSelected ? 'ws-feed-row--hovered' : '',
        !isFiltered ? 'ws-feed-row--dimmed' : '',
      ].filter(Boolean).join(' ')}
      onMouseEnter={() => onHover(row.key)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onSelect(row.key)}
      role="row"
      aria-selected={isSelected}
    >
      <div className="ws-feed-cell" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="ws-compare-cb"
          checked={isCompared}
          onChange={() => onCompareToggle(row.key)}
          aria-label={`Compare ${row.city}`}
          title="Add to compare"
        />
      </div>
      <div className="ws-feed-cell ws-feed-cell--rank">#{rank}</div>
      <div className="ws-feed-cell ws-feed-cell--city">
        {row.city}
        <span className="ws-feed-cell--city-sub">{row.country}</span>
      </div>
      <div className="ws-feed-cell ws-feed-cell--score">{fmt(row.activeWeightedScore)}</div>
      <div className="ws-feed-cell ws-feed-cell--budget">{formatEuro(row.budgets['oneParent'].midpoint).replace('€', '€')}</div>
      <div className={`ws-feed-cell ws-feed-cell--air ${airClass}`}>{pm !== null ? `${pm}` : '—'}</div>
      <div className="ws-feed-chevron">›</div>
    </div>
  );
}

// ── Pane A ────────────────────────────────────────────────────────────────────
const MOBILITY_OPTS = [
  { value: 'all',    label: 'Any Profile' },
  { value: 'low',    label: 'Car-free Cities' },
  { value: 'low-ok', label: 'Low Car Use' },
  { value: 'med',    label: 'Car Helpful' },
];

const MOBILITY_MATCHERS = {
  all: () => true,
  low: (carNeed) => carNeed === 'Low',
  'low-ok': (carNeed) => carNeed === 'Low' || carNeed === 'Low to medium',
  med: (carNeed) => carNeed === 'Medium',
};

function PaneA({
  lensKey, onLensChange,
  scenarioKey, onScenarioChange,
  searchValue, onSearchChange,
  budgetCap, onBudgetCapChange,
  airCapRaw, onAirCapChange,
  mobilityFilter, onMobilityFilterChange,
  hasActiveFilters, onClearFilters,
  sortPillarKey,
}) {
  const lensEntries = Object.entries(priorityPresets);
  const scenarioEntries = Object.entries(scenarioMeta);

  const budgetMin = 1500, budgetMax = 4500;
  const airMin = 5, airMax = 40;
  const budgetPct = ((budgetCap - budgetMin) / (budgetMax - budgetMin)) * 100;
  const airPct    = ((airCapRaw  - airMin)  / (airMax  - airMin))  * 100;

  const budgetLabel = budgetCap >= budgetMax
    ? 'Any'
    : `€${budgetCap >= 1000 ? (budgetCap / 1000).toFixed(1) + 'k' : budgetCap}`;
  const airLabel = airCapRaw >= airMax ? 'Any' : `≤${airCapRaw} µg/m³`;

  const TRACK_EMPTY = 'rgba(31,42,46,0.15)';
  const sliderTrack = (pct, atMax) => ({
    background: atMax
      ? TRACK_EMPTY
      : `linear-gradient(to right, var(--ws-accent) ${pct}%, ${TRACK_EMPTY} ${pct}%)`,
  });

  return (
    <aside className="ws-pane ws-pane--sidebar" aria-label="Control Center">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Control Center</span>
      </div>
      <div className="ws-pane__body">

        {/* Decision Lens */}
        <div className="ws-control-group">
          <div className="ws-control-label">Decision Lens</div>
          <select
            className="ws-select"
            value={lensKey}
            onChange={(e) => onLensChange(e.target.value)}
            aria-label="Select decision lens"
          >
            {lensEntries.map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>
          <p className="ws-control-hint">{priorityPresets[lensKey].detail}</p>
        </div>

        {/* Household Scenario */}
        <div className="ws-control-group">
          <div className="ws-control-label">Household Scenario</div>
          <div className="ws-seg-toggle" role="group" aria-label="Household scenario">
            {scenarioEntries.map(([key, meta]) => (
              <button
                key={key}
                className={`ws-seg-btn${scenarioKey === key ? ' ws-seg-btn--active' : ''}`}
                onClick={() => onScenarioChange(key)}
                type="button"
              >
                {meta.label}
              </button>
            ))}
          </div>
          <p className="ws-control-hint">{scenarioMeta[scenarioKey].budgetLabel}</p>
        </div>

        {/* Search */}
        <div className="ws-control-group">
          <div className="ws-control-label">Search</div>
          <div className="ws-input-wrap">
            <svg className="ws-input-icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="search"
              className="ws-input"
              placeholder="City or country…"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              aria-label="Search city or country"
            />
          </div>
        </div>

        {/* Budget Limit */}
        <div className="ws-control-group">
          <div className="ws-control-label-row">
            <span className="ws-control-label">Budget Limit</span>
            <span className={`ws-control-val${budgetCap < budgetMax ? ' ws-control-val--active' : ''}`}>{budgetLabel}</span>
          </div>
          <input
            type="range"
            className="ws-slider"
            style={sliderTrack(budgetPct, budgetCap >= budgetMax)}
            min={budgetMin}
            max={budgetMax}
            step={100}
            value={budgetCap}
            onChange={(e) => onBudgetCapChange(Number(e.target.value))}
            aria-label="Budget cap"
          />
        </div>

        {/* Air Risk */}
        <div className="ws-control-group">
          <div className="ws-control-label-row">
            <span className="ws-control-label">Air Quality (PM2.5)</span>
            <span className={`ws-control-val${airCapRaw < airMax ? ' ws-control-val--active' : ''}`}>{airLabel}</span>
          </div>
          <input
            type="range"
            className="ws-slider"
            style={sliderTrack(airPct, airCapRaw >= airMax)}
            min={airMin}
            max={airMax}
            step={1}
            value={airCapRaw}
            onChange={(e) => onAirCapChange(Number(e.target.value))}
            aria-label="PM2.5 air risk cap"
          />
          <p className="ws-control-hint">WHO annual limit: 5 µg/m³ · EU limit: 25 µg/m³</p>
        </div>

        {/* Mobility Profile */}
        <div className="ws-control-group">
          <div className="ws-control-label">Mobility Profile</div>
          <div className="ws-radio-group" role="group" aria-label="Mobility profile filter">
            {MOBILITY_OPTS.map((o) => (
              <label key={o.value} className={`ws-radio-opt${mobilityFilter === o.value ? ' ws-radio-opt--active' : ''}`}>
                <input
                  type="radio"
                  name="mobilityFilter"
                  value={o.value}
                  checked={mobilityFilter === o.value}
                  onChange={() => onMobilityFilterChange(o.value)}
                  className="ws-radio-input"
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>

        {/* Active Sort indicator */}
        {sortPillarKey && (
          <div className="ws-control-group">
            <div className="ws-control-label">Sorted By</div>
            <div className="ws-sort-tag">↓ {sortPillarKey}</div>
          </div>
        )}

        {/* Clear */}
        <button
          type="button"
          className={`ws-clear-btn${hasActiveFilters ? ' ws-clear-btn--active' : ''}`}
          onClick={hasActiveFilters ? onClearFilters : undefined}
          aria-disabled={!hasActiveFilters}
        >
          {hasActiveFilters ? '✕  Clear All Filters' : 'No active filters'}
        </button>

      </div>
    </aside>
  );
}

// ── Pane B ────────────────────────────────────────────────────────────────────
function PaneB({
  rows, filteredRows, scenarioKey,
  selectedCityKey, hoveredCityKey,
  onHover, onSelect,
  compareKeys, onCompareToggle,
}) {
  return (
    <section className="ws-scatter-section" aria-label="Quality vs Budget Chart">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Quality of Life vs Budget</span>
        <div className="ws-legend">
          <span className="ws-legend-item"><span className="ws-legend-swatch ws-legend-swatch--high"/>High ≥7.5</span>
          <span className="ws-legend-item"><span className="ws-legend-swatch ws-legend-swatch--mid"/>Mid 6–7.5</span>
          <span className="ws-legend-item"><span className="ws-legend-swatch ws-legend-swatch--low"/>Low &lt;6</span>
        </div>
      </div>
      <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
        <Scatterplot
          rows={rows}
          filteredRows={filteredRows}
          scenarioKey={scenarioKey}
          selectedCityKey={selectedCityKey}
          hoveredCityKey={hoveredCityKey}
          onHover={onHover}
          onSelect={onSelect}
        />
      </div>
    </section>
  );
}

// ── Pane C ────────────────────────────────────────────────────────────────────
const PILLAR_ABBREVS = {
  'EU Registration & Residency Pathway': 'Residency',
  'Diploma Recognition & Professional Accreditation': 'Diploma',
  'Real Estate & Healthy Housing': 'Real Estate',
  'Rental Market': 'Rental',
  'Home Ownership': 'Ownership',
  'Location & Infrastructure': 'Location',
  "The 'Clean' Shopping Basket": 'Basket',
  'Childcare & Educational Path': 'Childcare',
  'Health, Medical Access': 'Healthcare',
  'Environment & Pollution': 'Pollution',
  'Criminality and Street Safeness': 'Safety',
  'Infrastructure, Mobility & Logistics': 'Mobility',
  'Economy, Jobs, Taxes & Parity': 'Economy',
  'Climate & Resilience': 'Climate',
  'Social Capital & Work-Life Balance': 'Social',
};

const HEATMAP_TIER_THRESHOLDS = [[7.5, 'high'], [6, 'mid']];

const resolveDossierCities = (compareArr, isCompareMode, rows, selectedCity) => {
  if (!isCompareMode) {
    return { dossierCity: selectedCity, dossierCityB: null };
  }

  const compareCities = compareArr.map((key) => rows.find((row) => row.key === key) ?? null);

  return {
    dossierCity: compareCities[0] ?? selectedCity,
    dossierCityB: compareCities[1] ?? null,
  };
};

const buildStatusItems = ({
  activeFilterCount,
  activeLensLabel,
  compareKeys,
  comparingLabel,
  hasActiveFilters,
  localFilteredCount,
  mobilityFilter,
  mobilityLabel,
  rowCount,
  scenarioKey,
  sortLabel,
  sortPillarKey,
}) => {
  const items = [
    {
      key: 'viewing',
      label: 'Viewing',
      tagClassName: 'ws-statusbar__tag ws-statusbar__tag--active',
      value: `${localFilteredCount} of ${rowCount} cities`,
    },
    {
      key: 'lens',
      label: 'Lens',
      tagClassName: 'ws-statusbar__tag',
      value: activeLensLabel,
    },
    {
      key: 'sort',
      label: 'Sort',
      tagClassName: `ws-statusbar__tag${sortPillarKey ? ' ws-statusbar__tag--active' : ''}`,
      value: sortLabel,
    },
    {
      key: 'scenario',
      label: 'Scenario',
      tagClassName: 'ws-statusbar__tag',
      value: scenarioMeta[scenarioKey]?.label ?? scenarioKey,
    },
  ];

  if (compareKeys.size > 0) {
    items.push({
      key: 'compare',
      label: 'Comparing',
      tagClassName: 'ws-statusbar__tag ws-statusbar__tag--active',
      value: comparingLabel,
    });
  }

  if (mobilityFilter !== 'all') {
    items.push({
      key: 'mobility',
      label: 'Mobility',
      tagClassName: 'ws-statusbar__tag ws-statusbar__tag--active',
      value: mobilityLabel,
    });
  }

  if (hasActiveFilters) {
    items.push({
      key: 'filters',
      label: null,
      tagClassName: 'ws-statusbar__tag ws-statusbar__tag--active',
      value: `${activeFilterCount} active filter(s)`,
    });
  }

  return items;
};

function PaneC({
  rows, filteredRows, selectedCityKey, hoveredCityKey,
  onHover, onSelect,
  sortPillarKey, onSortByPillar,
}) {
  const filteredSet = new Set(filteredRows.map((r) => r.key));
  const pillars = rows[0]?.strategicBalance?.pillars ?? [];

  // Sort rows: selected sort pillar first, then by score
  const sortedRows = [...rows].sort((a, b) => {
    if (sortPillarKey) {
      const pa = a.strategicBalance.pillars.find((p) => p.label === sortPillarKey)?.score ?? 0;
      const pb = b.strategicBalance.pillars.find((p) => p.label === sortPillarKey)?.score ?? 0;
      if (pb !== pa) return pb - pa;
    }
    return b.activeWeightedScore - a.activeWeightedScore;
  });

  return (
    <section className="ws-pane" aria-label="Heatmap Matrix">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Strategic Heatmap · 28 Cities × 15 Pillars</span>
        <div className="ws-legend">
          <span className="ws-legend-item"><span className="ws-legend-swatch ws-legend-swatch--high"/>≥7.5</span>
          <span className="ws-legend-item"><span className="ws-legend-swatch ws-legend-swatch--mid"/>6–7.4</span>
          <span className="ws-legend-item"><span className="ws-legend-swatch ws-legend-swatch--low"/>&lt;6</span>
        </div>
      </div>
      <div className="ws-matrix-scroll">
        <table className="ws-matrix-table" aria-label="City performance heatmap">
          <thead>
            <tr>
              <th className="ws-matrix-city-th ws-col-city" scope="col">City</th>
              <th
                className={`ws-matrix-th-score${!sortPillarKey ? ' ws-matrix-th--sorted' : ''}`}
                scope="col"
                onClick={() => onSortByPillar(null)}
                title="Sort by overall score"
              >
                <div className="ws-matrix-th__inner">
                  Score {!sortPillarKey && <span className="ws-matrix-sort-arrow">↓</span>}
                </div>
              </th>
              {pillars.map((pillar) => (
                <th
                  key={pillar.key}
                  className={`ws-matrix-th${sortPillarKey === pillar.label ? ' ws-matrix-th--sorted' : ''}`}
                  scope="col"
                  onClick={() => onSortByPillar(sortPillarKey === pillar.label ? null : pillar.label)}
                  title={`Sort by ${pillar.label}`}
                >
                  <div className="ws-matrix-th__inner">
                    {PILLAR_ABBREVS[pillar.label] ?? pillar.label}
                    {sortPillarKey === pillar.label && <span className="ws-matrix-sort-arrow">↓</span>}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.filter((row) => filteredSet.has(row.key)).map((row, idx) => {
              const isSelected = row.key === selectedCityKey;
              const isHovered = row.key === hoveredCityKey;
              return (
                <tr
                  key={row.key}
                  className={[
                    'ws-matrix-tr',
                    isSelected ? 'ws-matrix-tr--selected' : '',
                    isHovered && !isSelected ? 'ws-matrix-tr--hovered' : '',
                  ].filter(Boolean).join(' ')}
                  onMouseEnter={() => onHover(row.key)}
                  onMouseLeave={() => onHover(null)}
                  onClick={() => onSelect(row.key)}
                >
                  <td className="ws-matrix-td-city ws-col-city" title={row.city}>
                    {row.city}
                    <span className="ws-matrix-td-city__rank">#{idx + 1} {row.country}</span>
                  </td>
                  <td className="ws-matrix-td-score ws-score-pulse">{fmt(row.activeWeightedScore)}</td>
                  {pillars.map((pillar) => {
                    const entry = row.strategicBalance.pillars.find((p) => p.key === pillar.key);
                    const score = entry?.score ?? 0;
                    const tier = HEATMAP_TIER_THRESHOLDS.find(([minimumScore]) => score >= minimumScore)?.[1] ?? 'low';
                    return (
                      <td
                        key={pillar.key}
                        className={[
                          'ws-matrix-td',
                          `ws-matrix-td--${tier}`,
                          sortPillarKey === pillar.label ? 'ws-matrix-td--sorted-col' : '',
                        ].filter(Boolean).join(' ')}
                      >
                        {fmt(score)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── WorkstationLayout ─────────────────────────────────────────────────────────
export function WorkstationLayout({
  // App-level state
  lensKey, onLensChange,
  scenarioKey, onScenarioChange,
  rows,           // all scored rows (comparisonRows)
  filteredRows,   // filtered + sorted (filteredComparisonRows)
  searchValue, onSearchChange,
  selectedCityKey, onSelectCity,
  activeFilters, onClearFilters,
  // exports
  onExportPdf, onExportXls, onExportCsv, onExportJson,
  // explorer nav
  onGoToExplorer,
  onGoToMap,
  // share link action
  onShare,
  // pillar thresholds (pass-through for App-level filter)
}) {
  const { shortlistedCityKeys, toggleShortlist } = useShortlist();

  // Local workstation state
  const [hoveredCityKey, setHoveredCityKey] = useState(null);
  const [compareKeys, setCompareKeys] = useState(new Set());
  const [sortPillarKey, setSortPillarKey] = useState(null);
  const [budgetCap, setBudgetCap] = useState(4500);
  const [airCap, setAirCap] = useState(40);
  const [mobilityFilter, setMobilityFilter] = useState('all');
  const [dossierOpen, setDossierOpen] = useState(false);

  // When a city is selected, open dossier
  useEffect(() => {
    if (selectedCityKey) setDossierOpen(true);
  }, [selectedCityKey]);

  // When 2 compare cities are ticked, auto-open dossier in compare mode
  useEffect(() => {
    if (compareKeys.size === 2) setDossierOpen(true);
  }, [compareKeys]);

  // Budget + air + mobility filter applied locally on top of parent filters
  const budgetFilterIsActive = budgetCap < 4500;
  const airFilterIsActive = airCap < 40;
  const matchesMobility = MOBILITY_MATCHERS[mobilityFilter] ?? MOBILITY_MATCHERS.all;

  const localFiltered = filteredRows.filter((r) => {
    const budget = r.budgets[scenarioKey]?.midpoint ?? 0;
    const pm = r.mobility?.pm25 ?? 0;
    const carNeed = r.mobility?.carNeed ?? '';
    const withinBudget = !budgetFilterIsActive || budget <= budgetCap;
    const withinAirCap = !airFilterIsActive || pm <= airCap;

    return withinBudget && withinAirCap && matchesMobility(carNeed);
  });

  // Compare toggle: max 2
  const handleCompareToggle = useCallback((key) => {
    setCompareKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (next.size >= 2) {
          const [first] = next;
          next.delete(first);
        }
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleSortByPillar = useCallback((pillarLabel) => {
    setSortPillarKey(pillarLabel);
  }, []);

  const handleSelectCity = useCallback((key) => {
    onSelectCity(key);
    setDossierOpen(true);
  }, [onSelectCity]);

  const selectedCity = rows.find((r) => r.key === selectedCityKey) ?? null;
  const compareArr = [...compareKeys];
  const isCompareMode = compareArr.length === 2;
  const { dossierCity, dossierCityB } = resolveDossierCities(compareArr, isCompareMode, rows, selectedCity);
  const isDossierOpen = dossierOpen && (selectedCity !== null || isCompareMode);
  const pinnedKeys = new Set(shortlistedCityKeys);

  const getCityRank = useCallback((key) => {
    const idx = rows.findIndex((r) => r.key === key);
    return idx >= 0 ? idx + 1 : null;
  }, [rows]);

  const hasActiveFilters = searchValue.length > 0 || budgetCap < 4500 || airCap < 40 || mobilityFilter !== 'all' || activeFilters.length > 0;

  const handleClearAll = () => {
    onClearFilters();
    setBudgetCap(4500);
    setAirCap(40);
    setMobilityFilter('all');
    setSortPillarKey(null);
  };

  // Sort indicator label for status bar
  const sortPillarLabel = PILLAR_ABBREVS[sortPillarKey] ?? sortPillarKey ?? null;
  const sortLabel = sortPillarLabel ?? 'Overall Score';
  const activeLensLabel = priorityPresets[lensKey]?.label ?? lensKey ?? '—';
  const comparingLabel = compareArr.map((key) => rows.find((row) => row.key === key)?.city ?? key).join(' vs ');
  const mobilityLabel = MOBILITY_OPTS.find((option) => option.value === mobilityFilter)?.label ?? mobilityFilter;
  const activeFilterCount = activeFilters.length
    + Number(budgetCap < 4500)
    + Number(airCap < 40)
    + Number(mobilityFilter !== 'all');
  const statusItems = buildStatusItems({
    activeFilterCount,
    activeLensLabel,
    compareKeys,
    comparingLabel,
    hasActiveFilters,
    localFilteredCount: localFiltered.length,
    mobilityFilter,
    mobilityLabel,
    rowCount: rows.length,
    scenarioKey,
    sortLabel,
    sortPillarKey,
  });

  return (
    <div className="ws-shell">
      {/* ── Global Header ── */}
      <header className="ws-header" role="banner">
        <div className="ws-header__brand">
          <span className="ws-header__title">Family Relocation Dashboard</span>
          <span className="ws-header__subtitle">28 Cities · Europe 2025–2026</span>
        </div>
        <div className="ws-header__divider" />
        <div className="ws-header__center">
          <div className="ws-header__badge" role="status" aria-label="Verification window">
            Official Sources 2022–2026
            <span className="ws-header__badge-tooltip">
              All data sourced from official government, Numbeo, and EU statistical portals.
              Verification window: January 2022 – May 2026.
            </span>
          </div>
        </div>
        <div className="ws-header__divider" />
        <div className="ws-header__actions">
          <button type="button" className="ws-icon-btn" onClick={onExportPdf} title="Save as PDF">
            <IconPdf /> PDF
          </button>
          <button type="button" className="ws-icon-btn" onClick={onExportXls} title="Export Excel">
            <IconXls /> XLS
          </button>
          <button type="button" className="ws-icon-btn" onClick={onExportCsv} title="Export CSV">
            <IconCsv /> CSV
          </button>
          <button type="button" className="ws-icon-btn" onClick={onExportJson} title="Export JSON">
            <IconJson /> JSON
          </button>
          <button type="button" className="ws-icon-btn" onClick={onShare} title="Copy share link">
            Share
          </button>
          <button type="button" className="ws-icon-btn" onClick={onGoToMap} title="Open city map">
            Map
          </button>
          <div className="ws-header__divider" />
          <button type="button" className="ws-icon-btn ws-icon-btn--cta" onClick={onGoToExplorer} title="Open City Explorer">
            City Explorer →
          </button>
        </div>
      </header>

      {/* ── Body: Sidebar + Main ── */}
      <div className="ws-body">
        <PaneA
          lensKey={lensKey}
          onLensChange={onLensChange}
          scenarioKey={scenarioKey}
          onScenarioChange={onScenarioChange}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          budgetCap={budgetCap}
          onBudgetCapChange={setBudgetCap}
          airCapRaw={airCap}
          onAirCapChange={setAirCap}
          mobilityFilter={mobilityFilter}
          onMobilityFilterChange={setMobilityFilter}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={handleClearAll}
          sortPillarKey={sortPillarLabel}
        />
        <div className="ws-main">
          <WatchlistAlertsPanel
            rows={rows}
            scenarioKey={scenarioKey}
            selectedCityKey={selectedCityKey}
            onSelectCity={handleSelectCity}
          />
          <PaneB
            rows={rows}
            filteredRows={localFiltered}
            scenarioKey={scenarioKey}
            selectedCityKey={selectedCityKey}
            hoveredCityKey={hoveredCityKey}
            onHover={setHoveredCityKey}
            onSelect={handleSelectCity}
            compareKeys={compareKeys}
            onCompareToggle={handleCompareToggle}
          />
          <PaneC
            rows={rows}
            filteredRows={localFiltered}
            selectedCityKey={selectedCityKey}
            hoveredCityKey={hoveredCityKey}
            onHover={setHoveredCityKey}
            onSelect={handleSelectCity}
            sortPillarKey={sortPillarKey}
            onSortByPillar={handleSortByPillar}
          />
        </div>
      </div>

      {/* ── Dossier Overlay ── */}
      <PaneD
        city={dossierCity}
        cityB={dossierCityB}
        isOpen={isDossierOpen}
        isCompare={isCompareMode}
        onClose={() => setDossierOpen(false)}
        onPin={toggleShortlist}
        onCompare={handleCompareToggle}
        compareKeys={compareKeys}
        pinnedKeys={pinnedKeys}
        getCityRank={getCityRank}
      />

      {/* ── Status Bar ── */}
      <footer className="ws-statusbar" role="status" aria-live="polite">
        {statusItems.map((item) => (
          <div key={item.key} className="ws-statusbar__item">
            {item.label && <span className="ws-statusbar__label">{item.label}</span>}
            <span className={item.tagClassName}>{item.value}</span>
          </div>
        ))}
      </footer>
    </div>
  );
}
