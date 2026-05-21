import {
  ComparisonCommandCenter,
  ComparisonShortlist,
} from './familyComparisonBoardSections.jsx';

export const FamilyComparisonTables = function familyComparisonTables({
  lensKey,
  onLensChange,
  scenarioKey,
  onScenarioChange,
  rows,
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
  chartsSlot,
}) {
  return (
    <section className="panel stack-gap-lg relocation-board-panel">
      <div className="section-title">
        <p>Family Relocation Board — {rows.length} cities</p>
        <h2>Set Your Priorities. Filter the Field. Pick Your City.</h2>
        <span>
          Start by choosing a decision lens and household scenario, then use the filters to narrow the shortlist.
          The Score Charts and Balance Matrix follow so you can sense-check the numbers visually before committing
          to a shortlist. Click any city card to open its verified summary below, or head to City Explorer for the
          full dossier.
        </span>
      </div>

      <div className="family-table-stack">
        <ComparisonCommandCenter
          lensKey={lensKey}
          onLensChange={onLensChange}
          scenarioKey={scenarioKey}
          onScenarioChange={onScenarioChange}
          allRows={rows}
          totalCount={rows.length}
          filteredRows={filteredRows}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
          sortKey={sortKey}
          onSortChange={onSortChange}
          verificationFilter={verificationFilter}
          onVerificationFilterChange={onVerificationFilterChange}
          budgetFilter={budgetFilter}
          onBudgetFilterChange={onBudgetFilterChange}
          mobilityFilter={mobilityFilter}
          onMobilityFilterChange={onMobilityFilterChange}
          airFilter={airFilter}
          onAirFilterChange={onAirFilterChange}
          activeFilters={activeFilters}
          onClearFilters={onClearFilters}
          selectedCityKey={selectedCityKey}
          onSelectCity={onSelectCity}
        />

        {/* ── Score Charts + Strategic Balance Matrix (injected slot) ─── */}
        {chartsSlot}

        {filteredRows.length ? (
          <>
            <div id="sec-shortlist">
            <ComparisonShortlist
              rows={filteredRows}
              selectedCityKey={selectedCityKey}
              onSelectCity={onSelectCity}
              scenarioKey={scenarioKey}
            />
            </div>
          </>
        ) : (
          <div className="empty-state">
            <strong>No cities match this filter set.</strong>
            <span>Relax the verification, budget, mobility, or air filters to rebuild the shortlist.</span>
            <button type="button" className="toggle toggle--secondary" onClick={onClearFilters}>
              Reset filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
};