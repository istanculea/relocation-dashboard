import { priorityPresets, scenarioMeta } from '../data/dashboardConfig.js';
import { MatrixCityCard } from './ComparisonMatrixCard.jsx';
import { ShortlistCityCard } from './ComparisonShortlistCard.jsx';
import { useShortlist } from '../context/DashboardContext.jsx';
import {
  airOptions,
  budgetOptions,
  formatScore,
  mobilityOptions,
  renderScenarioBudget,
  sortOptions,
  verificationOptions,
} from './familyComparisonTableHelpers.js';
import { CellList, CityButton, PhaseSection } from './familyComparisonBoardPrimitives.jsx';

export const ComparisonCommandCenter = function comparisonCommandCenter({
  lensKey,
  onLensChange,
  scenarioKey,
  onScenarioChange,
  allRows,
  totalCount,
  filteredRows,
  searchValue,
  onSearchChange,
  sortKey,
  onSortChange,
  verificationFilter,
  onVerificationFilterChange,
  budgetFilter,
  onBudgetFilterChange,
  mobilityFilter,
  onMobilityFilterChange,
  airFilter,
  onAirFilterChange,
  activeFilters,
  onClearFilters,
  selectedCityKey,
  onSelectCity,
}) {
  const topRow = filteredRows[0] ?? null;
  const budgets = filteredRows.map((row) => row.scenarioBudget);
  const verifiedChildcareCount = filteredRows.filter((row) => row.verifiedChildcare).length;
  const cleanestAirRow = filteredRows.reduce((best, row) => {
    const pm = row.mobility?.pm25;
    const bestPm = best?.mobility?.pm25;
    if (!Number.isFinite(pm)) return best;
    if (!Number.isFinite(bestPm)) return row;
    return pm < bestPm ? row : best;
  }, null);
  const bestChildcareRow = filteredRows.reduce((best, row) => {
    return (row.scores?.childcare ?? 0) > (best?.scores?.childcare ?? 0) ? row : best;
  }, null);

  return (
    <PhaseSection
      phase="Step 1 — Customise"
      title="Relocation Command Centre"
      description={`Choose how you want to weigh the tradeoffs. Pick a decision lens that matches your family's priorities, select your household scenario, and use the filters to narrow the field. All ${totalCount} cities rank instantly below — click any name to jump straight to its dossier.`}
      className="phase-section--command"
    >
      <div className="relocation-command">

        {/* ── Lens + Scenario selectors ─────────────────────── */}
        <div className="cc-controls-row">
          <div className="cc-control-group">
            <p className="cc-group-label">Decision lens</p>
            <div className="cc-pill-row" role="group" aria-label="Select decision lens">
              {Object.entries(priorityPresets).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  className={key === lensKey ? 'cc-pill cc-pill--active' : 'cc-pill'}
                  onClick={() => onLensChange(key)}
                  aria-pressed={key === lensKey}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="cc-active-desc">
              <strong className="cc-active-name">{priorityPresets[lensKey].label}</strong>
              <span>{priorityPresets[lensKey].detail}</span>
            </div>
          </div>

          <div className="cc-control-group cc-control-group--scenario">
            <p className="cc-group-label">Household scenario</p>
            <div className="cc-pill-row" role="group" aria-label="Select household scenario">
              {Object.entries(scenarioMeta).map(([key, scenario]) => (
                <button
                  key={key}
                  type="button"
                  className={key === scenarioKey ? 'cc-pill cc-pill--active' : 'cc-pill'}
                  onClick={() => onScenarioChange(key)}
                  aria-pressed={key === scenarioKey}
                >
                  {scenario.label}
                </button>
              ))}
            </div>
            <div className="cc-active-desc">
              <span>{scenarioMeta[scenarioKey].budgetLabel}</span>
            </div>
          </div>
        </div>

        {/* ── Shortlist filters ─────────────────────────────── */}
        <div className="cc-filters-wrap">
          <p className="cc-group-label">Shortlist filters</p>
          <div className="filter-toolbar">
            <label className="filter-field filter-field--search">
              <span>Search city or country</span>
              <input value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Bilbao, Italy, Germany..." />
            </label>

            <label className="filter-field">
              <span>Sort</span>
              <select value={sortKey} onChange={(event) => onSortChange(event.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Verification</span>
              <select value={verificationFilter} onChange={(event) => onVerificationFilterChange(event.target.value)}>
                {verificationOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Budget</span>
              <select value={budgetFilter} onChange={(event) => onBudgetFilterChange(event.target.value)}>
                {budgetOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Mobility</span>
              <select value={mobilityFilter} onChange={(event) => onMobilityFilterChange(event.target.value)}>
                {mobilityOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-field">
              <span>Air profile</span>
              <select value={airFilter} onChange={(event) => onAirFilterChange(event.target.value)}>
                {airOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="control-actions">
            <div className="filter-chip-list">
              {activeFilters.length ? (
                activeFilters.map((item) => (
                  <span key={item} className="filter-chip">
                    {item}
                  </span>
                ))
              ) : (
                <span className="filter-chip filter-chip--muted">No extra filters applied</span>
              )}
            </div>
            <button type="button" className="cc-clear-btn" onClick={onClearFilters}>
              Clear filters
            </button>
          </div>
        </div>

        {/* ── City ranking strip ────────────────────────────── */}
        {allRows?.length ? (
          <div className="cc-strip-wrap">
            <p className="cc-group-label">All {totalCount} cities ranked — {priorityPresets[lensKey].label} lens</p>
            <div className="city-ranking-strip" aria-label="City ranking quick navigation">
              {allRows.map((row, index) => (
                <button
                  key={`${row.key}-strip`}
                  type="button"
                  className={row.key === selectedCityKey ? 'city-strip-btn city-strip-btn--active' : 'city-strip-btn'}
                  onClick={() => onSelectCity(row.key)}
                  title={`${row.city}, ${row.country} — ${formatScore(row.activeWeightedScore)} / 10`}
                >
                  <span className="city-strip-btn__rank">#{index + 1}</span>
                  <strong>{row.city}</strong>
                  <span className={`city-strip-btn__score city-strip-btn__score--${row.activeWeightedScore >= 7.5 ? 'strong' : row.activeWeightedScore >= 6 ? 'good' : row.activeWeightedScore >= 5 ? 'mixed' : 'drag'}`}>{formatScore(row.activeWeightedScore)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {/* ── Shortlist snapshot ────────────────────────────── */}
        <div className="cc-snapshot-grid">
          <article className="cc-snapshot-card cc-snapshot-card--green">
            <div className="cc-snapshot-top">
              <p className="cc-snapshot-label">Shortlist</p>
              <span className="cc-snapshot-accent">{filteredRows.length > 0 ? 'Active' : 'No match'}</span>
            </div>
            <p className="cc-snapshot-value">{filteredRows.length}<span className="cc-snapshot-denom"> / {totalCount}</span></p>
            <p className="cc-snapshot-detail">Cities matching all active filters.</p>
          </article>

          <article className="cc-snapshot-card cc-snapshot-card--amber">
            <div className="cc-snapshot-top">
              <p className="cc-snapshot-label">Top fit</p>
              <span className="cc-snapshot-accent">{topRow ? `${formatScore(topRow.activeWeightedScore)} / 10` : '—'}</span>
            </div>
            <p className="cc-snapshot-value cc-snapshot-value--city">{topRow ? topRow.city : 'No match'}</p>
            <p className="cc-snapshot-detail">{topRow ? `${topRow.country} — ${priorityPresets[lensKey].label} lens.` : 'Relax one filter to restore results.'}</p>
          </article>

          <article className="cc-snapshot-card cc-snapshot-card--blue">
            <div className="cc-snapshot-top">
              <p className="cc-snapshot-label">Budget range</p>
              <span className="cc-snapshot-accent">{scenarioMeta[scenarioKey].label}</span>
            </div>
            <p className="cc-snapshot-value cc-snapshot-value--budget">
              {budgets.length ? `${renderScenarioBudget(Math.min(...budgets))}` : '—'}
              {budgets.length > 1 ? <span className="cc-snapshot-range"> – {renderScenarioBudget(Math.max(...budgets))}</span> : null}
            </p>
            <p className="cc-snapshot-detail">Monthly household spend, low to high.</p>
          </article>

          <article className="cc-snapshot-card cc-snapshot-card--green">
            <div className="cc-snapshot-top">
              <p className="cc-snapshot-label">Cleanest air</p>
              <span className="cc-snapshot-accent">{cleanestAirRow?.mobility?.pm25 ? `PM2.5 ${cleanestAirRow.mobility.pm25} μg/m³` : 'No PM2.5 data'}</span>
            </div>
            <p className="cc-snapshot-value cc-snapshot-value--city">{cleanestAirRow ? cleanestAirRow.city : '—'}</p>
            <p className="cc-snapshot-detail">Lowest particulate matter in current shortlist.</p>
          </article>

          <article className="cc-snapshot-card cc-snapshot-card--amber">
            <div className="cc-snapshot-top">
              <p className="cc-snapshot-label">Best childcare</p>
              <span className="cc-snapshot-accent">{bestChildcareRow ? `${formatScore(bestChildcareRow.scores.childcare)} / 10` : '—'}</span>
            </div>
            <p className="cc-snapshot-value cc-snapshot-value--city">{bestChildcareRow ? bestChildcareRow.city : '—'}</p>
            <p className="cc-snapshot-detail">Highest childcare pillar score in shortlist.</p>
          </article>

          <article className="cc-snapshot-card cc-snapshot-card--blue">
            <div className="cc-snapshot-top">
              <p className="cc-snapshot-label">Verified childcare</p>
              <span className="cc-snapshot-accent">{verifiedChildcareCount ? 'Official data' : 'Modeled'}</span>
            </div>
            <p className="cc-snapshot-value">{verifiedChildcareCount}<span className="cc-snapshot-denom"> cities</span></p>
            <p className="cc-snapshot-detail">{verifiedChildcareCount ? 'Cities with official childcare anchors.' : 'No verified childcare in this shortlist.'}</p>
          </article>
        </div>

      </div>
    </PhaseSection>
  );
};

const SCORE_PILLARS = [
  { key: 'housing', label: 'Housing' },
  { key: 'environment', label: 'Environ.' },
  { key: 'childcare', label: 'Childcare' },
  { key: 'safety', label: 'Safety' },
  { key: 'healthcare', label: 'Medical' },
];

export const ComparisonShortlist = function comparisonShortlist({ rows, selectedCityKey, onSelectCity, scenarioKey }) {
  const { shortlistedCityKeys } = useShortlist();

  return (
    <PhaseSection
      phase="Step 2 — Compare"
      title={`Shortlist Scorecards — ${rows.length} cities`}
      description={`Your filtered shortlist, ranked by the active lens. Each card shows the five weighted pillar scores, headline decision signals, and verified-data flags. Pin up to two cities to unlock the side-by-side Conflict Resolver. Click any card to open its full summary below.`}
      className="phase-section--shortlist"
    >
      {shortlistedCityKeys.length === 1 && (
        <div className="compare-hint">
          <span>📌 1 city pinned — pin a second city to unlock the <strong>Dual-City Conflict Resolver</strong>.</span>
        </div>
      )}
      {shortlistedCityKeys.length === 2 && (
        <div className="compare-hint compare-hint--ready">
          <span>⚖️ 2 cities pinned — the <strong>Conflict Resolver</strong> is active below the charts.</span>
        </div>
      )}
      <div className="shortlist-grid">
        {rows.map((row) => (
          <ShortlistCityCard
            key={row.key}
            row={row}
            isSelected={row.key === selectedCityKey}
            onSelectCity={onSelectCity}
            scenarioKey={scenarioKey}
          />
        ))}
      </div>
    </PhaseSection>
  );
};

export const ComparisonMatrix = function comparisonMatrix({ rows, selectedCityKey, onSelectCity }) {
  return (
    <PhaseSection
      phase="Phase 3"
      title="Interactive Relocation Matrix"
      description={`${rows.length} cities profiled across all nine schema pillars: housing costs, health & medical access, childcare & education, environment & pollution, social & work-life, criminality & street safety, mobility, urban design, and nutrition. Click any card to open the full city dossier.`}
      className="phase-section--matrix"
    >
      <div className="matrix-card-list">
        {rows.map((row) => (
          <MatrixCityCard
            key={row.key}
            row={row}
            isActive={row.key === selectedCityKey}
            onSelectCity={onSelectCity}
          />
        ))}
      </div>
    </PhaseSection>
  );
};