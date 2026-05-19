# MCDA 15-Pillar Redesign with Family Priority Personalization

## Overview

This redesign unifies the dashboard's scoring system around the **15-pillar MCDA (Multi-Criteria Decision Analysis) engine** and implements comprehensive **personalization by family priorities** across all UI sections.

## Key Changes

### 1. Data Model Enhancements (relocationData.js)

Updated `buildRanking()` to attach lens context to each city:

```javascript
{
  activeLensKey: 'balanced',           // Which priority preset is active
  activeLensLabel: 'Balanced Decision', // User-friendly lens name
  activePillarWeights: {...},          // Effective weights for this lens
  activeScoreType: 'strategicBalance', // Score calculation type
  activeWeightedScore: 7.45,           // Final personalized score
  strategicBalance: {
    weightedScore: 7.45,
    pillars: [...]                     // 15 MCDA pillars with scores
  }
}
```

**Benefits:**
- Lens information flows through to all components
- Each city knows which lens is active and how it affects its score
- Enables side-by-side comparisons and "what-if" scenarios

### 2. New Display Components

#### PillarScoreDisplay.jsx
Reusable components for visualizing 15-pillar scores:

- **PillarScoreRow**: Single pillar with score, weight, bar chart, and contribution
- **PillarScoreGrid**: Full 15-pillar breakdown with header, footer, and sorting by weight
- **PillarWeightComparison**: Shows how weights differ across two lenses
- **PillarTierSummary**: Highlights highest/lowest priority pillars in active lens

```jsx
<PillarScoreGrid 
  pillars={city.strategicBalance.pillars}
  weights={city.activePillarWeights}
  finalScore={city.activeWeightedScore}
  title="Pillar Score Breakdown"
/>
```

#### LensAwareScoreDisplay.jsx
Components for lens and personalization context:

- **LensLabel**: Shows active lens name and description
- **LensScoreImpact**: Compares score under current lens vs. Balanced lens
- **LensAwareScoreBreakdown**: Full explanation of how score was calculated
- **PillarLensRelevance**: Shows which lenses emphasize/ignore each pillar

```jsx
<LensAwareScoreBreakdown
  city={city}
  strategicBalance={city.strategicBalance}
  currentLensKey={activeLensKey}
  currentWeights={city.activePillarWeights}
  profileType="dual_income"
/>
```

### 3. Enhanced ComparisonMatrixCard

Updated `MatrixPillarStrip` to show:

1. **Lens badge**: Visual indicator of active priority preset
2. **Pillar weighting**: Individual weights shown below each pillar's score
3. **Visual hierarchy**: Highest-priority pillars highlighted
4. **Sorted display**: Pillars ranked by weight to show prioritization

```jsx
<MatrixPillarStrip 
  pillars={row.strategicBalance.pillars}
  weights={row.activePillarWeights}      // NEW
  activeLens={row.activeLensKey}         // NEW
  lensLabel={row.activeLensLabel}        // NEW
/>
```

### 4. Personalization Architecture

#### How Lenses Work

Each priority preset (e.g., "Budget First", "Health First") defines:

```javascript
{
  label: 'Housing & Budget First',
  detail: 'Prioritize rental affordability...',
  scoreType: 'strategicPillar',
  pillarWeights: {
    rentalMarket: 0.40,        // 40% weight
    homeOwnership: 0.20,       // 20% weight
    childcareEducation: 0.15,  // 15% weight
    cleanBasket: 0.15,         // etc...
    economyJobsTaxes: 0.10,
  }
}
```

#### Profile-Aware Weight Adjustment

Weights adjust based on family scenario (single_income, dual_income, family_of_four):

```javascript
// dual_income adjustments
w.W4 (Rental) × 0.85         // Less constraining with 2 incomes
w.W8 (Childcare) × 1.20      // Full-time nursery is top concern
w.W13 (Economy/Jobs) × 1.15  // Support 2 career paths
// Renormalized so weights sum to 1.0
```

#### Score Calculation Flow

1. Select priority preset (e.g., "Budget First")
2. Fetch corresponding `pillarWeights`
3. Adjust weights for active scenario (dual_income, etc.)
4. Renormalize to sum = 1.0
5. Calculate: `score = Σ(pillar_score × adjusted_weight[pillar])`
6. Attach lens context and weights to city object
7. Display with lens badge and weight breakdown

### 5. CSS Styling

Two new stylesheets provide comprehensive styling:

**pillar-score-display.css:**
- `.pillar-score-row`: Individual pillar visualization
- `.pillar-score-grid`: Full pillar breakdown table
- `.pillar-weight-comparison`: Side-by-side weight comparison
- `.pillar-tier-summary`: Priority ranking display

**lens-aware-score-display.css:**
- `.lens-label`: Active lens display
- `.lens-score-impact`: Score change under different lens
- `.lens-aware-score-breakdown`: Score explanation with lens context
- `.mc-pillar-strip`: Enhanced pillar strip with lens indicators

## Integration Points

### Components Now Showing 15 Pillars

1. **ComparisonMatrixCard**: Shows lens badge, pillar weights, highlighted priorities
2. **city360Panels**: Can use `PillarScoreGrid` for full breakdown
3. **familyComparisonBoardSelectedCitySections**: Can display `LensAwareScoreBreakdown`
4. **familyComparisonBoardSections**: Can show `PillarTierSummary`

### No Changes Required To

- Scenario/profile selection logic (already working)
- Budget calculation (separate system)
- Verification audit system (independent)
- Export/CSV generation (uses pre-calculated scores)

## Usage Examples

### Display Full Pillar Breakdown with Lens Context

```jsx
import { PillarScoreGrid } from './components/PillarScoreDisplay.jsx';
import { LensAwareScoreBreakdown } from './components/LensAwareScoreDisplay.jsx';

export function CityDetailPanel({ city, activeLensKey }) {
  return (
    <>
      <LensAwareScoreBreakdown
        city={city}
        strategicBalance={city.strategicBalance}
        currentLensKey={activeLensKey}
        currentWeights={city.activePillarWeights}
        profileType="dual_income"
      />
      
      <PillarScoreGrid 
        pillars={city.strategicBalance.pillars}
        weights={city.activePillarWeights}
        finalScore={city.activeWeightedScore}
      />
    </>
  );
}
```

### Show Which Pillars Matter Most in Active Lens

```jsx
import { PillarTierSummary } from './components/PillarScoreDisplay.jsx';

export function LensPrioritiesPanel({ city }) {
  return (
    <PillarTierSummary 
      pillars={city.strategicBalance.pillars}
      weights={city.activePillarWeights}
      topCount={5}
    />
  );
}
```

### Compare Impact of Different Lenses

```jsx
import { LensScoreImpact } from './components/LensAwareScoreDisplay.jsx';

export function LensComparisonPanel({ city, currentScore, balancedScore }) {
  return (
    <LensScoreImpact
      city={city}
      currentLensKey="budgetFirst"
      currentScore={currentScore}
      balancedScore={balancedScore}
    />
  );
}
```

## Backward Compatibility

- Existing score calculations remain unchanged
- `activeWeightedScore` replaces `strategicBalance.weightedScore` where personalization matters
- Classic 5-pillar scores still available via `scores.weighted` for export/legacy features
- All existing components continue to work unchanged

## Future Enhancements

1. **Custom Lens Creation**: Allow users to define their own pillar weight presets
2. **Sensitivity Analysis**: Show how small weight changes affect rankings
3. **Interactive Weight Adjustment**: Sliders to experiment with weights
4. **Pillar Drill-Down**: Click a pillar to see sub-factors and how they calculated the score
5. **Score Explanations**: AI-generated explanations of why a city scores high/low on specific pillars
6. **Predictive Scoring**: Show how scores might change if data changes

## Testing Checklist

- [ ] Lens weights correctly attach to city objects via `buildRanking()`
- [ ] All 15 pillars display in ComparisonMatrixCard
- [ ] Pillar weights show correctly with weights highlighted
- [ ] LensAwareScoreBreakdown explains the active lens properly
- [ ] PillarWeightComparison shows differences between lenses
- [ ] Scores match manually calculated weighted sums
- [ ] Responsive design works on mobile (grid collapses)
- [ ] CSS variables use correct token names
- [ ] No console errors from new components
- [ ] Accessibility: aria labels, keyboard navigation work

## Files Modified

- `src/relocationData.js` - Enhanced buildRanking()
- `src/components/ComparisonMatrixCard.jsx` - Updated MatrixPillarStrip
- `src/main.jsx` - Added new stylesheet imports

## Files Created

- `src/components/PillarScoreDisplay.jsx` - Pillar visualization components
- `src/components/LensAwareScoreDisplay.jsx` - Lens context components
- `src/styles/pillar-score-display.css` - Pillar display styles
- `src/styles/lens-aware-score-display.css` - Lens display styles
