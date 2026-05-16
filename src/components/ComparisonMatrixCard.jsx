import { AuditBadge } from './verificationPanelShared.jsx';
import {
  buildChildcareSummary,
  firstSentence,
  formatScore,
  getBudgetBandLabel,
  getChildcareTariff,
  getLanguageBarrierInfo,
  getMaxAqi,
  getMonthlyPassDisplay,
  getSafetyIndex,
  getStrategicPillar,
  getTransitEfficiencyScore,
  renderScenarioBudget,
} from './familyComparisonTableHelpers.js';

const getTier = (score, strong, good, mixed = good) => (
  score >= strong ? 'strong' : score >= good ? 'good' : score >= mixed ? 'mixed' : 'drag'
);

const getPm25Tier = (value) => {
  if (!value) {
    return '';
  }

  if (value < 12) {
    return 'strong';
  }

  if (value < 25) {
    return 'mixed';
  }

  return 'drag';
};

const buildAirDisplay = (row, maxAqi) => (
  row.mobility.pm25
    ? `PM2.5 ${row.mobility.pm25} µg/m³`
    : maxAqi
      ? `AQI max ${maxAqi}`
      : firstSentence(row.city360.ecoFactors)
);

const renderChildcareBadge = (tariff, verifiedChildcare) => {
  if (tariff) {
    return <span className="rm-cell__badge rm-cell__badge--strong">Official tariffs</span>;
  }

  if (verifiedChildcare) {
    return <span className="rm-cell__badge">Verified</span>;
  }

  return null;
};

const MatrixCardHeader = function matrixCardHeader({ row, scoreTier }) {
  return (
    <div className="matrix-card__header">
      <div className="matrix-card__meta">
        <span className="matrix-card__rank">#{row.filteredRank}</span>
        <div>
          <strong className="matrix-card__city">{row.city}</strong>
          <span className="matrix-card__country">{row.country}</span>
        </div>
      </div>
      <p className="matrix-card__tagline">{row.tagline}</p>
      <div className="matrix-card__score-wrap">
        <strong className={`matrix-card__score matrix-card__score--${scoreTier}`}>{formatScore(row.activeWeightedScore)}</strong>
        <AuditBadge status={row.audit.overall} compact />
      </div>
    </div>
  );
};

const MatrixPillarStrip = function matrixPillarStrip({ pillars }) {
  return (
    <div className="mc-pillar-strip" aria-label="Pillar scores">
      {pillars.map((pillar) => (
        <div key={pillar.key} className="mc-pillar">
          <span className="mc-pillar__label">{pillar.label}</span>
          <div className="mc-pillar__track" title={`${pillar.label}: ${pillar.score}`}>
            <div className="mc-pillar__fill" style={{ width: `${(pillar.score / 10) * 100}%` }} />
          </div>
          <span className="mc-pillar__value">{pillar.score.toFixed(1)}</span>
        </div>
      ))}
    </div>
  );
};

const MatrixHousingCell = function matrixHousingCell({ row }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Housing &amp; Costs</span>
      <strong className="rm-cell__primary">{renderScenarioBudget(row.scenarioBudget)}</strong>
      <span className="rm-cell__detail">{getBudgetBandLabel(row.scenarioBudget)}</span>
      <span className="rm-cell__detail">Rent 2BR: {row.housing.rentSafe2Bed}</span>
      <span className="rm-cell__detail rm-cell__detail--subtle">Buy: {row.housing.buyCentre}</span>
    </div>
  );
};

const MatrixHealthCell = function matrixHealthCell({ airDisplay, pm25Tier, pm25Value, row }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Health, Medical Access</span>
      {pm25Value ? (
        <div className={`rm-pm25 rm-pm25--${pm25Tier}`}>
          <span>Air Quality (PM2.5)</span>
          <div className="rm-pm25__bar-wrap">
            <div className="rm-pm25__bar" style={{ width: `${Math.min((pm25Value / 35) * 100, 100)}%` }} />
          </div>
          <strong>{pm25Value} µg</strong>
        </div>
      ) : (
        <span className="rm-cell__detail">{airDisplay}</span>
      )}
      {row.health?.privateCover && <span className="rm-cell__detail">Private: {row.health.privateCover}</span>}
      {row.city360?.hospitalQuality && <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.hospitalQuality)}</span>}
    </div>
  );
};

const MatrixChildcareCell = function matrixChildcareCell({ row, tariff }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Childcare &amp; Education</span>
      <span className="rm-cell__primary rm-cell__primary--sm">{buildChildcareSummary(row)}</span>
      {renderChildcareBadge(tariff, row.verifiedChildcare)}
      {row.childcare?.schoolStart && <span className="rm-cell__detail">{row.childcare.schoolStart}</span>}
      <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.stateAid)}</span>
    </div>
  );
};

const MatrixEconomyCell = function matrixEconomyCell({ jobsPillar, row }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Economy, Jobs, Taxes &amp; Parity</span>
      {jobsPillar && (
        <div className={`matrix-tier-row matrix-tier--${jobsPillar.tier.toLowerCase()}`}>
          <span>Economy</span>
          <strong>{jobsPillar.score.toFixed(1)} · {jobsPillar.tier}</strong>
        </div>
      )}
      {row.city360?.personalTax && <span className="rm-cell__detail">Tax: {row.city360.personalTax}</span>}
      {row.city360?.jobMarket && <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.jobMarket)}</span>}
    </div>
  );
};

const MatrixSocialCell = function matrixSocialCell({ langInfo, langTier, row }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Social &amp; Work-Life</span>
      <div className={`matrix-tier-row matrix-tier--${langTier}`}>
        <span>Language</span>
        <strong>{langInfo.score.toFixed(1)} · {langInfo.summary}</strong>
      </div>
      {row.city360?.fittingIn && <span className="rm-cell__detail">{firstSentence(row.city360.fittingIn)}</span>}
      {row.city360?.community && <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.community)}</span>}
    </div>
  );
};

const MatrixSafetyCell = function matrixSafetyCell({ row, safetyIndex }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Criminality &amp; Street Safety</span>
      <strong className="rm-cell__primary">Safety {safetyIndex.toFixed(0)}<small> / 100</small></strong>
      {row.city360?.safetyIndex && <span className="rm-cell__detail">{firstSentence(row.city360.safetyIndex)}</span>}
      {row.mobility.parkScore ? <span className="rm-cell__detail rm-cell__detail--subtle">Parks: {row.mobility.parkScore}</span> : null}
    </div>
  );
};

const MatrixMobilityCell = function matrixMobilityCell({ row, transitPass, transitScore, transitTier }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Mobility &amp; Transit</span>
      <strong className="rm-cell__primary">Transit {transitScore.toFixed(1)}<small> / 10</small></strong>
      <div className={`matrix-tier-row matrix-tier--${transitTier}`}>
        <span>Car need</span>
        <strong>{row.mobility.carNeed}</strong>
      </div>
      {transitPass && <span className="rm-cell__detail">Pass: {transitPass}</span>}
      {row.city360?.natureConnectivity && <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.natureConnectivity)}</span>}
    </div>
  );
};

const MatrixUrbanCell = function matrixUrbanCell({ row }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Urban Design</span>
      {row.city360?.fifteenMinute && <span className="rm-cell__detail">15-min: {row.city360.fifteenMinute}</span>}
      {row.city360?.bikeLanes && <span className="rm-cell__detail">Bike: {row.city360.bikeLanes}</span>}
      {row.city360?.traffic && <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.traffic)}</span>}
    </div>
  );
};

const MatrixNutritionCell = function matrixNutritionCell({ row }) {
  return (
    <div className="rm-cell">
      <span className="rm-cell__label">Nutrition &amp; Food</span>
      <span className="rm-cell__detail">Basket: {row.basket.availability}</span>
      {row.city360?.dining && <span className="rm-cell__detail">Dining: {row.city360.dining}</span>}
      {row.city360?.waterQuality && <span className="rm-cell__detail rm-cell__detail--subtle">{firstSentence(row.city360.waterQuality)}</span>}
    </div>
  );
};

export const MatrixCityCard = function matrixCityCard({ row, isActive, onSelectCity }) {
  const tariff = getChildcareTariff(row);
  const maxAqi = getMaxAqi(row);
  const safetyIndex = getSafetyIndex(row);
  const transitPass = getMonthlyPassDisplay(row);
  const transitScore = getTransitEfficiencyScore(row);
  const langInfo = getLanguageBarrierInfo(row);
  const jobsPillar = getStrategicPillar(row, 'economyJobsTaxes');
  const airDisplay = buildAirDisplay(row, maxAqi);
  const langTier = getTier(langInfo.score, 8, 7, 5);
  const transitTier = getTier(transitScore, 8, 7, 6);
  const scoreTier = getTier(row.activeWeightedScore, 7.5, 6, 5);
  const pm25Value = row.mobility?.pm25 ?? null;
  const pm25Tier = getPm25Tier(pm25Value);

  return (
    <button
      type="button"
      className={isActive ? 'matrix-card matrix-card--active' : 'matrix-card'}
      onClick={() => onSelectCity(row.key)}
    >
      <MatrixCardHeader row={row} scoreTier={scoreTier} />
      <MatrixPillarStrip pillars={row.strategicBalance.pillars} />

      <div className="matrix-card__cues">
        <span className="matrix-cue matrix-cue--move">
          <span className="matrix-cue__label">Move</span>
          {firstSentence(row.city360.moveHereIf)}
        </span>
        <span className="matrix-cue matrix-cue--skip">
          <span className="matrix-cue__label">Skip</span>
          {firstSentence(row.city360.stayAwayIf)}
        </span>
      </div>

      <div className="matrix-card__body">
        <MatrixHousingCell row={row} />
        <MatrixHealthCell row={row} airDisplay={airDisplay} pm25Tier={pm25Tier} pm25Value={pm25Value} />
        <MatrixChildcareCell row={row} tariff={tariff} />
        <MatrixEconomyCell jobsPillar={jobsPillar} row={row} />
        <MatrixSocialCell langInfo={langInfo} langTier={langTier} row={row} />
        <MatrixSafetyCell row={row} safetyIndex={safetyIndex} />
        <MatrixMobilityCell row={row} transitPass={transitPass} transitScore={transitScore} transitTier={transitTier} />
        <MatrixUrbanCell row={row} />
        <MatrixNutritionCell row={row} />
      </div>
    </button>
  );
};
