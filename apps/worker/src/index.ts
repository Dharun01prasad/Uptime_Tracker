import { loadConfig } from '@uptime/config';
import { createDatabase } from '@uptime/db';
import { Redis } from 'ioredis';
import pino from 'pino';
const config = loadConfig();
const logger = pino({ level: config.LOG_LEVEL, base: { service: 'worker' } });
const db = createDatabase(config.DATABASE_URL);
const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  connectTimeout: 3000,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});
redis.on('error', () => logger.error('Redis connection error'));
let heartbeat: ReturnType<typeof setInterval> | undefined;
let closing = false;
async function shutdown() {
  if (closing) return;
  closing = true;
  if (heartbeat) clearInterval(heartbeat);
  redis.disconnect();
  await db.$disconnect();
  logger.info('Worker stopped');
}
process.on('SIGINT', () => {
  void shutdown();
});
process.on('SIGTERM', () => {
  void shutdown();
});
try {
  await db.$queryRaw`SELECT 1`;
  await redis.connect();
  await redis.ping();
  if (!closing) {
    logger.info(
      'Worker foundation ready; monitoring jobs are not implemented yet',
    );
    heartbeat = setInterval(
      () => logger.debug('Worker process heartbeat'),
      30000,
    );
  }
} catch {
  logger.error(
    'Worker startup dependency check failed; check PostgreSQL and Redis',
  );
  process.exitCode = 1;
  await shutdown();
}
