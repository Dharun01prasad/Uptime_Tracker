import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app.js';
describe('API foundation', () => {
  it('exposes liveness without external services', async () => {
    const response = await request(createApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 'ok', service: 'api' });
    expect(response.headers['x-powered-by']).toBeUndefined();
  });
  it('returns JSON for unknown routes', async () => {
    const response = await request(createApp()).get('/missing');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
