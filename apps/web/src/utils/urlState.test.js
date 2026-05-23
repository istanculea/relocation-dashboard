import { describe, expect, it } from 'vitest';
import {
  buildHashWithShareState,
  buildRouteHash,
  clearShareStateFromHash,
  parseHashLocation,
  readShareStateFromHash,
} from './urlState.js';

describe('urlState', () => {
  it('builds and reads share payloads from hash', () => {
    const state = {
      page: 'explorer',
      lens: 'balanced',
      scenario: 'oneParent',
      city: 'lisbon-pt',
      year: 2026,
    };
    const hash = buildHashWithShareState('explorer', state);

    expect(hash.startsWith('#/explorer?s=')).toBe(true);
    expect(readShareStateFromHash(hash)).toEqual(state);
  });

  it('parses route without share payload', () => {
    const { route, params } = parseHashLocation('#/explorer');

    expect(route).toBe('explorer');
    expect(params.get('s')).toBeNull();
    expect(readShareStateFromHash('#/explorer')).toBeNull();
  });

  it('supports map route hashing', () => {
    const hash = buildHashWithShareState('map', { page: 'map', city: 'vienna' });
    const { route } = parseHashLocation(hash);

    expect(route).toBe('map');
    expect(readShareStateFromHash(hash)).toEqual({ page: 'map', city: 'vienna' });
  });

  it('falls back unknown routes to dashboard root', () => {
    const hash = buildHashWithShareState('outlook', { page: 'outlook', shock: 'heatwave' });

    expect(parseHashLocation(hash).route).toBe('');
    expect(readShareStateFromHash(hash)).toEqual({ page: 'outlook', shock: 'heatwave' });
  });

  it('clears share payload while preserving route', () => {
    const hash = buildHashWithShareState('explorer', { page: 'explorer', city: 'vienna' });

    expect(clearShareStateFromHash(hash)).toBe('#/explorer');
    expect(clearShareStateFromHash('#/map')).toBe('#/map');
    expect(buildRouteHash('')).toBe('#/');
  });
});
