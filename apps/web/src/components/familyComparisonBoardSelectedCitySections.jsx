import { scenarioMeta } from '../data/dashboardConfig.js';
import {
  firstSentence,
  formatScore,
  getChildcareTariff,
  getMaxAqi,
  getSafetyIndex,
  getTransitEfficiencyScore,
  renderScenarioBudget,
} from './familyComparisonTableHelpers.js';
import { CellList, PhaseSection } from './familyComparisonBoardPrimitives.jsx';

export const SelectedCityBrief = function selectedCityBrief({ row, scenarioKey }) {
  if (!row) {
    return null;
  }

  const maxAqi = getMaxAqi(row);

  return (
    <PhaseSection
      phase="City Brief"
      title={`${row.city} at a Glance`}
      description={`Headline numbers for ${row.city}: what you’ll spend, what the air and safety look like, how far you can get without a car, and a frank read of the city’s strongest case for your family alongside the friction that still remains.`}
      className="phase-section--brief"
    >
      <div className="summary-grid summary-grid--scoreboard">
        <article className="summary-card summary-card--primary">
          <p>Current rank</p>
          <h3>#{row.filteredRank}</h3>
          <span>{formatScore(row.activeWeightedScore)} / 10 under the active decision lens.</span>
        </article>
        <article className="summary-card">
          <p>Scenario budget</p>
          <h3>{renderScenarioBudget(row.scenarioBudget)}</h3>
          <span>{scenarioMeta[scenarioKey].label}</span>
        </article>
        <article className="summary-card">
          <p>Air and safety</p>
          <h3>{maxAqi ? `AQI ${maxAqi}` : 'AQI mixed'}</h3>
          <span>Safety index {getSafetyIndex(row).toFixed(0)} / 100.</span>
        </article>
        <article className="summary-card">
          <p>Mobility</p>
          <h3>{getTransitEfficiencyScore(row).toFixed(1)} / 10</h3>
          <span>{row.mobility.carNeed} car need · {row.city360.fifteenMinute}</span>
        </article>
      </div>

      <div className="selected-city-grid">
        <article className="brief-section">
          <div className="brief-section__header">
            <p>Why it works</p>
            <h3>Relocation upside</h3>
          </div>
          <CellList items={[...row.comparison.pros.slice(0, 3), firstSentence(row.city360.publicVsPrivate)]} />
        </article>

        <article className="brief-section">
          <div className="brief-section__header">
            <p>Where caution stays</p>
            <h3>Drag factors</h3>
          </div>
          <CellList items={[...row.comparison.cons.slice(0, 3), firstSentence(row.city360.extremeWeather)]} />
        </article>
      </div>
    </PhaseSection>
  );
};

export const SelectedCitySignals = function selectedCitySignals({ row }) {
  if (!row) {
    return null;
  }

  return (
    <PhaseSection
      phase="Key Signals"
      title="Integration & Daily Reality"
      description={`How ${row.city} handles day-to-day integration: where fitting in is straightforward and where it takes effort, plus a candid look at housing quality, utilities, and the tax picture — the details that close-the-deal or kill it.`}
      className="phase-section--signals"
    >
      <div className="selected-city-grid">
        <article className="brief-section">
          <div className="brief-section__header">
            <p>Integration</p>
            <h3>Fitting in</h3>
          </div>
          <p className="overview-note">{row.city360.fittingIn}</p>
        </article>

        <article className="brief-section">
          <div className="brief-section__header">
            <p>Housing quality</p>
            <h3>Indoor reality</h3>
          </div>
          <CellList items={[row.city360.indoorQuality, row.city360.utilities, row.city360.personalTax]} />
        </article>
      </div>
    </PhaseSection>
  );
};

export const SelectedCityChildcareSpotlight = function selectedCityChildcareSpotlight({ row }) {
  if (!row) {
    return null;
  }

  const tariff = getChildcareTariff(row);

  return (
    <PhaseSection
      phase="Childcare"
      title={`${row.city} — Verified Childcare Costs`}
      description={`Official childcare costs for ${row.city}. Where a full municipal tariff grid exists it is shown directly; otherwise the strongest verified anchor cost is displayed with its source context.`}
      className="phase-section--childcare"
    >
      <div className="brief-section childcare-band-board">
        <div className="brief-section__header">
          <p>Selected childcare view</p>
          <h3>{row.city} childcare</h3>
        </div>

        {tariff ? (
          <>
            <div className="shortlist-card__metrics">
              <span className="signal-pill signal-pill--strong">{tariff.verifiedAt}</span>
              <span className="signal-pill">Registration fee {tariff.registrationFee}</span>
              <span className="signal-pill">Nido non-resident {tariff.nido.nonResidentMonthly}</span>
              <span className="signal-pill">Sezione primavera non-resident {tariff.sezionePrimavera.nonResidentMonthly}</span>
            </div>

            <div className="childcare-band-grid">
              <div className="table-scroll">
                <table className="childcare-band-table">
                  <thead>
                    <tr>
                      <th colSpan="2">Nido d'infanzia resident bands</th>
                    </tr>
                    <tr>
                      <th>ISEE band</th>
                      <th>Monthly fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariff.nido.residentBands.map((band) => (
                      <tr key={`${row.key}-${band.iseeBand}-nido-band`}>
                        <td>{band.iseeBand}</td>
                        <td>{band.monthly}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-scroll">
                <table className="childcare-band-table">
                  <thead>
                    <tr>
                      <th colSpan="2">Sezione primavera resident bands</th>
                    </tr>
                    <tr>
                      <th>ISEE band</th>
                      <th>Monthly fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tariff.sezionePrimavera.residentBands.map((band) => (
                      <tr key={`${row.key}-${band.iseeBand}-spring-band`}>
                        <td>{band.iseeBand}</td>
                        <td>{band.monthly}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <CellList items={tariff.reductions} />
          </>
        ) : (
          <>
            <p className="overview-note">{row.verifiedChildcare ?? row.childcare.nurseryNet}</p>
            <CellList
              items={[
                firstSentence(row.city360.stateAid),
                firstSentence(row.city360.publicVsPrivate),
                row.verifiedChildcare ? 'This childcare fact is in the strict verified layer.' : 'This childcare cost is still partly modeled for comparison, not a full official tariff grid.',
              ]}
            />
          </>
        )}
      </div>
    </PhaseSection>
  );
};