import { Prisma, UserStatus } from '@prisma/client';

import { AppError } from '../../common/errors/app-error.js';
import { assignRole } from '../../common/authorization/rbac.service.js';
import { RoleName } from '../../common/authorization/rbac.js';
import { prisma } from '../../database/prisma.js';
import { comparePassword, hashPassword } from './password.js';
import {
  createRefreshToken,
  hashRefreshToken,
  refreshTokenExpiry,
  signAccessToken,
} from './tokens.js';
import type { LoginInput, RegisterInput } from './auth.schemas.js';

const publicUser = {
  id: true,
  tenantId: true,
  email: true,
  displayName: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

type TokenUser = { id: string; tenantId: string };

const createSession = async (user: TokenUser) => {
  const refreshToken = createRefreshToken();
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt: refreshTokenExpiry(),
    },
  });
  return { accessToken: signAccessToken(user), refreshToken };
};

export const register = async (input: RegisterInput) => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { id: true },
  });
  if (!tenant) throw new AppError(404, 'Organization not found');

  const passwordHash = await hashPassword(input.password);
  try {
    const user = await prisma.user.create({
      data: {
        tenantId: input.tenantId,
        email: input.email.toLowerCase(),
        displayName: input.displayName,
        passwordHash,
        status: UserStatus.ACTIVE,
      },
      select: publicUser,
    });
    await assignRole(user.id, user.tenantId, RoleName.MEMBER);
    return { user, ...(await createSession(user)) };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new AppError(409, 'An account with that email already exists in this organization');
    }
    throw error;
  }
};

export const login = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: input.tenantId, email: input.email.toLowerCase() } },
  });
  if (
    !user?.passwordHash ||
    user.status !== UserStatus.ACTIVE ||
    !(await comparePassword(input.password, user.passwordHash))
  ) {
    throw new AppError(401, 'Invalid email or password');
  }
  const safeUser = {
    id: user.id,
    tenantId: user.tenantId,
    email: user.email,
    displayName: user.displayName,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  return { user: safeUser, ...(await createSession(user)) };
};

export const refresh = async (refreshToken: string) => {
  const tokenHash = hashRefreshToken(refreshToken);
  const session = await prisma.refreshToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, tenantId: true, status: true } } },
  });
  if (
    !session ||
    session.revokedAt ||
    session.expiresAt <= new Date() ||
    session.user.status !== UserStatus.ACTIVE
  ) {
    throw new AppError(401, 'Invalid or expired refresh token');
  }
  const revoked = await prisma.refreshToken.updateMany({
    where: { id: session.id, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (revoked.count !== 1) throw new AppError(401, 'Invalid or expired refresh token');
  return createSession(session.user);
};

export const logout = async (refreshToken: string): Promise<void> => {
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashRefreshToken(refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const findActiveUser = (id: string, tenantId: string) =>
  prisma.user.findFirst({ where: { id, tenantId, status: UserStatus.ACTIVE }, select: publicUser });
