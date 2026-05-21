/**
 * PillarScoreDisplay.jsx
 * 
 * Unified component for displaying the 15-pillar MCDA breakdown with:
 * - Individual pillar scores (0-10)
 * - Active lens weights
 * - Contribution to weighted score
 * - Comparison across different lenses (optional)
 */

import { strategicBalancePillars } from '../data/dashboardConfig.js';

const formatScore = (value) => Number(value).toFixed(2);

/**
 * PillarScoreRow — single pillar display
 * Shows score, weight %, and contribution to final score
 */
export const PillarScoreRow = ({ pillar, weight, finalScore }) => {
  const contribution = pillar.score * weight;
  const contributionPct = (contribution / finalScore) * 100;
  
  return (
    <div className="pillar-score-row">
      <div className="pillar-score-row__info">
        <span className="pillar-score-row__label">{pillar.label}</span>
        <span className="pillar-score-row__key">{pillar.key}</span>
      </div>
      
      <div className="pillar-score-row__score">
        <span className="pillar-score-row__value">{formatScore(pillar.score)}</span>
        <span className="pillar-score-row__unit">/10</span>
      </div>
      
      <div className="pillar-score-row__weight">
        <span className="pillar-score-row__weight-label">Weight</span>
        <span className="pillar-score-row__weight-value">{(weight * 100).toFixed(0)}%</span>
      </div>
      
      <div 
        className="pillar-score-row__bar" 
        role="meter" 
        aria-valuenow={pillar.score} 
        aria-valuemin={0} 
        aria-valuemax={10}
        aria-label={`${pillar.label}: ${formatScore(pillar.score)}/10, weight ${(weight * 100).toFixed(0)}%, contribution ${formatScore(contribution)}`}
      >
        <div 
          className="pillar-score-row__fill"
          style={{ width: `${(pillar.score / 10) * 100}%` }}
        />
      </div>
      
      <div className="pillar-score-row__contribution">
        <span className="pillar-score-row__contrib-value">{formatScore(contribution)}</span>
        <span className="pillar-score-row__contrib-pct">{contributionPct.toFixed(0)}%</span>
      </div>
    </div>
  );
};

/**
 * PillarScoreGrid — full 15-pillar breakdown
 * Displays all pillars organized by tier with weights and contributions
 */
export const PillarScoreGrid = ({ 
  pillars, 
  weights, 
  finalScore,
  hideWeights = false,
  compact = false,
  title = '15-Pillar Score Grid',
}) => {
  if (!pillars || !weights) {
    return null;
  }

  const pillarsByKey = Object.fromEntries(pillars.map(p => [p.key, p]));
  const sortedKeys = strategicBalancePillars.map(([key]) => key).filter(k => pillarsByKey[k]);
  
  return (
    <div className={`pillar-score-grid ${compact ? 'pillar-score-grid--compact' : ''}`}>
      {title && <h3 className="pillar-score-grid__title">{title}</h3>}
      
      <div className="pillar-score-grid__header">
        <span className="pillar-score-grid__col-label">Pillar</span>
        <span className="pillar-score-grid__col-score">Score</span>
        {!hideWeights && <span className="pillar-score-grid__col-weight">Weight</span>}
        <span className="pillar-score-grid__col-bar">Progress</span>
        <span className="pillar-score-grid__col-contrib">Contribution</span>
      </div>
      
      <div className="pillar-score-grid__rows">
        {sortedKeys.map(key => {
          const pillar = pillarsByKey[key];
          const weight = weights[key] ?? 0;
          
          return (
            <PillarScoreRow
              key={key}
              pillar={pillar}
              weight={weight}
              finalScore={finalScore}
            />
          );
        })}
      </div>
      
      <div className="pillar-score-grid__footer">
        <span className="pillar-score-grid__footer-label">Weighted Total</span>
        <span className="pillar-score-grid__footer-score">{formatScore(finalScore)}/10</span>
      </div>
    </div>
  );
};

/**
 * PillarWeightComparison — shows how weights differ across lenses
 * Useful for showing impact of switching priority presets
 */
export const PillarWeightComparison = ({
  pillars,
  currentWeights,
  comparisonWeights,
  currentLensLabel,
  comparisonLensLabel,
}) => {
  if (!pillars || !currentWeights || !comparisonWeights) {
    return null;
  }

  const pillarsByKey = Object.fromEntries(pillars.map(p => [p.key, p]));
  const sortedKeys = strategicBalancePillars.map(([key]) => key).filter(k => pillarsByKey[k]);
  
  return (
    <div className="pillar-weight-comparison">
      <div className="pillar-weight-comparison__header">
        <h3>Weight Comparison</h3>
        <div className="pillar-weight-comparison__labels">
          <span className="pillar-weight-comparison__label">{currentLensLabel}</span>
          <span className="pillar-weight-comparison__label">{comparisonLensLabel}</span>
        </div>
      </div>
      
      <div className="pillar-weight-comparison__rows">
        {sortedKeys.map(key => {
          const pillar = pillarsByKey[key];
          const currentW = currentWeights[key] ?? 0;
          const comparisonW = comparisonWeights[key] ?? 0;
          const diff = comparisonW - currentW;
          const diffIndicator = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
          const diffClass = diff > 0.05 ? 'increased' : diff < -0.05 ? 'decreased' : 'same';
          
          return (
            <div key={key} className="pillar-weight-comparison__row">
              <span className="pillar-weight-comparison__label-col">{pillar.label}</span>
              <div className="pillar-weight-comparison__weight">
                <span>{(currentW * 100).toFixed(0)}%</span>
              </div>
              <div className={`pillar-weight-comparison__indicator ${diffClass}`}>
                {diffIndicator}
              </div>
              <div className="pillar-weight-comparison__weight">
                <span>{(comparisonW * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * PillarTierSummary — shows which pillars are heavily weighted in current lens
 */
export const PillarTierSummary = ({ pillars, weights, topCount = 5 }) => {
  if (!pillars || !weights) {
    return null;
  }

  const pillarsByKey = Object.fromEntries(pillars.map(p => [p.key, p]));
  const weighted = strategicBalancePillars
    .map(([key]) => ({ key, ...pillarsByKey[key], weight: weights[key] ?? 0 }))
    .filter(p => pillarsByKey[p.key])
    .sort((a, b) => b.weight - a.weight);

  const topPillars = weighted.slice(0, topCount);
  const bottomPillars = weighted.slice(-topCount).reverse();

  return (
    <div className="pillar-tier-summary">
      <div className="pillar-tier-summary__section">
        <h4 className="pillar-tier-summary__heading">Highest Priority Pillars</h4>
        <div className="pillar-tier-summary__list">
          {topPillars.map((p, idx) => (
            <div key={p.key} className="pillar-tier-summary__item">
              <span className="pillar-tier-summary__rank">#{idx + 1}</span>
              <span className="pillar-tier-summary__name">{p.label}</span>
              <span className="pillar-tier-summary__weight">{(p.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="pillar-tier-summary__section">
        <h4 className="pillar-tier-summary__heading">Lower Priority Pillars</h4>
        <div className="pillar-tier-summary__list">
          {bottomPillars.map((p, idx) => (
            <div key={p.key} className="pillar-tier-summary__item">
              <span className="pillar-tier-summary__rank">#{topCount + idx + 1}</span>
              <span className="pillar-tier-summary__name">{p.label}</span>
              <span className="pillar-tier-summary__weight">{(p.weight * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
