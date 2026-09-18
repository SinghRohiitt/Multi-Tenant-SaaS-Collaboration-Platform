import { Kafka, type Consumer } from 'kafkajs';

import { cache } from '../cache/redis-cache.js';
import { config } from '../config/index.js';
import { domainEventTypes, type DomainEvent } from './contracts.js';

const kafka = config.kafka.enabled
  ? new Kafka({ clientId: `${config.kafka.clientId}-consumer`, brokers: config.kafka.brokers })
  : null;

const isDomainEvent = (value: unknown): value is DomainEvent => {
  if (!value || typeof value !== 'object') return false;
  const event = value as Partial<DomainEvent>;
  return (
    typeof event.eventId === 'string' &&
    typeof event.tenantId === 'string' &&
    typeof event.actorId === 'string' &&
    event.version === 1 &&
    typeof event.occurredAt === 'string' &&
    typeof event.type === 'string' &&
    domainEventTypes.includes(event.type as (typeof domainEventTypes)[number]) &&
    event.payload !== null &&
    typeof event.payload === 'object'
  );
};

const invalidateCachesForEvent = async (event: DomainEvent): Promise<void> => {
  if (event.type === 'UserCreated') return;
  if (event.type === 'ProjectCreated' || event.type === 'ProjectUpdated') {
    await cache.invalidateTenant(event.tenantId, 'projects');
    return;
  }
  await cache.invalidateTenant(event.tenantId, 'tasks');
};

export const processDomainEvent = async (value: Buffer | null): Promise<void> => {
  if (!value) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value.toString());
  } catch (error) {
    console.error('Kafka event payload is not valid JSON', error);
    return;
  }
  if (!isDomainEvent(parsed)) {
    console.error('Kafka event payload has an invalid contract');
    return;
  }
  await invalidateCachesForEvent(parsed);
  console.info(`Processed ${parsed.type} event ${parsed.eventId}`);
};

export const startDomainEventConsumer = async (): Promise<() => Promise<void>> => {
  if (!kafka) return async () => undefined;
  const consumer: Consumer = kafka.consumer({ groupId: config.kafka.groupId });
  try {
    await consumer.connect();
    await consumer.subscribe({ topic: config.kafka.topic, fromBeginning: false });
    void consumer
      .run({
        eachMessage: async ({ message }) => {
          await processDomainEvent(message.value);
        },
      })
      .catch((error: unknown) => {
        console.error('Kafka consumer stopped unexpectedly', error);
      });
  } catch (error) {
    console.error('Kafka consumer startup failed', error);
    await consumer.disconnect().catch(() => undefined);
  }
  return async () => {
    await consumer.disconnect().catch((error: unknown) => {
      console.error('Kafka consumer disconnect failed', error);
    });
  };
};
