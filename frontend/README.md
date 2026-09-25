# Multi-Tenant SaaS Collaboration Platform — Frontend

## Overview

This `frontend` package is the React frontend for a Multi-Tenant SaaS Collaboration Platform. It provides a responsive single-page interface for authentication, workspace dashboards, projects, project members, and tasks, and communicates with the existing backend API.

## Features

The implemented frontend includes:

- **Authentication:** Login and registration forms, authenticated session state, access-token refresh, protected routes, and logout.
- **Dashboard:** Client-side workspace metrics, project/task activity, and Recharts visualizations for task status and priority.
- **Projects:** Project list and detail views, search, status filtering, pagination, and management actions for creating, editing, and archiving projects.
- **Project members:** Member listing, pagination, and management actions for adding or removing members.
- **Tasks:** Cross-project and project-scoped task views, task details, assignment, create/edit/archive actions, search, filters, and pagination.
- **RBAC-based UI:** `ADMIN` and `MANAGER` roles receive workspace management controls; `MEMBER` users do not see those controls. This is UI gating only, not a replacement for API authorization.
- **Search, filtering, and pagination:** Debounced project/task search, project/task filters, URL-synchronized task filters, and reusable pagination.
- **Responsive design:** Tailwind CSS breakpoints, a mobile navigation drawer, a collapsible desktop sidebar, responsive grids/forms, and scrollable tables.
- **API integration:** Shared Axios clients and domain services for authentication, projects, tasks, and project members.
- **UI states:** Route/page loading indicators, skeleton loaders, normalized error states with retry actions, empty states, validation errors, notifications, and an application error boundary.
- **Form validation:** React Hook Form forms validated with Zod for authentication and project, task, and member actions.

## Tech Stack

The frontend uses the following installed technologies:

| Area                         | Technology                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| UI                           | React, React DOM                                                                                 |
| Language                     | TypeScript                                                                                       |
| Build and development server | Vite, `@vitejs/plugin-react`                                                                     |
| Styling                      | Tailwind CSS, `@tailwindcss/vite`                                                                |
| Global state                 | Redux Toolkit, React Redux                                                                       |
| Routing                      | React Router DOM                                                                                 |
| HTTP communication           | Axios                                                                                            |
| Forms and validation         | React Hook Form, `@hookform/resolvers`, Zod                                                      |
| Charts                       | Recharts                                                                                         |
| Icons                        | Lucide React                                                                                     |
| Unit/component tests         | Vitest, React Testing Library, `@testing-library/jest-dom`, `@testing-library/user-event`, jsdom |
| Coverage                     | `@vitest/coverage-v8`                                                                            |
| Code quality                 | ESLint, typescript-eslint, Prettier                                                              |

The frontend Docker build and GitHub Actions workflow use Node.js 22.

## Frontend Project Structure

```text
frontend/
├── src/
│   ├── app/                 # Application shell and providers
│   ├── assets/              # Static assets
│   ├── components/
│   │   ├── common/          # Error boundary, route loader, notifications
│   │   └── ui/              # Reusable UI primitives
│   ├── features/
│   │   ├── auth/            # Auth state, schemas, selectors, and types
│   │   ├── dashboard/       # Dashboard aggregation, utilities, and charts
│   │   ├── members/         # Project member API hook, table, form, and schema
│   │   ├── projects/        # Project API hook, table, form, and schema
│   │   └── tasks/           # Task API hook, table, form, and schema
│   ├── hooks/               # Shared notification and debounce hooks
│   ├── layouts/             # Authentication and dashboard layouts
│   ├── lib/                 # Empty in the current working tree
│   ├── pages/               # Route-level pages grouped by domain
│   ├── routes/              # Route tree and protected-route guard
│   ├── services/            # Axios client, API services, and error normalization
│   ├── store/
│   │   ├── slices/          # Redux slices
│   │   ├── hooks.ts         # Typed Redux hooks
│   │   └── index.ts         # Store configuration
│   ├── styles/              # Global Tailwind styles
│   ├── test/                # Vitest setup and render helpers
│   ├── types/               # Shared API types
│   ├── utils/               # Shared utilities
│   ├── env.d.ts             # Typed frontend environment variable
│   ├── main.tsx             # React entry point
│   └── vite-env.d.ts        # Vite type declarations
├── .dockerignore            # Docker build exclusions
├── .env.example             # Frontend environment variable example
├── .prettierignore          # Prettier exclusions
├── Dockerfile               # Multi-stage frontend image
├── eslint.config.mjs        # ESLint configuration
├── index.html               # Vite HTML entry
├── nginx.conf               # Production static server and SPA fallback
├── package.json             # Frontend dependencies and scripts
├── package-lock.json        # Locked frontend dependencies
├── tsconfig.json            # TypeScript project references
├── tsconfig.app.json        # Application TypeScript configuration
├── tsconfig.node.json       # Build-tool TypeScript configuration
├── vite.config.ts           # Vite, Tailwind, alias, port, and chunk config
├── vitest.config.ts         # Vitest environment and coverage config
└── README.md
```

Generated `dist/` and `coverage/` directories are omitted from the source tree above.

Important areas:

- `src/app/` wires React providers, authentication bootstrap, routing, and global notifications.
- `src/components/` contains reusable presentation and common application components.
- `src/features/` contains domain-specific state, API hooks, validation, tables, forms, and dashboard logic.
- `src/pages/` contains the route-level screens.
- `src/routes/` defines public and protected route composition.
- `src/services/` owns HTTP configuration and backend communication.
- `src/store/` owns global authentication and notification state.

## Architecture

```text
React
  ↓
Pages / Features
  ↓
Redux Toolkit
  ↓
API Services / Axios
  ↓
Existing Backend API
```

Pages render feature components and use feature hooks to coordinate requests and local loading, error, pagination, and mutation state. Redux Toolkit holds the shared authentication and notification state. API calls are centralized in Axios clients and domain service modules before being sent to the existing backend API.

## Authentication

### Login and registration

- Login collects an organization ID, email address, and password.
- Registration also collects a display name.
- React Hook Form and Zod validate both forms before submission.
- Successful login or registration applies the returned user and token session to the auth and Axios state, then navigates to `/dashboard`.

### Authentication state

The Redux auth slice tracks:

- The current user
- Authentication status: `restoring`, `unauthenticated`, or `authenticated`
- Request loading and error state
- The current refresh token

On application startup, `restoreAuth()` checks Redux for a refresh token. If one is present, the frontend refreshes the session and reloads the current user before protected routes render. A failed restoration clears the session and shows a warning notification.

### Token and cookie handling

- The access token is held in a module-scoped variable and sent as a bearer token by the Axios request interceptor.
- The refresh token is held in Redux.
- Tokens are treated as opaque strings; the frontend does not decode JWT claims.
- Axios uses `withCredentials: false`.
- The frontend does not store tokens in cookies, `localStorage`, `sessionStorage`, or IndexedDB.
- Because the current token state is not persisted, authentication does not survive a full page reload.

For a non-authentication request that receives `401`, the Axios client uses the refresh token to obtain a new session and retries the original request once. Concurrent requests share one refresh operation. If refresh fails, the local session is cleared and an expiration notification is shown.

### Protected routes and logout

Unauthenticated access to a protected route redirects to `/login`; the attempted location is retained in navigation state. The current login flow always navigates to the dashboard after success.

Logout sends the refresh token to the authentication service when available. The local session is cleared whether or not that request succeeds, and the user is returned to `/login`.

## State Management

### Redux Toolkit

The store is configured in `src/store/index.ts` with two global slices:

- `auth`: current user, authentication status, loading/error state, and refresh token
- `notifications`: success, error, warning, and informational notifications

Typed `useAppDispatch` and `useAppSelector` hooks are provided by `src/store/hooks.ts`. The Axios refresh callbacks are connected to the same store so refreshed tokens and expired sessions remain synchronized.

### Local component and feature state

Feature hooks and pages use React state and effects for data that does not need to be global, including:

- Search, filters, and pagination
- Loading, error, retry, and mutation state
- Create/edit dialogs
- Archive/remove confirmations
- Responsive sidebar state

The frontend does not use a separate server-state cache or Redux persistence middleware.

## Routing

React Router's `BrowserRouter` is configured in `src/app/App.tsx`. The main feature pages are lazy-loaded and displayed behind a shared `Suspense` fallback; the not-found and unauthorized pages are imported directly.

### Public routes

| Path                  | Page         |
| --------------------- | ------------ |
| `/login`              | Login        |
| `/register`           | Registration |
| `/unauthorized`       | Unauthorized |
| Other unmatched paths | Not found    |

### Protected routes

| Path                           | Page                      |
| ------------------------------ | ------------------------- |
| `/`                            | Redirects to `/dashboard` |
| `/dashboard`                   | Dashboard                 |
| `/projects`                    | Projects                  |
| `/projects/:projectId`         | Project details           |
| `/projects/:projectId/members` | Project members           |
| `/tasks`                       | Tasks                     |
| `/tasks/:taskId`               | Task details              |

Role-specific route guards are not currently implemented. All authenticated users can navigate to the protected routes, while management controls are conditionally rendered for `ADMIN` and `MANAGER` roles. The `/unauthorized` page exists but is not selected by a frontend role guard.

## API Integration

- Axios is configured in `src/services/api.ts` with `VITE_API_BASE_URL` as its base URL.
- Requests default to `Content-Type: application/json`; the clients do not set an explicit `Accept` header.
- Bearer authentication is attached when an access token is available.
- Authentication requests are isolated from automatic `401` refresh handling.
- Domain modules under `src/services/` encapsulate authentication, project, task, and member communication.
- Dashboard data is assembled by the dashboard feature from the frontend project, task, and member services; metrics are calculated in the browser.
- Axios failures are normalized by `src/services/api-error.ts` into safe messages for validation, authentication, authorization, missing resources, conflicts, rate limits, server failures, network failures, and unrecognized errors.
- Internal server error details and stack traces are not displayed by the frontend.
- Direct local development uses a cross-origin API URL, so the existing API must allow the Vite development origin `http://localhost:5173`.

## Environment Variables

The frontend defines one custom environment variable:

| Variable            | Required | Purpose                            |
| ------------------- | -------- | ---------------------------------- |
| `VITE_API_BASE_URL` | Yes      | Base URL used by the Axios clients |

Create `.env.local` in this `frontend` directory. Safe examples are:

```dotenv
# Direct local API access
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

```dotenv
# Same-origin API access through Nginx or another reverse proxy
VITE_API_BASE_URL=/api/v1
```

Use the relative value only where a same-origin proxy is available. The Vite development server does not define an API proxy, so local `npm run dev` should use a reachable absolute API URL. No other custom frontend environment variables are referenced. Vite environment values are embedded in the browser bundle at build time, so this variable must not contain secrets.

## Installation

From the repository root:

```bash
cd frontend
npm install
```

Then create `.env.local` with the appropriate `VITE_API_BASE_URL` value before starting or building the frontend.

## Running the Frontend

### Development

```bash
npm run dev
```

Vite is configured to use port `5173`, so the default local URL is `http://localhost:5173`.

### Production build

```bash
npm run build
```

The build command runs the TypeScript project build and creates the Vite production bundle in `dist/`.

### Production preview/start

There is no `preview` or `start` script in `frontend/package.json`. Production serving is implemented through the frontend Docker image and Nginx.

## Testing

Run the Vitest suite once:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

Generate V8 coverage reports:

```bash
npm run test:coverage
```

Tests use jsdom, the setup in `src/test/setup.ts`, and test render helpers from `src/test/utils.tsx`. Coverage is reported as text, JSON, and HTML.

## Linting / Type Checking

Run ESLint:

```bash
npm run lint
```

Apply ESLint fixes:

```bash
npm run lint:fix
```

Run the TypeScript project check without emitting application code:

```bash
npm run typecheck
```

Check or apply Prettier formatting:

```bash
npm run format:check
npm run format
```

## Docker

The frontend has a multi-stage `Dockerfile`:

1. Node.js 22 Alpine installs locked dependencies with `npm ci` and runs the production build.
2. Nginx 1.27 Alpine serves the generated `dist/` files on port 80 and includes a root-page health check.

Build the image from the `frontend` directory:

```bash
docker build --build-arg VITE_API_BASE_URL=/api/v1 -t collaboration-platform-frontend .
```

Run it with:

```bash
docker run --rm -p 8080:80 collaboration-platform-frontend
```

`nginx.conf` provides:

- SPA fallback to `/index.html`, allowing direct browser navigation to client-side routes
- Long-lived immutable caching for `/assets/`
- `Cache-Control: no-cache` for the remaining `location /` responses
- A `/api/` proxy to the Docker hostname `backend` on port `3000`
- Gzip compression and disabled server-token output

API requests from the container require a deployment environment where the hostname `backend` resolves to the API service. No frontend service is defined in the repository's Docker Compose setup, and that setup currently names the API service `app`; align the hostname or Nginx upstream before using the frontend image with it.

## CI/CD

The repository-level workflow at `.github/workflows/ci.yml` runs for pushes to `main` and for pull requests. It has one frontend job that:

1. Uses Node.js 22, npm caching keyed to `frontend/package-lock.json`, and the `frontend` working directory.
2. Installs dependencies with `npm ci`.
3. Runs `npm run lint`.
4. Runs `npm run typecheck`.
5. Runs `npm test`.
6. Runs `npm run build`.

The workflow cancels an in-progress run for the same ref.

Successful pushes to `main` also upload `frontend/dist` as the `frontend-dist` artifact with seven-day retention. No automated deployment, container publishing, or production host deployment is configured.

## Backend Integration

The frontend package connects to the existing backend API through `VITE_API_BASE_URL`. Axios sends JSON requests, adds the access token as a bearer token, and handles one-time access-token refresh and retry after a `401` response. Backend routes and authorization remain the responsibility of the API.

## Development Workflow

1. Install frontend dependencies with `npm install`.
2. Configure `VITE_API_BASE_URL` in `.env.local`.
3. Start the frontend with `npm run dev`.
4. Start the backend API separately and make sure the configured API URL is reachable.
5. Develop the UI and run lint, type checks, and tests as needed.
6. Create a production bundle with `npm run build`.

## Troubleshooting

- **API requests fail during local development:** Use an absolute `VITE_API_BASE_URL`, confirm the API is running, ensure it permits the `http://localhost:5173` origin, and restart Vite after changing the environment file.
- **Relative API requests fail under `npm run dev`:** Vite has no development API proxy; use the direct API URL for local development.
- **The session ends after a page reload:** The current implementation keeps tokens only in memory/Redux and has no persistent token or cookie storage.
- **A management control is missing:** The current user must have the `ADMIN` or `MANAGER` role for the frontend to display workspace management actions.
- **Container API requests fail:** Ensure the deployment provides a Docker hostname named `backend` on port `3000`, or update the frontend Nginx upstream. The repository's current Docker Compose API service is named `app`, not `backend`.
- **A production route returns `404` after refresh:** Serve the app with the included Nginx SPA fallback or configure the production host with equivalent `index.html` fallback behavior.
- **A built frontend still uses an old API URL:** `VITE_*` values are compiled during the build; rebuild after changing them.

## Future Improvements

The following are **not currently implemented**:

- Persistent, secure authentication across full page reloads
- Role-specific route guards and role-driven `/unauthorized` redirects
- Automated frontend deployment or image publishing
- Browser-level end-to-end testing
- A shared server-state cache with background refresh and request deduplication
