import { scenarioMeta } from '../data/dashboardConfig.js';
import { PinToggle } from './ComparisonTray.jsx';
import {
  buildChildcareSummary,
  firstSentence,
  formatScore,
  getChildcareTariff,
  getLanguageBarrierInfo,
  getMaxAqi,
  getSafetyIndex,
  renderScenarioBudget,
} from './familyComparisonTableHelpers.js';

export const ShortlistCityCard = function shortlistCityCard({ row, isSelected, onSelectCity, scenarioKey }) {
  const maxAqi = getMaxAqi(row);
  const tariff = getChildcareTariff(row);
  const safetyIndex = getSafetyIndex(row);
  const langInfo = getLanguageBarrierInfo(row);
  const airDisplay = row.mobility.pm25
    ? `PM2.5 ${row.mobility.pm25} µg/m³`
    : maxAqi
      ? `AQI max ${maxAqi}`
      : 'AQI mixed';
  const scoreTier = row.activeWeightedScore >= 7.5 ? 'strong' : row.activeWeightedScore >= 6 ? 'good' : row.activeWeightedScore >= 5 ? 'mixed' : 'drag';

  return (
    <div className="shortlist-card-wrap">
      <button
        type="button"
        className={isSelected ? 'shortlist-card shortlist-card--active' : 'shortlist-card'}
        onClick={() => onSelectCity(row.key)}
      >
        <div className="shortlist-card__header">
          <div>
            <p>#{row.filteredRank}</p>
            <h3>{row.city}</h3>
            <span>{row.country}</span>
          </div>
          <strong className={`shortlist-score shortlist-score--${scoreTier}`}>{formatScore(row.activeWeightedScore)}</strong>
        </div>

        <p className="shortlist-card__tagline">{row.tagline}</p>

        <div className="shortlist-card__pillars">
          {row.strategicBalance.pillars.map((pillar) => {
            const barTier = pillar.score >= 7.5 ? 'strong' : pillar.score >= 6 ? 'good' : pillar.score >= 5 ? 'mixed' : 'drag';
            return (
              <div key={pillar.key} className="shortlist-pillar">
                <span className="shortlist-pillar__label">{pillar.label}</span>
                <div className="shortlist-pillar__track">
                  <span
                    className={`shortlist-pillar__fill shortlist-pillar__fill--${barTier}`}
                    style={{ width: `${(pillar.score / 10) * 100}%` }}
                  />
                </div>
                <span className="shortlist-pillar__value">{pillar.score.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        <div className="shortlist-card__stats">
          <p className="shortlist-stat__group-label">Housing &amp; Costs</p>
          <div className="shortlist-stat">
            <span>{scenarioMeta[scenarioKey].label}</span>
            <strong>{renderScenarioBudget(row.scenarioBudget)}</strong>
          </div>
          <div className="shortlist-stat">
            <span>Rent 2BR</span>
            <strong>{row.housing.rentSafe2Bed}</strong>
          </div>
          <div className="shortlist-stat">
            <span>Buy price</span>
            <strong>{row.housing.buyCentre}</strong>
          </div>

          <p className="shortlist-stat__group-label">Family &amp; Safety</p>
          <div className="shortlist-stat">
            <span>Childcare</span>
            <strong>{buildChildcareSummary(row)}</strong>
          </div>
          <div className="shortlist-stat">
            <span>Safety index</span>
            <strong>{safetyIndex.toFixed(0)} / 100</strong>
          </div>
          <div className="shortlist-stat">
            <span>Air quality</span>
            <strong>{airDisplay}</strong>
          </div>

          <p className="shortlist-stat__group-label">Healthcare &amp; Mobility</p>
          <div className="shortlist-stat">
            <span>Private cover</span>
            <strong>{row.health?.privateCover ?? '—'}</strong>
          </div>
          <div className="shortlist-stat">
            <span>Language</span>
            <strong>{langInfo.score.toFixed(1)} / 10 · {langInfo.summary}</strong>
          </div>
          <div className="shortlist-stat">
            <span>Car need</span>
            <strong>{row.mobility.carNeed}</strong>
          </div>
        </div>

        <div className="shortlist-card__metrics">
          <span className="signal-pill">{airDisplay}</span>
          <span className="signal-pill">{row.verifiedCount} verified section{row.verifiedCount !== 1 ? 's' : ''}</span>
          <span className={tariff ? 'signal-pill signal-pill--strong' : 'signal-pill'}>
            {tariff ? 'Municipal childcare bands' : row.verifiedChildcare ? 'Verified childcare' : 'Modeled childcare'}
          </span>
        </div>

        <p className="shortlist-card__footer">{firstSentence(row.city360.moveHereIf)}</p>
      </button>
      <div className="shortlist-card-wrap__actions">
        <PinToggle cityKey={row.key} label={`Pin ${row.city}`} />
      </div>
    </div>
  );
};
