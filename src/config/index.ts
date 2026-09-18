import { env } from './env.js';
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  logLevel: env.LOG_LEVEL,
  corsOrigins: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
  auth: {
    accessSecret: env.JWT_ACCESS_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresInDays: env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
  },
} as const;
