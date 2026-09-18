# Multi-Tenant SaaS Collaboration Platform

Express + TypeScript API foundation using PostgreSQL and Prisma.

## Setup

Prerequisites: Node.js 20+, PostgreSQL 14+, and Docker Desktop for the optional Redis cache.

1. Install packages: `npm install`
2. Create local configuration: `Copy-Item .env.example .env` (PowerShell)
3. Replace the placeholder database credentials in `.env` and create that database.
4. Create and apply the initial schema: `npm run prisma:migrate:dev -- --name init`
5. Start development: `npm run dev`

To enable caching locally, start Redis with `docker compose up -d redis`, set
`REDIS_ENABLED=true` in `.env`, and keep `REDIS_URL=redis://localhost:6379`.
Redis is optional; the API continues to use PostgreSQL if it is disabled or unavailable.

To enable domain events, start Kafka with `docker compose up -d kafka`, set
`KAFKA_ENABLED=true`, and keep `KAFKA_BROKERS=localhost:9092`. The API publishes typed
user, project, and task events. A separate consumer subscribes to the configured topic
and invalidates tenant cache entries after relevant events; duplicate deliveries are safe
because cache invalidation is idempotent.

The liveness endpoint is `GET /api/v1/health`; Swagger UI is at `http://localhost:3000/docs`.

Projects are available under `/api/v1/projects`. Project memberships are managed under
`/api/v1/projects/:projectId/members` and require a tenant-scoped access token.
Tasks are available under `/api/v1/projects/:projectId/tasks`; individual task updates,
assignment, and archiving use `/api/v1/tasks/:id`.

## Useful commands

- `npm run build` / `npm start` — compile and run production output
- `npm run typecheck` — validate TypeScript without output
- `npm run lint` / `npm run lint:fix` — check or fix lint issues
- `npm run format` / `npm run format:check` — format or check files
- `npm run prisma:generate` — regenerate Prisma Client
- `npm run prisma:migrate:dev` — create and apply development migrations
- `npm run prisma:migrate:deploy` — apply committed migrations
- `npm run prisma:studio` — browse the database locally

## Layout

```text
src/
  common/       shared errors and middleware
  config/       validated environment configuration
  database/     Prisma client
  docs/         OpenAPI / Swagger configuration
  modules/      feature modules (router, service, schema, etc.)
```

Never commit `.env` or real credentials. `.env.example` has safe placeholders only.
