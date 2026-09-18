# Multi-Tenant SaaS Collaboration Platform

Express + TypeScript API foundation using PostgreSQL and Prisma.

## Setup

Prerequisites: Node.js 20+ and PostgreSQL 14+.

1. Install packages: `npm install`
2. Create local configuration: `Copy-Item .env.example .env` (PowerShell)
3. Replace the placeholder database credentials in `.env` and create that database.
4. Create and apply the initial schema: `npm run prisma:migrate:dev -- --name init`
5. Start development: `npm run dev`

The liveness endpoint is `GET /api/v1/health`; Swagger UI is at `http://localhost:3000/docs`.

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
