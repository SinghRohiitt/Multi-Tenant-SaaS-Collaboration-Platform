import { randomUUID } from 'node:crypto';

export const domainEventTypes = [
  'UserCreated',
  'ProjectCreated',
  'ProjectUpdated',
  'TaskCreated',
  'TaskUpdated',
  'TaskAssigned',
] as const;

export type DomainEventType = (typeof domainEventTypes)[number];

type EventMetadata = {
  eventId: string;
  type: DomainEventType;
  version: 1;
  occurredAt: string;
  tenantId: string;
  actorId: string;
};

export type UserCreatedEvent = EventMetadata & {
  type: 'UserCreated';
  payload: { userId: string };
};

export type ProjectCreatedEvent = EventMetadata & {
  type: 'ProjectCreated';
  payload: { projectId: string; status: string };
};

export type ProjectUpdatedEvent = EventMetadata & {
  type: 'ProjectUpdated';
  payload: { projectId: string; status: string };
};

export type TaskCreatedEvent = EventMetadata & {
  type: 'TaskCreated';
  payload: { taskId: string; projectId: string; status: string; priority: string };
};

export type TaskUpdatedEvent = EventMetadata & {
  type: 'TaskUpdated';
  payload: { taskId: string; projectId: string; status: string; priority: string };
};

export type TaskAssignedEvent = EventMetadata & {
  type: 'TaskAssigned';
  payload: { taskId: string; projectId: string; assigneeId: string | null };
};

export type DomainEvent =
  | UserCreatedEvent
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | TaskCreatedEvent
  | TaskUpdatedEvent
  | TaskAssignedEvent;

export const createDomainEvent = <
  Type extends DomainEventType,
  Event extends Extract<DomainEvent, { type: Type }>,
>(
  type: Type,
  tenantId: string,
  actorId: string,
  payload: Event['payload'],
): Event =>
  ({
    eventId: randomUUID(),
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    tenantId,
    actorId,
    payload,
  }) as Event;