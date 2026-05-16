import { describe, expect, it } from 'vitest';
import { buildCsvDocument, buildXlsDocument } from './exportHelpers.js';

describe('exportHelpers', () => {
  it('escapes CSV values that contain commas or quotes', () => {
    const csv = buildCsvDocument([
      {
        city: 'Rome, Italy',
        note: 'He said "hello"',
      },
    ]);

    expect(csv).toContain('"Rome, Italy"');
    expect(csv).toContain('"He said ""hello"""');
  });

  it('builds an Excel-friendly document with escaped cell content', () => {
    const xls = buildXlsDocument([
      {
        activeWeightedScore: 7.42,
        auditOverall: 'verified',
        childcare: { nurseryNet: 'EUR 420' },
        city: 'A < B',
        city360: {
          fittingIn: 'C & D',
          honestTruth: { bad: [], good: [] },
          moveHereIf: 'Low pollution',
          personality: 'Measured',
          stayAwayIf: 'Need a car',
        },
        country: 'Testland',
        health: { privateCover: 'EUR 90' },
        housing: { buyCentre: '3500', rentSafe2Bed: '1400' },
        lastReviewed: '2026-02-01',
        mobility: { carNeed: 'Low', parkScore: 7, pass: 'EUR 40', pm25: 12 },
        scenarioBudget: 3200,
        strategicBalance: { pillars: [] },
        support: { safety: 'Index 72.4' },
        verifiedCount: 3,
      },
    ], {
      lensLabel: 'Balanced Decision',
      scenarioLabel: 'One Income, 1 Child',
      selectedYear: 2026,
    });

    expect(xls).toContain('<table');
    expect(xls).toContain('A &lt; B');
    expect(xls).toContain('C &amp; D');
    expect(xls).toContain('Balanced Decision');
    expect(xls).toContain('One Income, 1 Child');
  });
});