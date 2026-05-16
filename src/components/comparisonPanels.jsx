import { FamilyComparisonTables } from './familyComparisonTables.jsx';

export const InteractiveComparisonPanel = function interactiveComparisonPanel({
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
    <FamilyComparisonTables
      lensKey={lensKey}
      onLensChange={onLensChange}
      scenarioKey={scenarioKey}
      onScenarioChange={onScenarioChange}
      rows={rows}
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
      chartsSlot={chartsSlot}
    />
  );
};
