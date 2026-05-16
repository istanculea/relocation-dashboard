/**
 * DilemmaMatrix.jsx — src/components/
 *
 * Dual-city tie-breaker layout — a dedicated side-by-side view for exactly
 * 2 competing cities, mapping their pros/cons and pillar trade-offs.
 *
 * ── Integration ──────────────────────────────────────────────────────────────
 * Render when exactly 2 cities are pinned in the ComparisonTray, or surface it
 * as a dedicated "Dilemma" mode from the City Explorer.
 *
 *   import { DilemmaMatrix } from './components/DilemmaMatrix.jsx';
 *
 *   // Option A: pass city rows directly
 *   <DilemmaMatrix cityA={pinnedRows[0]} cityB={pinnedRows[1]} scenarioKey={scenarioKey} />
 *
 *   // Option B: wire from shortlisted keys
 *   const [cityA, cityB] = shortlistedCityKeys
 *     .slice(0, 2)
 *     .map(k => allRows.find(r => r.key === k));
 *   <DilemmaMatrix cityA={cityA} cityB={cityB} scenarioKey={scenarioKey} />
 *
 * Props
 * ─────
 * @prop {object}  cityA        — first city row (full enriched object)
 * @prop {object}  cityB        — second city row
 * @prop {string}  [scenarioKey='oneParent']
 */

// ---------------------------------------------------------------------------
// Pillar config
// ---------------------------------------------------------------------------

const PILLARS = [
  { key: 'euRegistration',        label: 'Residency' },
  { key: 'diplomaRecognition',    label: 'Diploma' },
  { key: 'realEstateHousing',     label: 'Real Estate' },
  { key: 'rentalMarket',          label: 'Rental Market' },
  { key: 'homeOwnership',         label: 'Ownership' },
  { key: 'locationInfra',         label: 'Location' },
  { key: 'cleanBasket',           label: 'Shopping Basket' },
  { key: 'childcareEducation',    label: 'Childcare' },
  { key: 'healthMedical',         label: 'Healthcare' },
  { key: 'envPollution',          label: 'Pollution' },
  { key: 'criminalityStreetSafe', label: 'Safety' },
  { key: 'mobilityLogistics',     label: 'Mobility' },
  { key: 'economyJobsTaxes',      label: 'Economy' },
  { key: 'climateResilience',     label: 'Climate' },
  { key: 'socialCapital',         label: 'Social' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getPillarScore = (row, key) => {
  const pillars = row?.strategicBalance?.pillars ?? [];
  const match = pillars.find(
    (p) =>
      p.key === key ||
      (p.label && p.label.toLowerCase().includes(key.slice(0, 7).toLowerCase())),
  );

  return Number(match?.score) || 0;
};

const fmt = (v) => (Number.isFinite(v) ? Number(v).toFixed(1) : '—');

const deltaClass = (scoreA, scoreB) => {
  const diff = scoreA - scoreB;
  if (Math.abs(diff) < 0.2) return '';
  return diff > 0 ? 'dilemma-pillar__a--win' : 'dilemma-pillar__b--win';
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const ProsConsList = ({ items = [], type = 'pros', city = '' }) => (
  <ul
    className={`dilemma-list dilemma-list--${type}`}
    aria-label={`${type === 'pros' ? 'Pros' : 'Cons'} for ${city}`}
  >
    {items.slice(0, 5).map((item, i) => (
      <li key={i} className="dilemma-list__item">
        <span className="dilemma-list__icon" aria-hidden="true">
          {type === 'pros' ? '✓' : '✗'}
        </span>
        {item}
      </li>
    ))}
    {items.length === 0 && (
      <li className="dilemma-list__item dilemma-list__item--empty">No data available.</li>
    )}
  </ul>
);

const PillarRow = ({ label, scoreA, scoreB }) => {
  const aWin = scoreA > scoreB + 0.19;
  const bWin = scoreB > scoreA + 0.19;

  return (
    <div className="dilemma-pillar-row">
      <div className={`dilemma-pillar__a ${aWin ? 'dilemma-pillar__a--win' : ''}`}>
        <span className="dilemma-pillar__score">{fmt(scoreA)}</span>
        {aWin && <span className="dilemma-pillar__badge" aria-label="Wins this pillar">▲</span>}
      </div>

      <div className="dilemma-pillar__label" title={label}>{label}</div>

      <div className={`dilemma-pillar__b ${bWin ? 'dilemma-pillar__b--win' : ''}`}>
        {bWin && <span className="dilemma-pillar__badge" aria-label="Wins this pillar">▲</span>}
        <span className="dilemma-pillar__score">{fmt(scoreB)}</span>
      </div>
    </div>
  );
};

const BudgetRow = ({ cityA, cityB, scenarioKey }) => {
  const budgetA = cityA?.budgets?.[scenarioKey]?.midpoint ?? cityA?.scenarioBudget ?? null;
  const budgetB = cityB?.budgets?.[scenarioKey]?.midpoint ?? cityB?.scenarioBudget ?? null;

  if (!budgetA && !budgetB) return null;

  const cheaper = budgetA < budgetB ? 'a' : budgetB < budgetA ? 'b' : null;

  return (
    <div className="dilemma-budget-row">
      <span className={`dilemma-budget ${cheaper === 'a' ? 'dilemma-budget--win' : ''}`}>
        {budgetA ? `€${Number(budgetA).toLocaleString('en-IE')} / mo` : '—'}
      </span>
      <span className="dilemma-budget__label">Monthly budget</span>
      <span className={`dilemma-budget ${cheaper === 'b' ? 'dilemma-budget--win' : ''}`}>
        {budgetB ? `€${Number(budgetB).toLocaleString('en-IE')} / mo` : '—'}
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * DilemmaMatrix
 */
export const DilemmaMatrix = ({ cityA = null, cityB = null, scenarioKey = 'oneParent' }) => {
  if (!cityA || !cityB) {
    return (
      <div className="dilemma-matrix dilemma-matrix--empty panel">
        <p>Pin exactly 2 cities in the comparison tray to activate the Tie-Breaker view.</p>
      </div>
    );
  }

  const overallA = cityA.activeWeightedScore ?? cityA.strategicBalance?.weightedScore ?? 0;
  const overallB = cityB.activeWeightedScore ?? cityB.strategicBalance?.weightedScore ?? 0;
  const overallWinner = overallA > overallB ? 'a' : overallB > overallA ? 'b' : null;

  const narrative = cityA.comparison?.narrative ?? cityB.comparison?.narrative ?? null;

  return (
    <section
      className="dilemma-matrix panel"
      aria-label={`Tie-breaker comparison: ${cityA.city} vs ${cityB.city}`}
    >
      {/* ── Header with city names and overall scores ────────────── */}
      <header className="dilemma-header">
        <div className={`dilemma-city dilemma-city--a ${overallWinner === 'a' ? 'dilemma-city--winner' : ''}`}>
          <h3 className="dilemma-city__name">{cityA.city}</h3>
          <span className="dilemma-city__country">{cityA.country}</span>
          <span className="dilemma-city__score" aria-label={`Overall score: ${fmt(overallA)}`}>
            {fmt(overallA)}
          </span>
          {overallWinner === 'a' && (
            <span className="dilemma-city__winner-badge">Overall lead</span>
          )}
        </div>

        <div className="dilemma-vs" aria-hidden="true">VS</div>

        <div className={`dilemma-city dilemma-city--b ${overallWinner === 'b' ? 'dilemma-city--winner' : ''}`}>
          <h3 className="dilemma-city__name">{cityB.city}</h3>
          <span className="dilemma-city__country">{cityB.country}</span>
          <span className="dilemma-city__score" aria-label={`Overall score: ${fmt(overallB)}`}>
            {fmt(overallB)}
          </span>
          {overallWinner === 'b' && (
            <span className="dilemma-city__winner-badge">Overall lead</span>
          )}
        </div>
      </header>

      {/* ── Budget comparison ────────────────────────────────────── */}
      <BudgetRow cityA={cityA} cityB={cityB} scenarioKey={scenarioKey} />

      {/* ── 9-pillar score grid ──────────────────────────────────── */}
      <div className="dilemma-pillars" aria-label="Pillar score comparison">
        <div className="dilemma-pillars__city-labels" aria-hidden="true">
          <span>{cityA.city}</span>
          <span>Pillar</span>
          <span>{cityB.city}</span>
        </div>
        {PILLARS.map(({ key, label }) => (
          <PillarRow
            key={key}
            label={label}
            scoreA={getPillarScore(cityA, key)}
            scoreB={getPillarScore(cityB, key)}
          />
        ))}
      </div>

      {/* ── Pros / Cons duel ─────────────────────────────────────── */}
      <div className="dilemma-pros-cons">
        <div className="dilemma-pros-cons__col">
          <h4 className="dilemma-pros-cons__heading">
            {cityA.city} — pros
          </h4>
          <ProsConsList items={cityA.comparison?.pros} type="pros" city={cityA.city} />

          <h4 className="dilemma-pros-cons__heading">
            {cityA.city} — cons
          </h4>
          <ProsConsList items={cityA.comparison?.cons} type="cons" city={cityA.city} />
        </div>

        <div className="dilemma-pros-cons__col">
          <h4 className="dilemma-pros-cons__heading">
            {cityB.city} — pros
          </h4>
          <ProsConsList items={cityB.comparison?.pros} type="pros" city={cityB.city} />

          <h4 className="dilemma-pros-cons__heading">
            {cityB.city} — cons
          </h4>
          <ProsConsList items={cityB.comparison?.cons} type="cons" city={cityB.city} />
        </div>
      </div>

      {/* ── Move-here / Stay-away trade-off narratives ───────────── */}
      <div className="dilemma-narratives">
        {[cityA, cityB].map((city) => (
          <div key={city.key} className="dilemma-narrative">
            <h4 className="dilemma-narrative__city">{city.city}</h4>
            {city.city360?.moveHereIf && (
              <p className="dilemma-narrative__block dilemma-narrative__block--move">
                <strong>Move here if:</strong> {city.city360.moveHereIf}
              </p>
            )}
            {city.city360?.stayAwayIf && (
              <p className="dilemma-narrative__block dilemma-narrative__block--stay">
                <strong>Stay away if:</strong> {city.city360.stayAwayIf}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* ── Comparison narrative (from cityComparisonMeta) ───────── */}
      {narrative && (
        <div className="dilemma-comparison-narrative">
          <h4 className="dilemma-comparison-narrative__title">Trade-off analysis</h4>
          <p className="dilemma-comparison-narrative__text">{narrative}</p>
        </div>
      )}
    </section>
  );
};
