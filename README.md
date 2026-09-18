# Multi-Tenant SaaS Collaboration Platform

An Express and TypeScript backend for tenant-isolated project collaboration. The API
uses PostgreSQL and Prisma as its source of truth, JWT authentication with refresh-token
rotation, role-based authorization, optional Redis caching, and typed Kafka domain events.

## What Is Included

- Tenant-scoped users, projects, project membership, and tasks
- Admin, manager, and member roles with explicit permissions
- JWT access tokens and database-backed refresh tokens
- PostgreSQL persistence with Prisma migrations and composite tenant foreign keys
- Best-effort Redis caching for authorized read operations
- Typed Kafka events with a cache-invalidation consumer
- Docker Compose development environment for the API and dependencies

See [docs/architecture.md](docs/architecture.md) for the system diagram and design details.

## Prerequisites

- Docker Desktop with Docker Compose v2
- Node.js 20 or newer for host-based development
- PowerShell examples below can be translated to another shell

## Environment Setup

Create a local environment file from the committed template:

```powershell
Copy-Item .env.example .env
```

`.env` is ignored by Git. Replace placeholder secrets before using the API beyond local
development. The Docker Compose file requires `POSTGRES_USER`, `POSTGRES_PASSWORD`, and
`POSTGRES_DB`; the application container derives its Docker-internal PostgreSQL URL from
those values.

### Environment Variables

| Variable                        | Purpose                                            | Local default                                 |
| ------------------------------- | -------------------------------------------------- | --------------------------------------------- |
| `NODE_ENV`                      | Runtime mode                                       | `development`                                 |
| `PORT`                          | HTTP port                                          | `3000`                                        |
| `API_PREFIX`                    | API route prefix                                   | `/api/v1`                                     |
| `LOG_LEVEL`                     | Configured log level                               | `info`                                        |
| `CORS_ORIGIN`                   | Comma-separated allowed origins                    | `http://localhost:3000,http://localhost:5173` |
| `DATABASE_URL`                  | Host-side PostgreSQL connection URL                | `postgresql://...localhost...`                |
| `POSTGRES_USER`                 | PostgreSQL container user                          | `app_user`                                    |
| `POSTGRES_PASSWORD`             | PostgreSQL container password                      | placeholder only                              |
| `POSTGRES_DB`                   | PostgreSQL database name                           | `collaboration_platform`                      |
| `JWT_ACCESS_SECRET`             | Access-token signing secret, minimum 32 characters | placeholder only                              |
| `JWT_ACCESS_EXPIRES_IN`         | Access-token lifetime such as `15m`                | `15m`                                         |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS` | Refresh-token lifetime                             | `7`                                           |
| `REDIS_ENABLED`                 | Enable Redis reads and writes                      | `false` outside Compose                       |
| `REDIS_URL`                     | Redis connection URL                               | `redis://localhost:6379`                      |
| `REDIS_DEFAULT_TTL_SECONDS`     | Cache entry TTL                                    | `60`                                          |
| `KAFKA_ENABLED`                 | Enable event producer and consumer                 | `false` outside Compose                       |
| `KAFKA_BROKERS`                 | Comma-separated Kafka brokers                      | `localhost:9092`                              |
| `KAFKA_CLIENT_ID`               | Kafka client identifier                            | `collaboration-platform-api`                  |
| `KAFKA_GROUP_ID`                | Consumer group identifier                          | `collaboration-platform-cache`                |
| `KAFKA_TOPIC`                   | Domain event topic                                 | `collaboration.domain-events`                 |

## Docker Development

Start PostgreSQL, Redis, Kafka, and the API. The API waits for healthy dependencies and
runs committed Prisma migrations before starting the development server:

```powershell
docker compose up --build
```

The API is available at `http://localhost:3000`. Useful operational commands:

```powershell
docker compose logs -f app
docker compose down
docker compose down -v  # also remove the local PostgreSQL volume
```

The Compose Kafka listener is available to the host at `localhost:9092` and to the API
container at `kafka:9092`. Redis and PostgreSQL use `redis:6379` and `postgres:5432`
inside the Compose network.

## Database and Migrations

The application container runs:

```text
npm run prisma:migrate:deploy && npm run dev
```

Run committed migrations explicitly with:

```powershell
docker compose run --rm app npm run prisma:migrate:deploy
```

For schema development on the host, install dependencies and create a migration with:

```powershell
npm install
npm run prisma:migrate:dev -- --name describe_change
```

The database contains tenants, users, roles, permissions, projects, project members,
tasks, and refresh tokens. Project members and tasks use composite tenant-aware foreign
keys so IDs cannot connect records across tenants. See the [database overview](docs/architecture.md#database-overview).

## API Documentation

Swagger UI is available at `http://localhost:3000/docs`. The generated OpenAPI server
prefix is `/api/v1` by default. The health operation is currently annotated in OpenAPI;
the complete implemented route inventory is documented below.

### Authentication

| Method | Endpoint                | Purpose                                            |
| ------ | ----------------------- | -------------------------------------------------- |
| `POST` | `/api/v1/auth/register` | Register a user in an existing active tenant       |
| `POST` | `/api/v1/auth/login`    | Authenticate and receive access and refresh tokens |
| `POST` | `/api/v1/auth/refresh`  | Rotate a refresh token and issue a new session     |
| `POST` | `/api/v1/auth/logout`   | Revoke a refresh token                             |
| `GET`  | `/api/v1/auth/me`       | Return the authenticated user                      |

### Resources

| Method   | Endpoint                                      | Purpose                                              |
| -------- | --------------------------------------------- | ---------------------------------------------------- |
| `GET`    | `/api/v1/health`                              | Liveness check                                       |
| `POST`   | `/api/v1/projects`                            | Create a project and add its creator as a member     |
| `GET`    | `/api/v1/projects`                            | List authorized projects with pagination and filters |
| `GET`    | `/api/v1/projects/:id`                        | Read one authorized project                          |
| `PATCH`  | `/api/v1/projects/:id`                        | Update a project                                     |
| `DELETE` | `/api/v1/projects/:id`                        | Archive a project                                    |
| `POST`   | `/api/v1/projects/:projectId/members`         | Add a same-tenant member                             |
| `GET`    | `/api/v1/projects/:projectId/members`         | List project members                                 |
| `GET`    | `/api/v1/projects/:projectId/members/:userId` | Read a project member                                |
| `DELETE` | `/api/v1/projects/:projectId/members/:userId` | Remove a project member                              |
| `POST`   | `/api/v1/projects/:projectId/tasks`           | Create a task                                        |
| `GET`    | `/api/v1/projects/:projectId/tasks`           | List project tasks with filters                      |
| `GET`    | `/api/v1/tasks/:id`                           | Read one task                                        |
| `PATCH`  | `/api/v1/tasks/:id`                           | Update a task                                        |
| `PATCH`  | `/api/v1/tasks/:id/assignee`                  | Assign or unassign a task                            |
| `DELETE` | `/api/v1/tasks/:id`                           | Archive a task                                       |

Protected endpoints use `Authorization: Bearer <access-token>`. Request DTOs are validated
with Zod before reaching service logic.

## Testing and Quality Commands

```powershell
npm test
npm run lint
npm run typecheck
npm run build
npx prisma validate
```

The tests focus on authentication, authorization, tenant isolation, resource services,
validation failures, Redis cache behavior, and Kafka event handling.

## Repository Layout

```text
src/
  common/                 auth, RBAC, tenancy, validation, errors
  config/                 validated environment configuration
  database/               Prisma client setup
  docs/                   Swagger/OpenAPI setup
  events/                 typed Kafka contracts, producer, consumer
  cache/                  Redis client and tenant-aware cache keys
  modules/
    auth/                 registration, login, tokens, auth middleware
    projects/             project routes, schemas, service
    project-members/      membership routes, schemas, service
    tasks/                task routes, schemas, service
    health/               liveness endpoint
prisma/
  schema.prisma           data model
  migrations/             committed database migrations
test/                     business-focused unit/service tests
```

## Scope and Limitations

Kafka publishing is best-effort; this repository does not implement an outbox or durable
event retry store. The current consumer performs idempotent cache invalidation, not general
business-side-effect processing. Redis is an optimization and PostgreSQL remains the
source of truth.

Never commit `.env`, real credentials, access tokens, refresh tokens, passwords, or password
hashes.
