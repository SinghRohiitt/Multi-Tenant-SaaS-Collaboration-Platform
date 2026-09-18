export { startDomainEventConsumer } from './consumer.js';
export { closeKafkaProducer, publishDomainEvent } from './producer.js';
export { createDomainEvent } from './contracts.js';
export type { DomainEvent, DomainEventType } from './contracts.js';