import { describe, expect, it } from 'vitest';
import jwt from 'jsonwebtoken';

import { config } from '../src/config/index.js';
import {
  createRefreshToken,
  hashRefreshToken,
  signAccessToken,
  verifyAccessToken,
} from '../src/modules/auth/tokens.js';

describe('token utilities', () => {
  it('signs and verifies an access token with the expected identity claims', () => {
    const token = signAccessToken({ id: 'user_123', tenantId: 'tenant_123' });

    expect(verifyAccessToken(token)).toMatchObject({ sub: 'user_123', tenantId: 'tenant_123' });
  });

  it('creates opaque refresh tokens and stores only a deterministic hash', () => {
    const token = createRefreshToken();

    expect(token).toHaveLength(64);
    expect(hashRefreshToken(token)).toHaveLength(64);
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).not.toBe(token);
  });

  it('rejects an invalid JWT', () => {
    expect(() => verifyAccessToken('not-a-jwt')).toThrow();
  });

  it('rejects an expired JWT', () => {
    const token = jwt.sign({ tenantId: 'tenant_123' }, config.auth.accessSecret, {
      subject: 'user_123',
      expiresIn: -1,
    });

    expect(() => verifyAccessToken(token)).toThrow(/expired/i);
  });
});
