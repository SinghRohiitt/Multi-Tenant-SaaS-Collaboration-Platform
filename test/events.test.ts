import { beforeEach, describe, expect, it, vi } from 'vitest';

const invalidateTenant = vi.hoisted(() => vi.fn().mockResolvedValue(undefined));

vi.mock('../src/cache/redis-cache.js', () => ({
  cache: { invalidateTenant },
}));

import { createDomainEvent } from '../src/events/contracts.js';
import { processDomainEvent } from '../src/events/consumer.js';
import { publishDomainEvent } from '../src/events/producer.js';

describe('domain events', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates typed events without sensitive authentication data', () => {
    const event = createDomainEvent('UserCreated', 'tenant-a', 'user-a', { userId: 'user-a' });

    expect(event).toMatchObject({
      type: 'UserCreated',
      version: 1,
      tenantId: 'tenant-a',
      actorId: 'user-a',
      payload: { userId: 'user-a' },
    });
    expect(event).not.toHaveProperty('password');
    expect(event).not.toHaveProperty('passwordHash');
    expect(event).not.toHaveProperty('refreshToken');
    expect(event).not.toHaveProperty('email');
  });

  it('does not require Kafka for synchronous operations when disabled', async () => {
    await expect(
      publishDomainEvent(createDomainEvent('TaskCreated', 'tenant-a', 'user-a', {
        taskId: 'task-a',
        projectId: 'project-a',
        status: 'TODO',
        priority: 'HIGH',
      })),
    ).resolves.toBeUndefined();
  });

  it('uses the consumer workflow to invalidate tenant caches safely on duplicate delivery', async () => {
    const event = createDomainEvent('ProjectUpdated', 'tenant-a', 'user-a', {
      projectId: 'project-a',
      status: 'ACTIVE',
    });
    const message = Buffer.from(JSON.stringify(event));

    await processDomainEvent(message);
    await processDomainEvent(message);

    expect(invalidateTenant).toHaveBeenCalledTimes(2);
    expect(invalidateTenant).toHaveBeenNthCalledWith(1, 'tenant-a', 'projects');
    expect(invalidateTenant).toHaveBeenNthCalledWith(2, 'tenant-a', 'projects');
  });

  it('ignores malformed or unknown event payloads without throwing', async () => {
    await expect(processDomainEvent(Buffer.from('{bad json'))).resolves.toBeUndefined();
    await expect(
      processDomainEvent(
        Buffer.from(
          JSON.stringify({
            eventId: 'event-a',
            type: 'UnknownEvent',
            tenantId: 'tenant-a',
            payload: {},
          }),
        ),
      ),
    ).resolves.toBeUndefined();
    expect(invalidateTenant).not.toHaveBeenCalled();
  });
});