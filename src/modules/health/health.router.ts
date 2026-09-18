import { Router } from 'express';
export const healthRouter = Router();
/**
 * @openapi
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: Returns application liveness
 *     responses:
 *       200:
 *         description: Application is running
 */
healthRouter.get('/', (_request, response) =>
  response
    .status(200)
    .json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } }),
);
