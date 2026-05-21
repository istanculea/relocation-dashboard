import { describe, expect, it } from 'vitest';
import { scoreCompatibility, scoreFit } from './FamilyFitPage.jsx';

describe('FamilyFitPage helpers', () => {
  const focusRow = {
    familyRhythm: 8.4,
    psychologicalRhythm: 7.8,
    environmentalRhythm: 7.1,
  };

  const closeMatch = {
    familyRhythm: 8.1,
    psychologicalRhythm: 7.5,
    environmentalRhythm: 7.4,
  };

  const distantMatch = {
    familyRhythm: 4.3,
    psychologicalRhythm: 5.1,
    environmentalRhythm: 6.2,
  };

  it('scores profile fit using the active family profile weights', () => {
    expect(scoreFit(closeMatch, 'balanced')).toBe(7.71);
    expect(scoreFit(closeMatch, 'calm')).toBe(7.65);
  });

  it('prefers cities that match the anchor city rhythm more closely', () => {
    const closeScore = scoreCompatibility(focusRow, closeMatch, 'balanced');
    const distantScore = scoreCompatibility(focusRow, distantMatch, 'balanced');

    expect(closeScore).toBeGreaterThan(distantScore);
  });
});