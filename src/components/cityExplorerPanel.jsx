import { useState, useRef, useEffect } from 'react';
import { City360OverviewPanel } from './city360Panels';
import { SelectedCityVerificationPanel } from './verifiedSnapshotPanels';
import { DataSanityPanel } from './DataSanityPanel.jsx';
import { FinancingEnginePanel } from './FinancingEnginePanel.jsx';

/* ─── Searchable city combobox ───────────────────────────────────────────── */

function CityCombobox({ cityOptions, selectedCity, onSelectCity }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);
  const listRef = useRef(null);

  const selectedLabel = selectedCity
    ? `${selectedCity.city}, ${selectedCity.country}`
    : '';

  const filtered = query.trim()
    ? cityOptions.filter((c) =>
        `${c.city}, ${c.country}`.toLowerCase().includes(query.toLowerCase()),
      )
    : cityOptions;

  const handleFocus = () => {
    // Only clear typed query when first opening — preserve it if already open
    if (!open) setQuery('');
    setOpen(true);
  };

  const handleChange = (e) => {
    setQuery(e.target.value);
    setOpen(true);
  };

  const handleSelect = (key) => {
    onSelectCity(key);
    setQuery('');
    setOpen(false);
  };

  const handleBlur = (e) => {
    if (containerRef.current && !containerRef.current.contains(e.relatedTarget)) {
      setOpen(false);
      setQuery('');
    }
  };

  const inputValue = open ? query : selectedLabel;

  return (
    <div className="city-combobox" ref={containerRef} onBlur={handleBlur}>
      <input
        type="text"
        className="city-combobox__input"
        placeholder="Search or select a city..."
        value={inputValue}
        onChange={handleChange}
        onFocus={handleFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
      />
      {open && filtered.length > 0 && (
        <ul className="city-combobox__list" ref={listRef} role="listbox">
          {filtered.map((c) => (
            <li
              key={c.key}
              className={`city-combobox__option${selectedCity?.key === c.key ? ' city-combobox__option--selected' : ''}`}
              role="option"
              aria-selected={selectedCity?.key === c.key}
              onMouseDown={() => handleSelect(c.key)}
            >
              {c.city}, {c.country}
            </li>
          ))}
        </ul>
      )}
      {open && filtered.length === 0 && (
        <div className="city-combobox__empty">No cities match "{query}"</div>
      )}
    </div>
  );
}

/* ─── main panel ─────────────────────────────────────────────────────────── */

export const CityExplorerPanel = function cityExplorerPanel({
  cityOptions,
  selectedCity,
  selectedSnapshot,
  onSelectCity,
  scenarioKey,
  selectedYear,
  onYearChange,
  rankingRows,
  thresholds,
}) {
  return (
    <section className="panel stack-gap-lg explorer-panel">
      <div className="detail-explorer-header">
        <div className="detail-explorer-header__text">
          <h2 className="detail-explorer-header__title">Location Insights</h2>
          {!selectedCity && (
            <p className="detail-explorer-header__hint">Select a city from the list to see its full profile.</p>
          )}
        </div>
        <div className="detail-explorer-controls">
          <CityCombobox
            cityOptions={cityOptions}
            selectedCity={selectedCity}
            onSelectCity={onSelectCity}
          />
        </div>
      </div>

      {selectedCity && (
        <>
          <City360OverviewPanel
            city={selectedCity}
            scenarioKey={scenarioKey}
            selectedYear={selectedYear}
            onYearChange={onYearChange}
            rankingRows={rankingRows}
            thresholds={thresholds}
            embedded
          />

          <SelectedCityVerificationPanel city={selectedCity} snapshot={selectedSnapshot} embedded />

          <FinancingEnginePanel city={selectedCity} scenarioKey={scenarioKey} />

          <DataSanityPanel city={selectedCity} />
        </>
      )}
    </section>
  );
};