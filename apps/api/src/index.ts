import { loadConfig } from '@uptime/config';
import pino from 'pino';
import { createApp } from './app.js';
const config = loadConfig();
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'api' } });
const server = createApp().listen(config.API_PORT, '127.0.0.1', () =>
  logger.info({ port: config.API_PORT }, 'API listening'),
);
server.on('error', (error) => {
  logger.error({ code: (error as NodeJS.ErrnoException).code }, 'API failed');
  process.exitCode = 1;
});
let closing = false;
function shutdown() {
  if (closing) return;
  closing = true;
  logger.info('Stopping API');
  const deadline = setTimeout(() => process.exit(1), 10000).unref();
  server.close(() => {
    clearTimeout(deadline);
  });
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
