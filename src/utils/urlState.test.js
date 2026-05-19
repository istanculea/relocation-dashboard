import { describe, expect, it } from 'vitest';
import { buildHashWithShareState, parseHashLocation, readShareStateFromHash } from './urlState.js';

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
});
