import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../../common/errors/app-error.js';
import { findActiveUser } from './auth.service.js';
import { verifyAccessToken } from './tokens.js';

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof findActiveUser>>>;

declare module 'express-serve-static-core' {
  interface Request {
    currentUser?: CurrentUser;
  }
}

export const authenticate = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const [scheme, token] = request.header('authorization')?.split(' ') ?? [];
    if (scheme !== 'Bearer' || !token) throw new AppError(401, 'Authentication is required');
    const payload = verifyAccessToken(token);
    const user = await findActiveUser(payload.sub, payload.tenantId);
    if (!user) throw new AppError(401, 'Authentication is required');
    request.currentUser = user;
    next();
  } catch (error) {
    next(error instanceof AppError ? error : new AppError(401, 'Invalid or expired access token'));
  }
};

export const getCurrentUser = (request: Request): CurrentUser => {
  if (!request.currentUser) throw new AppError(401, 'Authentication is required');
  return request.currentUser;
};
