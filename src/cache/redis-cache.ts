import { createHash } from 'node:crypto';
import { Redis } from 'ioredis';
import { config } from '../config/index.js';

const stableValue = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableValue(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

export const queryHash = (query: unknown): string =>
  createHash('sha256').update(stableValue(query)).digest('hex').slice(0, 24);

export const cacheKeys = {
  projects: (tenantId: string, userId: string, query: unknown) =>
    `tenant:${tenantId}:projects:${userId}:${queryHash(query)}`,
  project: (tenantId: string, userId: string, projectId: string) =>
    `tenant:${tenantId}:project:${userId}:${projectId}`,
  tasks: (tenantId: string, userId: string, projectId: string, query: unknown) =>
    `tenant:${tenantId}:tasks:${userId}:${projectId}:${queryHash(query)}`,
  task: (tenantId: string, userId: string, taskId: string) =>
    `tenant:${tenantId}:task:${userId}:${taskId}`,
  members: (tenantId: string, userId: string, projectId: string, query: unknown) =>
    `tenant:${tenantId}:members:${userId}:${projectId}:${queryHash(query)}`,
  member: (tenantId: string, userId: string, projectId: string, memberId: string) =>
    `tenant:${tenantId}:member:${userId}:${projectId}:${memberId}`,
};

class RedisCache {
  private readonly client: Redis | null;
  private unavailableWarningShown = false;

  constructor() {
    this.client = config.redis.enabled
      ? new Redis(config.redis.url, {
          lazyConnect: true,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          retryStrategy: () => null,
        })
      : null;
    this.client?.on('error', () => this.warnUnavailable());
  }

  private warnUnavailable(): void {
    if (!this.unavailableWarningShown) {
      this.unavailableWarningShown = true;
      console.warn('Redis cache is unavailable; continuing without cache');
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null;
    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch {
      this.warnUnavailable();
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds = config.redis.defaultTtlSeconds): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
      this.warnUnavailable();
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch {
      this.warnUnavailable();
    }
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    if (!this.client) return;
    try {
      let cursor = '0';
      do {
        const [nextCursor, keys] = await this.client.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          100,
        );
        cursor = nextCursor;
        if (keys.length) await this.client.del(...keys);
      } while (cursor !== '0');
    } catch {
      this.warnUnavailable();
    }
  }

  async invalidateTenant(
    tenantId: string,
    resource: 'projects' | 'tasks' | 'members',
  ): Promise<void> {
    await this.deleteByPrefix(`tenant:${tenantId}:${resource}:`);
    if (resource === 'members') await this.deleteByPrefix(`tenant:${tenantId}:member:`);
    if (resource === 'projects') await this.deleteByPrefix(`tenant:${tenantId}:project:`);
    if (resource === 'tasks') await this.deleteByPrefix(`tenant:${tenantId}:task:`);
  }

  async close(): Promise<void> {
    if (this.client && this.client.status !== 'end')
      await this.client.quit().catch(() => undefined);
  }
}

export const cache = new RedisCache();
