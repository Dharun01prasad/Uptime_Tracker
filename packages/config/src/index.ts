import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
// Same repository .env from src/ or dist/, independent of working directory.
config({
  path: fileURLToPath(new URL('../../../.env', import.meta.url)),
  quiet: true,
});
const schema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  DATABASE_URL: z
    .url()
    .refine((v) => ['postgres:', 'postgresql:'].includes(new URL(v).protocol)),
  REDIS_URL: z
    .url()
    .refine((v) => ['redis:', 'rediss:'].includes(new URL(v).protocol)),
});
export function loadConfig(input: NodeJS.ProcessEnv = process.env) {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new Error(
      'Invalid environment variables: ' +
        result.error.issues.map((i) => i.path.join('.')).join(', '),
    );
  return result.data;
}
