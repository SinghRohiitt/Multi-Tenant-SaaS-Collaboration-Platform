import { describe, expect, it } from 'vitest';

import { comparePassword, hashPassword } from '../src/modules/auth/password.js';

describe('password utilities', () => {
  it('hashes a password and verifies the original value', async () => {
    const passwordHash = await hashPassword('a-long-unique-password');

    expect(passwordHash).not.toBe('a-long-unique-password');
    await expect(comparePassword('a-long-unique-password', passwordHash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const passwordHash = await hashPassword('a-long-unique-password');

    await expect(comparePassword('not-the-original-password', passwordHash)).resolves.toBe(false);
  });
});
