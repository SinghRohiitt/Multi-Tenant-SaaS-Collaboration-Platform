import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../errors/app-error.js';
import { getTenantContext } from '../tenant/tenant-context.js';
import { prisma } from '../../database/prisma.js';
import { authenticate } from '../../modules/auth/auth.middleware.js';
import { type Permission, type RoleName, isPermission, isRoleName } from './rbac.js';

export type AuthorizationContext = Readonly<{
  roles: readonly RoleName[];
  permissions: readonly Permission[];
}>;

type Requirements = { roles?: readonly RoleName[]; permissions?: readonly Permission[] };
const requirements = new WeakMap<RequestHandler, Requirements>();

declare module 'express-serve-static-core' {
  interface Request {
    authorization?: AuthorizationContext;
  }
}

/** Route decorator: declares that any listed role may access the handler. */
export const Roles =
  (...roles: RoleName[]) =>
  <T extends RequestHandler>(handler: T): T => {
    requirements.set(handler, { ...requirements.get(handler), roles });
    return handler;
  };

/** Route decorator: declares that all listed permissions are required. */
export const Permissions =
  (...permissions: Permission[]) =>
  <T extends RequestHandler>(handler: T): T => {
    requirements.set(handler, { ...requirements.get(handler), permissions });
    return handler;
  };

const loadAuthorization = async (
  request: Request,
  _response: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const tenant = getTenantContext(request);
    const assignments = await prisma.userRole.findMany({
      where: { userId: tenant.userId, role: { tenantId: tenant.tenantId } },
      select: {
        role: {
          select: {
            name: true,
            permissions: { select: { permission: { select: { code: true } } } },
          },
        },
      },
    });
    const roles = assignments.map((assignment) => assignment.role.name).filter(isRoleName);
    const permissions = [
      ...new Set(
        assignments
          .flatMap((assignment) =>
            assignment.role.permissions.map((entry) => entry.permission.code),
          )
          .filter(isPermission),
      ),
    ];
    request.authorization = { roles, permissions };
    next();
  } catch (error) {
    next(error);
  }
};

export const RolesGuard =
  (handler: RequestHandler): RequestHandler =>
  (request, _response, next) => {
    const required = requirements.get(handler)?.roles;
    if (!required?.length || request.authorization?.roles.some((role) => required.includes(role)))
      return next();
    next(new AppError(403, 'You do not have a required role'));
  };

export const PermissionsGuard =
  (handler: RequestHandler): RequestHandler =>
  (request, _response, next) => {
    const required = requirements.get(handler)?.permissions;
    if (
      !required?.length ||
      required.every((permission) => request.authorization?.permissions.includes(permission))
    )
      return next();
    next(new AppError(403, 'You do not have the required permission'));
  };

/** Applies JWT auth, tenant-bound RBAC loading, then the requirements declared on a handler. */
export const authorize = (handler: RequestHandler): RequestHandler[] => [
  authenticate,
  loadAuthorization,
  RolesGuard(handler),
  PermissionsGuard(handler),
  handler,
];
