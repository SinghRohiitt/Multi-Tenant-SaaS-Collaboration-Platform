import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config/index.js';
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
export const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Collaboration Platform API',
      version: '1.0.0',
      description: 'API documentation for the multi-tenant collaboration platform.',
    },
    servers: [{ url: config.apiPrefix }],
  },
  apis: [path.resolve(currentDirectory, '../modules/**/*.router.{ts,js}')],
});
