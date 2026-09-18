import type { Request } from 'express';

import { AppError } from '../errors/app-error.js';

export type TenantContext = Readonly<{
  tenantId: string;
  userId: string;
}>;

export const createTenantContext = (identity: { id: string; tenantId: string }): TenantContext => ({
  tenantId: identity.tenantId,
  userId: identity.id,
});

declare module 'express-serve-static-core' {
  interface Request {
    tenantContext?: TenantContext;
  }
}

export const getTenantContext = (request: Request): TenantContext => {
  if (!request.tenantContext) throw new AppError(401, 'Authentication is required');
  return request.tenantContext;
};
