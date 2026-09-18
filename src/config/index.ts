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
  redis: {
    enabled: env.REDIS_ENABLED,
    url: env.REDIS_URL,
    defaultTtlSeconds: env.REDIS_DEFAULT_TTL_SECONDS,
  },
  kafka: {
    enabled: env.KAFKA_ENABLED,
    brokers: env.KAFKA_BROKERS.split(',').map((broker) => broker.trim()),
    clientId: env.KAFKA_CLIENT_ID,
    groupId: env.KAFKA_GROUP_ID,
    topic: env.KAFKA_TOPIC,
  },
} as const;
