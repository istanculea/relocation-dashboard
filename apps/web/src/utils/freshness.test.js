import { describe, expect, it } from 'vitest';
import { formatFreshnessAge, getFreshnessMeta, parseDateLike } from './freshness.js';

describe('freshness utilities', () => {
  it('parses ISO and embedded textual dates', () => {
    const isoDate = parseDateLike('2026-05-12');
    const embeddedDate = parseDateLike('Updated 20 Feb 2025 TPBI fares page');

    expect(isoDate).toBeTruthy();
    expect(embeddedDate).toBeTruthy();
  });

  it('computes fresh/aging/stale tiers', () => {
    const now = new Date('2026-05-30T12:00:00Z');

    expect(getFreshnessMeta('2026-05-20', { now }).tier).toBe('fresh');
    expect(getFreshnessMeta('2026-04-20', { now }).tier).toBe('aging');
    expect(getFreshnessMeta('2026-02-01', { now }).tier).toBe('stale');
  });

  it('formats day-age copy with singular/plural handling', () => {
    expect(formatFreshnessAge(0)).toBe('updated today');
    expect(formatFreshnessAge(1)).toBe('1 day old');
    expect(formatFreshnessAge(12)).toBe('12 days old');
  });
});
