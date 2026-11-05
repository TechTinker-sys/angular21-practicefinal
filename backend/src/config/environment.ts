import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { z } from 'zod';

dotenv.config({ path: resolve(process.cwd(), '.env') });

const environmentSchema = z.object({
  DB_HOST: z.string().min(1),
  DB_PORT: z.preprocess(
    (value) => (value === '' || value === undefined ? 3306 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.preprocess(
    (value) => (value === '' || value === undefined ? 4001 : value),
    z.coerce.number().int().min(1).max(65535),
  ),
  CORS_ORIGINS: z.preprocess(
    (value) =>
      typeof value === 'string' && value.trim().length > 0
        ? value.split(',').map((origin) => origin.trim())
        : ['http://localhost:4000', 'http://localhost:4200'],
    z.array(z.string().url()),
  ),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export const environment = Object.freeze(environmentSchema.parse(process.env));
