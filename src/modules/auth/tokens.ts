import { createHash, randomBytes } from 'node:crypto';

import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';

import { config } from '../../config/index.js';

export type AccessTokenPayload = JwtPayload & { sub: string; tenantId: string };

export const signAccessToken = (user: { id: string; tenantId: string }): string =>
  jwt.sign({ tenantId: user.tenantId }, config.auth.accessSecret, {
    subject: user.id,
    expiresIn: config.auth.accessExpiresIn as SignOptions['expiresIn'],
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  const payload = jwt.verify(token, config.auth.accessSecret);
  if (
    typeof payload === 'string' ||
    typeof payload.sub !== 'string' ||
    typeof payload.tenantId !== 'string'
  ) {
    throw new Error('Invalid access token payload');
  }
  return payload as AccessTokenPayload;
};

export const createRefreshToken = (): string => randomBytes(48).toString('base64url');

export const hashRefreshToken = (token: string): string =>
  createHash('sha256').update(token).digest('hex');

export const refreshTokenExpiry = (): Date => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + config.auth.refreshExpiresInDays);
  return expiresAt;
};
