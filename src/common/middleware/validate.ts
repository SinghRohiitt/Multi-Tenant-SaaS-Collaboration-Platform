import type { NextFunction, Request, Response } from 'express';
import type { ZodType } from 'zod';
import { AppError } from '../errors/app-error.js';
export const validate =
  <T>(schema: ZodType<T>) =>
  (request: Request, _response: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: request.body,
      params: request.params,
      query: request.query,
    });
    if (!result.success) {
      next(new AppError(400, 'Request validation failed', result.error.flatten()));
      return;
    }
    next();
  };
