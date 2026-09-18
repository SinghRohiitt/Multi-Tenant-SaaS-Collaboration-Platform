import type { ErrorRequestHandler, RequestHandler } from 'express';
import { Prisma } from '@prisma/client';
import { config } from '../../config/index.js';
import { AppError } from '../errors/app-error.js';
export const notFoundHandler: RequestHandler = (request, _response, next) =>
  next(new AppError(404, `Route ${request.method} ${request.originalUrl} was not found`));
export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  let statusCode = 500;
  let message = 'Internal server error';
  let details: unknown;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = error.code === 'P2002' ? 409 : 400;
    message =
      error.code === 'P2002'
        ? 'A record with that value already exists'
        : 'Database request failed';
  }
  if (statusCode >= 500) console.error(error);
  response.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
    ...(config.env === 'development' && statusCode >= 500 && error instanceof Error
      ? { stack: error.stack }
      : {}),
  });
};
