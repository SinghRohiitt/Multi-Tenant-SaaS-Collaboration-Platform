import 'dotenv/config';
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().max(65535).default(3000),
  API_PREFIX: z.string().startsWith('/').default('/api/v1'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL connection URL'),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z
    .string()
    .regex(/^\d+[smhd]$/, 'JWT_ACCESS_EXPIRES_IN must look like 15m or 1h')
    .default('15m'),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().max(90).default(7),
  REDIS_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  REDIS_DEFAULT_TTL_SECONDS: z.coerce.number().int().positive().max(86_400).default(60),
  KAFKA_ENABLED: z.enum(['true', 'false']).default('false').transform((value) => value === 'true'),
  KAFKA_BROKERS: z.string().default('localhost:9092'),
  KAFKA_CLIENT_ID: z.string().min(1).default('collaboration-platform-api'),
  KAFKA_GROUP_ID: z.string().min(1).default('collaboration-platform-cache'),
  KAFKA_TOPIC: z.string().min(1).default('collaboration.domain-events'),
});
const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}
export const env = parsed.data;
