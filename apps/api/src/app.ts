import express from 'express';
export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  // Liveness only; infra:check verifies dependencies separately.
  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'api' });
  });
  app.use((_request, response) => {
    response
      .status(404)
      .json({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
  return app;
}
