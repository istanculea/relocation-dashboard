/**
 * LensAwareScoreDisplay.jsx
 * 
 * Component showing how the active priority lens affects scoring:
 * - Current lens label and description
 * - Score breakdown by lens weights
 * - Visual indication of which pillars benefit/suffer under this lens
 * - Comparison with balanced lens if different
 */

import { priorityPresets } from '../data/dashboardConfig.js';
import { PillarTierSummary } from './PillarScoreDisplay.jsx';

const formatScore = (value) => Number(value).toFixed(2);

const getLensDeltaState = (currentScore, balancedScore) => {
  const diff = currentScore - balancedScore;
  const diffAbs = Math.abs(diff);

  if (diff > 0.1) {
    return {
      diff,
      diffAbs,
      direction: '↑',
      directionClass: 'boost',
      fitNote: 'better',
    };
  }

  if (diff < -0.1) {
    return {
      diff,
      diffAbs,
      direction: '↓',
      directionClass: 'penalty',
      fitNote: 'worse',
    };
  }

  return {
    diff,
    diffAbs,
    direction: '→',
    directionClass: 'neutral',
    fitNote: null,
  };
};

/**
 * LensLabel — shows active lens with icon and description
 */
const lensLabel = ({ lensKey, compact = false }) => {
  const preset = priorityPresets[lensKey] ?? priorityPresets.balanced;
  
  if (compact) {
    return (
      <div className="lens-label lens-label--compact">
        <span className="lens-label__name">{preset.label}</span>
      </div>
    );
  }

  return (
    <div className="lens-label">
      <div className="lens-label__header">
        <h3 className="lens-label__name">{preset.label}</h3>
      </div>
      <p className="lens-label__description">{preset.detail}</p>
    </div>
  );
};

/**
 * LensScoreImpact — shows how switching lenses changes a city's score
 */
const lensScoreImpact = ({
  city,
  currentLensKey,
  currentScore,
  balancedScore,
  showDetails = true,
}) => {
  if (!city || currentScore === undefined) {
    return null;
  }

  const { diffAbs, direction, directionClass, fitNote } = getLensDeltaState(currentScore, balancedScore);
  const shouldShowComparison = showDetails && balancedScore !== undefined;
  const shouldShowDeltaNote = diffAbs > 0.1 && fitNote;
  
  return (
    <div className={`lens-score-impact lens-score-impact--${directionClass}`}>
      <div className="lens-score-impact__row">
        <span className="lens-score-impact__label">Under '{priorityPresets[currentLensKey]?.label}':</span>
        <div className="lens-score-impact__scores">
          <span className="lens-score-impact__score">{formatScore(currentScore)}</span>
          <span className="lens-score-impact__divider">/</span>
          <span className="lens-score-impact__max">10</span>
        </div>
      </div>
      
      {shouldShowComparison && (
        <div className="lens-score-impact__comparison">
          <span className="lens-score-impact__label">vs Balanced:</span>
          <span className={`lens-score-impact__delta lens-score-impact__delta--${directionClass}`}>
            {direction} {formatScore(diffAbs)}
            {shouldShowDeltaNote && <span className="lens-score-impact__delta-note"> ({fitNote} fit)</span>}
          </span>
        </div>
      )}
    </div>
  );
};

/**
 * LensAwareScoreBreakdown — full score explanation with lens context
 */
const lensAwareScoreBreakdown = ({
  city,
  strategicBalance,
  currentLensKey,
  currentWeights,
  scenarioKey,
  profileType,
  showComparison = true,
}) => {
  if (!city || !strategicBalance) {
    return null;
  }

  const preset = priorityPresets[currentLensKey] ?? priorityPresets.balanced;
  const isMcdaBased = preset.scoreType === 'strategicBalance';
  const isPillarBased = preset.scoreType === 'strategicPillar';
  
  const topPillars = strategicBalance.pillars
    .map(p => ({ ...p, weight: currentWeights?.[p.key] ?? 0 }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3);

  return (
    <div className="lens-aware-score-breakdown">
      <div className="lens-aware-score-breakdown__header">
        <h3>Lens Scoring Summary</h3>
        <p className="lens-aware-score-breakdown__preset">
          <strong>Active Lens:</strong> {preset.label}
        </p>
      </div>

      <div className="lens-aware-score-breakdown__content">
        <div className="lens-aware-score-breakdown__section">
          <h4>Score Method</h4>
          
          {isMcdaBased && (
            <p className="lens-aware-score-breakdown__explanation">
              Uses the <strong>Balanced 15-pillar MCDA</strong> model where all pillars contribute to the final score.
            </p>
          )}
          
          {isPillarBased && (
            <p className="lens-aware-score-breakdown__explanation">
              Uses a priority lens focused on <strong>{preset.label.toLowerCase()}</strong>. 
              {topPillars.length > 0 && (
                <>
                  {' '}Top weighted contributors: <strong>{topPillars.map(p => p.label).join(', ')}</strong>.
                </>
              )}
            </p>
          )}
          
          {!isMcdaBased && !isPillarBased && (
            <p className="lens-aware-score-breakdown__explanation">
              Uses the classic 5-pillar model with custom weights.
            </p>
          )}
        </div>

        <div className="lens-aware-score-breakdown__section">
          <h4>Profile Context</h4>
          <p className="lens-aware-score-breakdown__context">
            <strong>Scenario:</strong> {scenarioKey.replace(/([A-Z])/g, ' $1').trim()} · 
            <strong className="lens-aware-score-breakdown__profile"> Profile:</strong> {profileType.replace(/_/g, ' ')}
          </p>
        </div>

        {topPillars.length > 0 && (
          <div className="lens-aware-score-breakdown__section">
            <h4>Top Weighted Pillars</h4>
            <div className="lens-aware-score-breakdown__top-pillars">
              {topPillars.map((p, idx) => (
                <div key={p.key} className="lens-aware-score-breakdown__pillar-item">
                  <span className="lens-aware-score-breakdown__rank">#{idx + 1}</span>
                  <span className="lens-aware-score-breakdown__name">{p.label}</span>
                  <span className="lens-aware-score-breakdown__metrics">
                    <span className="lens-aware-score-breakdown__score">{formatScore(p.score)}</span>
                    <span className="lens-aware-score-breakdown__weight">@{(p.weight * 100).toFixed(0)}%</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * LensSelector info — shows which lenses emphasize/de-emphasize a pillar
 */
const pillarLensRelevance = ({ pillarKey, allPresets = priorityPresets }) => {
  const presetsEmphasizing = [];
  const presetsDeemphasizing = [];
  const presetsIgnoring = [];

  Object.entries(allPresets).forEach(([key, preset]) => {
    if (!preset.pillarWeights) return;
    
    const weight = preset.pillarWeights[pillarKey];
    if (!weight) {
      presetsIgnoring.push(preset.label);
    } else if (weight > 0.15) {
      presetsEmphasizing.push({ preset: preset.label, weight });
    } else if (weight > 0) {
      presetsDeemphasizing.push({ preset: preset.label, weight });
    }
  });

  return (
    <div className="pillar-lens-relevance">
      {presetsEmphasizing.length > 0 && (
        <div className="pillar-lens-relevance__group">
          <h5>Emphasized In</h5>
          <ul>
            {presetsEmphasizing.map(p => (
              <li key={p.preset}>
                {p.preset} ({(p.weight * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {presetsDeemphasizing.length > 0 && (
        <div className="pillar-lens-relevance__group">
          <h5>Considered But Lower Priority</h5>
          <ul>
            {presetsDeemphasizing.map(p => (
              <li key={p.preset}>
                {p.preset} ({(p.weight * 100).toFixed(0)}%)
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export {
  lensAwareScoreBreakdown as LensAwareScoreBreakdown,
  lensLabel as LensLabel,
  lensScoreImpact as LensScoreImpact,
  pillarLensRelevance as PillarLensRelevance,
};
