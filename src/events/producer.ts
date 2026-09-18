import { Kafka, type Producer } from 'kafkajs';

import { config } from '../config/index.js';
import type { DomainEvent } from './contracts.js';

const kafka = config.kafka.enabled
  ? new Kafka({ clientId: config.kafka.clientId, brokers: config.kafka.brokers })
  : null;
let producerPromise: Promise<Producer> | null = null;

const getProducer = async (): Promise<Producer> => {
  if (!kafka) throw new Error('Kafka is disabled');
  if (!producerPromise) {
    const producer = kafka.producer();
    producerPromise = producer.connect().then(() => producer);
  }
  return producerPromise;
};

export const publishDomainEvent = async (event: DomainEvent): Promise<void> => {
  if (!config.kafka.enabled) return;
  try {
    const producer = await getProducer();
    await producer.send({
      topic: config.kafka.topic,
      messages: [{ key: `${event.tenantId}:${event.type}`, value: JSON.stringify(event) }],
    });
  } catch (error) {
    producerPromise = null;
    console.error(`Kafka publish failed for ${event.type}`, error);
  }
};

export const closeKafkaProducer = async (): Promise<void> => {
  if (!producerPromise) return;
  const producer = await producerPromise.catch(() => null);
  producerPromise = null;
  await producer?.disconnect().catch((error: unknown) => {
    console.error('Kafka producer disconnect failed', error);
  });
};
