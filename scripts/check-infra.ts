import { loadConfig } from '@uptime/config';
import { createDatabase } from '@uptime/db';
import { Redis } from 'ioredis';
const config = loadConfig();
const db = createDatabase(config.DATABASE_URL);
const redis = new Redis(config.REDIS_URL, {
  lazyConnect: true,
  connectTimeout: 3000,
  maxRetriesPerRequest: 1,
  retryStrategy: () => null,
});
redis.on('error', () => {});
try {
  const results = await Promise.allSettled([
    db.$queryRaw`SELECT 1`,
    redis.connect().then(() => redis.ping()),
  ]);
  results.forEach((result, index) => {
    console.log(
      (index === 0 ? 'PostgreSQL' : 'Redis') +
        ': ' +
        (result.status === 'fulfilled'
          ? 'reachable'
          : 'FAILED (check service and configuration)'),
    );
    if (result.status === 'rejected') process.exitCode = 1;
  });
} finally {
  redis.disconnect();
  await db.$disconnect();
}
