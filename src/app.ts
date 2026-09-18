import cors from 'cors';
import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { errorHandler, notFoundHandler } from './common/middleware/error-handler.js';
import { config } from './config/index.js';
import { swaggerSpec } from './docs/swagger.js';
import { healthRouter } from './modules/health/health.router.js';
export const app = express();
app.disable('x-powered-by');
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes('*') || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS origin is not allowed'));
    },
    credentials: !config.corsOrigins.includes('*'),
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.use(`${config.apiPrefix}/health`, healthRouter);
app.use(notFoundHandler);
app.use(errorHandler);
