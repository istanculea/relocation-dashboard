import { describe, expect, it } from 'vitest';
import { apiV1Handlers } from './v1Handlers.js';
import { dispatchApiRequest } from './httpRouteAdapter.js';

describe('http route adapter', () => {
  it('routes subject snapshot endpoint to mapped handler', async () => {
    const response = await dispatchApiRequest({
      handlers: apiV1Handlers,
      method: 'GET',
      pathname: '/v1/subjects/city/vienna-at/snapshot',
      query: { horizon: 'h5' },
      body: {},
    });

    expect(response.statusCode).toBe(200);
    expect(response.payload.data.subject.id).toBe('vienna-at');
  });

  it('returns 404 for unmatched paths', async () => {
    const response = await dispatchApiRequest({
      handlers: apiV1Handlers,
      method: 'GET',
      pathname: '/v1/unknown',
      query: {},
      body: {},
    });

    expect(response.statusCode).toBe(404);
    expect(response.payload.errors[0].code).toBe('not_found');
  });
});
