import { app } from './app.js';
import { config } from './config/index.js';
import { prisma } from './database/prisma.js';
const server = app.listen(config.port, () => {
  console.info(`API listening on http://localhost:${config.port}${config.apiPrefix}`);
  console.info(`Swagger UI available at http://localhost:${config.port}/docs`);
});
const shutdown = (signal: string): void => {
  console.info(`${signal} received; shutting down gracefully`);
  server.close(() => {
    prisma
      .$disconnect()
      .catch((error: unknown) => console.error('Prisma disconnect failed', error))
      .finally(() => process.exit(0));
  });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
