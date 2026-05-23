import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_HOUSEHOLD_PROFILE, priorityPresets, scenarioMeta } from '../data/dashboardConfig.js';
import { PaneD } from './WorkstationDossierPanel.jsx';
import { useShortlist } from '../context/DashboardContext.jsx';
import { Scatterplot } from './WorkstationScatterplot.jsx';
import { formatEuro } from '../utils/formatters.js';
import { SimulationEngine } from './SimulationEngine.jsx';
import { CityMapPage } from './CityMapPage.jsx';
import { ScenarioLabSection } from './ScenarioLabSection.jsx';
import { EvidenceCenterPanel } from './EvidenceCenterPanel.jsx';

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

const buildHouseholdImpactSummary = (profile) => {
  const chips = [];

  if (profile.kidsCount > DEFAULT_HOUSEHOLD_PROFILE.kidsCount) {
    chips.push({
      key: 'kids',
      label: `Kids: ${profile.kidsCount}`,
      reason: 'Higher childcare and school-quality impact in score weighting.',
    });
  }

  if (profile.hasPets) {
    chips.push({
      key: 'pets',
      label: 'Pets enabled',
      reason: 'Adds environmental quality and social-capital influence.',
    });
  }

  if (profile.remoteWorkRatio !== DEFAULT_HOUSEHOLD_PROFILE.remoteWorkRatio) {
    chips.push({
      key: 'remote',
      label: `Remote: ${Math.round(profile.remoteWorkRatio * 100)}%`,
      reason: 'Shifts score pressure toward jobs, social rhythm, and neighborhood fit.',
    });
  }

  if (profile.languageLevel !== DEFAULT_HOUSEHOLD_PROFILE.languageLevel) {
    chips.push({
      key: 'language',
      label: `Language: ${profile.languageLevel}`,
      reason: 'Adjusts relocation-friction sensitivity in score adjustments.',
    });
  }

  if (profile.budgetSensitivity !== DEFAULT_HOUSEHOLD_PROFILE.budgetSensitivity) {
    chips.push({
      key: 'budget',
      label: `Budget: ${profile.budgetSensitivity}`,
      reason: 'Rebalances score toward affordability stress or flexibility.',
    });
  }

  if (profile.commuteTolerance !== DEFAULT_HOUSEHOLD_PROFILE.commuteTolerance) {
    chips.push({
      key: 'commute',
      label: `Commute: ${profile.commuteTolerance}`,
      reason: 'Changes mobility and infrastructure weight contribution.',
    });
  }

  if (profile.riskAppetite !== DEFAULT_HOUSEHOLD_PROFILE.riskAppetite) {
    chips.push({
      key: 'risk',
      label: `Risk: ${profile.riskAppetite}`,
      reason: 'Tilts score between safety resilience and growth upside.',
    });
  }

  if (chips.length === 0) {
    chips.push({
      key: 'baseline',
      label: 'Baseline profile',
      reason: 'Default household calibration with balanced score signals.',
    });
  }

  return chips;
};

function PaneA({
  lensKey, onLensChange,
  scenarioKey,
  householdProfile,
  onHouseholdProfileChange,
  searchValue, onSearchChange,
  budgetCap, onBudgetCapChange,
  airCapRaw, onAirCapChange,
  mobilityFilter, onMobilityFilterChange,
  hasActiveFilters, onClearFilters,
  sortPillarKey,
}) {
  const lensEntries = Object.entries(priorityPresets);
  const remoteWorkRatioPercent = Math.round((householdProfile.remoteWorkRatio ?? 0) * 100);
  const scenarioLabel = scenarioMeta[scenarioKey]?.label ?? 'Adaptive';
  const impactChips = buildHouseholdImpactSummary(householdProfile);

  const updateHousehold = (patch) => {
    onHouseholdProfileChange({ ...householdProfile, ...patch });
  };

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

        {/* Household Builder */}
        <div className="ws-control-group">
          <div className="ws-control-label">Household Builder</div>
          <div className="ws-household-grid">
            <label className="ws-field">
              <span className="ws-field__label">Kids</span>
              <input
                type="number"
                min={0}
                max={4}
                className="ws-input"
                value={householdProfile.kidsCount}
                onChange={(event) => updateHousehold({ kidsCount: Number(event.target.value) })}
                aria-label="Household kids count"
              />
            </label>
            <label className="ws-field ws-field--checkbox">
              <input
                type="checkbox"
                checked={householdProfile.hasPets}
                onChange={(event) => updateHousehold({ hasPets: event.target.checked })}
                aria-label="Household includes pets"
              />
              <span className="ws-field__label">Pets in household</span>
            </label>
            <label className="ws-field">
              <span className="ws-field__label">Remote work ({remoteWorkRatioPercent}%)</span>
              <input
                type="range"
                className="ws-slider"
                min={0}
                max={100}
                step={5}
                value={remoteWorkRatioPercent}
                onChange={(event) => updateHousehold({ remoteWorkRatio: Number(event.target.value) / 100 })}
                aria-label="Remote work ratio"
              />
            </label>
            <label className="ws-field">
              <span className="ws-field__label">Language readiness</span>
              <select
                className="ws-select"
                value={householdProfile.languageLevel}
                onChange={(event) => updateHousehold({ languageLevel: event.target.value })}
                aria-label="Household language readiness"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="fluent">Fluent</option>
              </select>
            </label>
            <label className="ws-field">
              <span className="ws-field__label">Budget stance</span>
              <select
                className="ws-select"
                value={householdProfile.budgetSensitivity}
                onChange={(event) => updateHousehold({ budgetSensitivity: event.target.value })}
                aria-label="Household budget stance"
              >
                <option value="strict">Strict</option>
                <option value="balanced">Balanced</option>
                <option value="flexible">Flexible</option>
              </select>
            </label>
            <label className="ws-field">
              <span className="ws-field__label">Commute tolerance</span>
              <select
                className="ws-select"
                value={householdProfile.commuteTolerance}
                onChange={(event) => updateHousehold({ commuteTolerance: event.target.value })}
                aria-label="Household commute tolerance"
              >
                <option value="low">Low</option>
                <option value="moderate">Moderate</option>
                <option value="high">High</option>
              </select>
            </label>
            <label className="ws-field">
              <span className="ws-field__label">Risk appetite</span>
              <select
                className="ws-select"
                value={householdProfile.riskAppetite}
                onChange={(event) => updateHousehold({ riskAppetite: event.target.value })}
                aria-label="Household risk appetite"
              >
                <option value="low">Low</option>
                <option value="balanced">Balanced</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="ws-household-foot">
            <span className="ws-control-hint">Budget model: {scenarioLabel}</span>
            <button type="button" className="ws-link-btn" onClick={() => onHouseholdProfileChange(DEFAULT_HOUSEHOLD_PROFILE)}>
              Reset household
            </button>
          </div>
          <div className="ws-household-impact" aria-label="Household impact summary">
            {impactChips.map((chip) => (
              <span key={chip.key} className="ws-impact-chip" title={chip.reason}>
                <strong>{chip.label}</strong>
                {chip.reason}
              </span>
            ))}
          </div>
          <p className="ws-control-hint">{scenarioMeta[scenarioKey]?.budgetLabel}</p>
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
}) {
  const [separationIntensity, setSeparationIntensity] = useState('medium');

  return (
    <section className="ws-scatter-section" aria-label="Affordability and Quality of Life table">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Affordability &amp; Quality of Life</span>
        <div className="ws-scatter-header-tools">
          <div className="ws-legend">
            <span className="ws-legend-item"><span className="ws-legend-swatch" style={{ background: 'rgba(47,127,98,0.55)' }}/>Good Value</span>
            <span className="ws-legend-item"><span className="ws-legend-swatch" style={{ background: 'rgba(55,106,146,0.55)' }}/>Premium</span>
            <span className="ws-legend-item"><span className="ws-legend-swatch" style={{ background: 'rgba(120,120,140,0.45)' }}/>Cheap</span>
            <span className="ws-legend-item"><span className="ws-legend-swatch" style={{ background: 'rgba(197,124,42,0.55)' }}/>Poor Value</span>
          </div>
          <div className="scp-intensity" role="group" aria-label="Scatterplot separation intensity">
            <span className="scp-intensity__label">Separation</span>
            <button
              type="button"
              className={`scp-intensity__btn${separationIntensity === 'soft' ? ' scp-intensity__btn--active' : ''}`}
              onClick={() => setSeparationIntensity('soft')}
            >
              Soft
            </button>
            <button
              type="button"
              className={`scp-intensity__btn${separationIntensity === 'medium' ? ' scp-intensity__btn--active' : ''}`}
              onClick={() => setSeparationIntensity('medium')}
            >
              Medium
            </button>
            <button
              type="button"
              className={`scp-intensity__btn${separationIntensity === 'strong' ? ' scp-intensity__btn--active' : ''}`}
              onClick={() => setSeparationIntensity('strong')}
            >
              Strong
            </button>
          </div>
        </div>
      </div>
      <div style={{ flex: '1 1 0', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Scatterplot
          rows={rows}
          filteredRows={filteredRows}
          scenarioKey={scenarioKey}
          selectedCityKey={selectedCityKey}
          hoveredCityKey={hoveredCityKey}
          separationIntensity={separationIntensity}
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
  const visibleRows = filteredRows;
  const pillars = visibleRows[0]?.strategicBalance?.pillars ?? [];

  // Sort only visible (already filtered) rows: selected sort pillar first, then by score
  const sortedRows = [...visibleRows].sort((a, b) => {
    if (sortPillarKey) {
      const pa = a.strategicBalance.pillars.find((p) => p.label === sortPillarKey)?.score ?? 0;
      const pb = b.strategicBalance.pillars.find((p) => p.label === sortPillarKey)?.score ?? 0;
      if (pb !== pa) return pb - pa;
    }
    return b.activeWeightedScore - a.activeWeightedScore;
  });

  return (
    <section className="ws-pane ws-pane--heatmap" aria-label="Heatmap Matrix">
      <div className="ws-pane__header">
        <span className="ws-pane__title">Strategic Heatmap</span>
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
            {sortedRows.map((row, idx) => {
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
  scenarioKey,
  householdProfile,
  onHouseholdProfileChange,
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
  cityOptions,
  selectedExplorerCity,
  selectedVerifiedSnapshot,
  mapComparisonCity,
  onMapComparisonCityChange,
  mapNeighborCount,
  onMapNeighborCountChange,
  mapMode,
  onMapModeChange,
  mapPersona,
  onMapPersonaChange,
  futureOutlookRows,
  selectedYear,
  onSelectedYearChange,
  shockType,
  onShockTypeChange,
  shockSeverity,
  onShockSeverityChange,
  scenarioLabPresets,
  selectedScenarioLabPresetKey,
  onScenarioLabPresetChange,
  savedScenarioLabRuns,
  activeScenarioLabRun,
  onScenarioLabSaveRun,
  onScenarioLabLoadRun,
  onScenarioLabDeleteRun,
  // share link action
  onShare,
  onResetLink,
  isLinkCustomized,
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
    const pm = r.mobility?.pm25;
    const carNeed = r.mobility?.carNeed ?? '';
    const withinBudget = !budgetFilterIsActive || budget <= budgetCap;
    const withinAirCap = !airFilterIsActive || (Number.isFinite(pm) && pm <= airCap);

    return withinBudget && withinAirCap && matchesMobility(carNeed);
  });

  useEffect(() => {
    const allowedKeys = new Set(localFiltered.map((row) => row.key));

    setCompareKeys((previous) => {
      const next = new Set([...previous].filter((key) => allowedKeys.has(key)));
      return next.size === previous.size ? previous : next;
    });

    if (selectedCityKey && !allowedKeys.has(selectedCityKey)) {
      onSelectCity(null);
      setDossierOpen(false);
    }
  }, [localFiltered, onSelectCity, selectedCityKey]);

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

  const selectedCity = localFiltered.find((r) => r.key === selectedCityKey) ?? null;
  const compareArr = [...compareKeys];
  const isCompareMode = compareArr.length === 2;
  const { dossierCity, dossierCityB } = resolveDossierCities(compareArr, isCompareMode, localFiltered, selectedCity);
  const isDossierOpen = dossierOpen && (selectedCity !== null || isCompareMode);
  const pinnedKeys = new Set(shortlistedCityKeys);

  const getCityRank = useCallback((key) => {
    const idx = localFiltered.findIndex((r) => r.key === key);
    return idx >= 0 ? idx + 1 : null;
  }, [localFiltered]);

  const hasActiveFilters = searchValue.trim().length > 0 || budgetCap < 4500 || airCap < 40 || mobilityFilter !== 'all' || activeFilters.length > 0;

  const topCity = localFiltered[0] ?? null;
  const averageScore = localFiltered.length > 0
    ? localFiltered.reduce((sum, row) => sum + (row.activeWeightedScore ?? 0), 0) / localFiltered.length
    : null;
  const scenarioBudgets = localFiltered
    .map((row) => row.budgets?.[scenarioKey]?.midpoint ?? row.scenarioBudget ?? null)
    .filter((value) => Number.isFinite(value));
  const sortedScenarioBudgets = [...scenarioBudgets].sort((a, b) => a - b);
  const midBudgetIndex = Math.floor(sortedScenarioBudgets.length / 2);
  const medianScenarioBudget = sortedScenarioBudgets.length === 0
    ? null
    : sortedScenarioBudgets.length % 2 === 1
      ? sortedScenarioBudgets[midBudgetIndex]
      : (sortedScenarioBudgets[midBudgetIndex - 1] + sortedScenarioBudgets[midBudgetIndex]) / 2;
  const cleanAirCount = localFiltered.filter((row) => Number.isFinite(row.mobility?.pm25) && row.mobility.pm25 <= 12).length;
  const cleanAirShare = localFiltered.length > 0 ? Math.round((cleanAirCount / localFiltered.length) * 100) : 0;

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
          <span className="ws-header__title">European Strategic Atlas</span>
          <span className="ws-header__subtitle">Relocation Intelligence Cockpit · 28 Cities</span>
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
          <span
            className={`ws-link-state ${isLinkCustomized ? 'ws-link-state--customized' : 'ws-link-state--clean'}`}
            role="status"
            aria-live="polite"
          >
            Link: {isLinkCustomized ? 'Customized' : 'Clean'}
          </span>
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
          <button type="button" className="ws-icon-btn" onClick={onResetLink} title="Clear URL share payload">
            Reset Link
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

      <section className="ws-atlas-deck" aria-label="Strategic atlas command deck">
        <article className="ws-atlas-deck__card">
          <span className="ws-atlas-deck__label">Current Leader</span>
          <strong>{topCity ? `${topCity.city}, ${topCity.country}` : 'No city in scope'}</strong>
          <small>{topCity ? `Score ${fmt(topCity.activeWeightedScore)}` : 'Adjust filters to recover scope'}</small>
        </article>
        <article className="ws-atlas-deck__card">
          <span className="ws-atlas-deck__label">Median Family Budget</span>
          <strong>{medianScenarioBudget !== null ? formatEuro(medianScenarioBudget) : 'N/A'}</strong>
          <small>{scenarioMeta[scenarioKey]?.label ?? scenarioKey}</small>
        </article>
        <article className="ws-atlas-deck__card">
          <span className="ws-atlas-deck__label">Average Strategic Score</span>
          <strong>{averageScore !== null ? fmt(averageScore) : 'N/A'}</strong>
          <small>{localFiltered.length} {localFiltered.length === 1 ? 'city' : 'cities'} in view</small>
        </article>
        <article className="ws-atlas-deck__card">
          <span className="ws-atlas-deck__label">Clean-Air Coverage</span>
          <strong>{cleanAirShare}%</strong>
          <small>Share of cities at PM2.5 ≤ 12</small>
        </article>
        <article className="ws-atlas-deck__card">
          <span className="ws-atlas-deck__label">Decision Confidence</span>
          <strong>
            {topCity?.decisionEngine
              ? `${Math.round(topCity.decisionEngine.overallConfidence * 100)}% (${topCity.decisionEngine.confidenceBand})`
              : 'N/A'}
          </strong>
          <small>
            {topCity?.decisionEngine?.reasonCodes?.length
              ? topCity.decisionEngine.reasonCodes.slice(0, 2).map((reason) => reason.label).join(' · ')
              : 'Reason codes unavailable'}
          </small>
        </article>
      </section>

      {/* ── Body: Sidebar + Main ── */}
      <div className="ws-body">
        <PaneA
          lensKey={lensKey}
          onLensChange={onLensChange}
          scenarioKey={scenarioKey}
          householdProfile={householdProfile}
          onHouseholdProfileChange={onHouseholdProfileChange}
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
          <SimulationEngine />
          <div className="ws-split-row">
            <PaneB
              rows={rows}
              filteredRows={localFiltered}
              scenarioKey={scenarioKey}
              selectedCityKey={selectedCityKey}
              hoveredCityKey={hoveredCityKey}
              onHover={setHoveredCityKey}
              onSelect={handleSelectCity}
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

          <section className="ws-section-shell" aria-label="Map intelligence section" id="sec-map-intel">
            <div className="ws-pane__header">
              <span className="ws-pane__title">Map Intelligence</span>
            </div>
            <div className="ws-section-shell__body">
              <CityMapPage
                embedded
                cityOptions={cityOptions}
                selectedCity={selectedExplorerCity}
                onSelectCity={onSelectCity}
                comparisonCityKey={mapComparisonCity}
                onComparisonCityChange={onMapComparisonCityChange}
                nearestNeighborCount={mapNeighborCount}
                onNearestNeighborCountChange={onMapNeighborCountChange}
                selectedModeKey={mapMode}
                onModeChange={onMapModeChange}
                selectedPersonaKey={mapPersona}
                onPersonaChange={onMapPersonaChange}
              />
            </div>
          </section>

          <ScenarioLabSection
            rows={futureOutlookRows}
            cityOptions={cityOptions}
            selectedCityKey={selectedCityKey}
            onSelectCity={onSelectCity}
            selectedYear={selectedYear}
            onYearChange={onSelectedYearChange}
            shockType={shockType}
            shockSeverity={shockSeverity}
            onShockTypeChange={onShockTypeChange}
            onShockSeverityChange={onShockSeverityChange}
            presets={scenarioLabPresets}
            selectedPresetKey={selectedScenarioLabPresetKey}
            onApplyPreset={onScenarioLabPresetChange}
            savedRuns={savedScenarioLabRuns}
            activeRun={activeScenarioLabRun}
            onSaveRun={onScenarioLabSaveRun}
            onLoadRun={onScenarioLabLoadRun}
            onDeleteRun={onScenarioLabDeleteRun}
          />

          <EvidenceCenterPanel
            city={selectedExplorerCity}
            snapshot={selectedVerifiedSnapshot}
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
