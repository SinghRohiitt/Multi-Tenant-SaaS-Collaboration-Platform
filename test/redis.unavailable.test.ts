import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('ioredis', () => ({
  Redis: class {
    on() {
      return this;
    }

    async get() {
      throw new Error('Redis unavailable');
    }

    async set() {
      throw new Error('Redis unavailable');
    }

    async del() {
      throw new Error('Redis unavailable');
    }

    async scan() {
      throw new Error('Redis unavailable');
    }

    status = 'ready';

    async quit() {}
  },
}));

process.env.REDIS_ENABLED = 'true';
process.env.REDIS_URL = 'redis://localhost:6379';
const { cache } = await import('../src/cache/redis-cache.js');

describe('Redis unavailable fallback', () => {
  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('keeps cache operations best-effort when Redis is unavailable', async () => {
    await expect(cache.get('tenant:tenant-a:projects:user-a:key')).resolves.toBeNull();
    await expect(cache.set('tenant:tenant-a:projects:user-a:key', { data: [] })).resolves.toBeUndefined();
    await expect(cache.delete('tenant:tenant-a:projects:user-a:key')).resolves.toBeUndefined();
    await expect(cache.invalidateTenant('tenant-a', 'projects')).resolves.toBeUndefined();
  });
});