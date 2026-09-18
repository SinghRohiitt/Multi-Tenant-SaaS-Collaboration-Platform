import { env } from './env.js';
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  logLevel: env.LOG_LEVEL,
  corsOrigins: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
} as const;
