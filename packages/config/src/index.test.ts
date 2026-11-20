import { expect, it } from 'vitest';
import { loadConfig } from './index.js';
it('rejects invalid settings without disclosing credentials', () => {
  expect(() =>
    loadConfig({
      DATABASE_URL: 'https://private-secret',
      REDIS_URL: 'redis://localhost',
      API_PORT: '0',
    }),
  ).toThrow('Invalid environment variables');
  try {
    loadConfig({ DATABASE_URL: 'private-secret' });
  } catch (error) {
    expect(String(error)).not.toContain('private-secret');
  }
});
