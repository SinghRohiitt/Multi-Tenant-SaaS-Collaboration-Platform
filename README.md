# Multi-Tenant SaaS Collaboration Platform

Express + TypeScript API foundation using PostgreSQL and Prisma.

## Prerequisites

- Docker Desktop with Docker Compose v2
- Node.js 20+ for running commands directly on the host

## Environment Setup

Copy the safe template and change the local placeholder values as needed:

```powershell
Copy-Item .env.example .env
```

The Compose stack reads PostgreSQL credentials from `POSTGRES_USER`,
`POSTGRES_PASSWORD`, and `POSTGRES_DB`. Do not commit `.env` or real credentials.

## Docker Startup

Build and start PostgreSQL, Redis, Kafka, and the application:

```powershell
docker compose up --build
```

The application waits for healthy dependencies, exposes the API on
`http://localhost:3000`, and enables Redis and Kafka using their Docker service names.
Stop the stack with `docker compose down`; add `-v` when you also want to remove the
local PostgreSQL data volume.

## Database Migration

The application container runs committed migrations automatically before development
startup. To run migrations separately:

```powershell
docker compose run --rm app npm run prisma:migrate:deploy
```

For a new migration while developing locally, run the API and Prisma CLI on the host:

```powershell
npm install
npm run prisma:migrate:dev -- --name describe_change
```

## Application Startup

Docker startup is the recommended local workflow:

```powershell
docker compose up --build
```

To run only the API on the host, set `DATABASE_URL` to a reachable PostgreSQL instance,
start the optional dependencies, and run `npm run dev`.

## API Documentation

- Health: `GET http://localhost:3000/api/v1/health`
- Swagger UI: `http://localhost:3000/docs`
- Projects: `/api/v1/projects`
- Project members: `/api/v1/projects/:projectId/members`
- Tasks: `/api/v1/projects/:projectId/tasks`

The API publishes typed user, project, and task domain events to Kafka. The separate
consumer invalidates tenant cache entries for relevant events; duplicate deliveries are
safe because cache invalidation is idempotent.

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
- `docker compose logs -f app` — follow application logs
- `docker compose down` — stop local services

## Test Commands

```powershell
npm test
npm run lint
npm run typecheck
npm run build
```

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
