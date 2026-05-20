import { StrategicRadarChart } from './StrategicRadarChart.jsx';

export const CityMapInsightsPanel = function cityMapInsightsPanel({
  comparisonCity,
  contrastLines,
  explanationLines,
  focusCity,
  focusConnections,
  focusDimensions,
  focusIntel,
  focusNeighborhoods,
  onSelectCity,
  selectedCityTruthBad,
  selectedCityTruthGood,
  selectedForecast,
  selectedModeProfile,
  selectedPersonaProfile,
  selectedUrbanDNA,
  selectedWeeklyLife,
  transportModeMeta,
  formatDistance,
  formatHoursLabel,
  radarRows,
}) {
  return (
    <>
      <section className="city-map-intel-grid">
        <article className="city-map-selection city-map-selection--intel">
          <p className="city-map-selection__eyebrow">Strategic profile</p>
          {focusCity && focusDimensions && focusIntel ? (
            <>
              <h4>{focusCity.city}, {focusCity.country}</h4>
              <p className="city-map-selection__summary">
                {focusIntel.fitSummary}
              </p>
              <div className="city-map-selection__chips" aria-label="Active relocation lens">
                <span>{selectedModeProfile.label}</span>
                <span>{selectedPersonaProfile.label}</span>
                <span>{focusIntel.fitBand} fit</span>
              </div>
              {explanationLines.length > 0 && (
                <ul className="city-map-selection__bullets">
                  {explanationLines.slice(0, 4).map((line) => <li key={line}>{line}</li>)}
                </ul>
              )}
              <div className="city-map-intel-metrics">
                <span>{focusDimensions.countriesReachableByRail} countries reachable by rail in one day</span>
                <span>{focusDimensions.carFreeErrands}% errands can be done car-free</span>
                <span>{focusDimensions.commuteMinutes} min average commute</span>
                <span>{focusDimensions.pediatricClinics} pediatric clinics in metro area</span>
                <span>{focusDimensions.greenCoverage}% urban green coverage</span>
              </div>
              {selectedCityTruthGood.length > 0 && (
                <div>
                  <strong className="city-map-selection__headline">Why this city ranks highly</strong>
                  <ul className="city-map-selection__bullets">
                    {selectedCityTruthGood.slice(0, 3).map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </div>
              )}
              {selectedWeeklyLife.length > 0 && (
                <div>
                  <strong className="city-map-selection__headline">A week living here</strong>
                  <ul className="city-map-selection__bullets">
                    {selectedWeeklyLife.map((line) => <li key={line}>{line}</li>)}
                  </ul>
                </div>
              )}
              {selectedUrbanDNA && (
                <p className="city-map-selection__narrative">Urban DNA: {selectedUrbanDNA}</p>
              )}
              {focusNeighborhoods.length > 0 && (
                <ul className="city-map-intel-neighborhoods">
                  {focusNeighborhoods.map((profile) => (
                    <li key={profile.name}>
                      <strong>{profile.name}</strong>
                      <small>{profile.note}</small>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <span>Select a city to open relocation intelligence.</span>
          )}
        </article>

        <article className="city-map-selection city-map-selection--routes" aria-label="Nearest city routes">
          <strong className="city-map-selection__headline">Closest strategic alternatives</strong>
          {focusConnections.length > 0 ? (
            <ul className="city-map-route-list">
              {focusConnections.map(({ city, distanceKm, modes, travelHoursByMode, fastestMode }) => (
                <li key={city.key}>
                  <button type="button" onClick={() => onSelectCity(city.key)}>
                    <span>{city.city}, {city.country}</span>
                    <small>
                      {formatDistance(distanceKm)}
                      {' · '}
                      {modes.map((mode) => transportModeMeta[mode].shortLabel).join('/')}
                      {' · fastest '}
                      {transportModeMeta[fastestMode].shortLabel}
                      {' '}
                      {formatHoursLabel(travelHoursByMode[fastestMode])}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <span>Select a city to reveal nearest relocation alternatives.</span>
          )}
        </article>
      </section>

      <section className="city-map-deep-intel-grid" aria-label="Strategic intelligence details">
        <article className="city-map-selection city-map-selection--contrast">
          <p className="city-map-selection__eyebrow">Strategic contrast</p>
          <strong className="city-map-selection__headline">
            {comparisonCity ? `${focusCity?.city ?? 'Selected city'} compared with ${comparisonCity.city}` : 'No comparison selected'}
          </strong>
          {contrastLines.length > 0 ? (
            <ul className="city-map-selection__bullets">
              {contrastLines.map((line) => <li key={line.key}>{line.text}</li>)}
            </ul>
          ) : (
            <span>Choose a comparison city to expose the tradeoffs.</span>
          )}
          {selectedCityTruthBad.length > 0 && (
            <>
              <strong className="city-map-selection__headline">Hidden friction</strong>
              <ul className="city-map-selection__bullets">
                {selectedCityTruthBad.slice(0, 3).map((line) => <li key={line}>{line}</li>)}
              </ul>
            </>
          )}
        </article>

        <article className="city-map-selection city-map-selection--forecast">
          <p className="city-map-selection__eyebrow">Forecast layer</p>
          {selectedForecast ? (
            <>
              <strong className="city-map-selection__headline">Infrastructure evolution</strong>
              <ul className="city-map-timeline">
                {selectedForecast.timeline.map((item) => (
                  <li key={item.year}>
                    <span>{item.year}</span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </li>
                ))}
              </ul>
              <div className="city-map-forecast-notes">
                <p>Projected rail integration: +{selectedForecast.railGrowth}% by 2035</p>
                <p>Climate resilience outlook: {selectedForecast.climateState}</p>
                <p>Affordability outlook: {selectedForecast.affordabilityState}</p>
                <p>{selectedForecast.infrastructureState}</p>
              </div>
              <div className="city-map-radar-wrap">
                <StrategicRadarChart selectedCity={focusCity} filteredRows={radarRows} size={360} />
              </div>
            </>
          ) : (
            <span>Select a city to open the forecast layer.</span>
          )}
        </article>
      </section>
    </>
  );
};
