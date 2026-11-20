# Foundation walkthrough

This chapter explains milestone 1. It covers the code now present; it does not imply that uptime monitoring has already been implemented.

## 1. What an npm workspace gives us

The root `package.json` declares `apps/*` and `packages/*` as workspaces. npm installs their dependencies together and links local packages such as `@uptime/db`. Apps can import the package by name rather than reaching through fragile relative paths into another application's source.

There are three executable applications: `api`, `worker`, and `web`. There are two reusable packages: `config` and `db`. The configuration package is justified because the API, worker, Vite configuration, and diagnostic script need the same settings. The database package gives the worker and future API one schema/client implementation.

`npm run <script> -w @uptime/api` runs a command only in the API workspace. Root scripts coordinate commands across workspaces. `concurrently` starts the development processes together and stops siblings when one exits, so a failed worker does not quietly leave an apparently healthy complete stack.

## 2. TypeScript, runtime JavaScript, and imports

`tsconfig.base.json` enables strict checking and additional checks for possibly missing array/object values. Server packages use NodeNext module resolution and native ECMAScript modules (`type: module`). Their imports use `.js` suffixes because compiled output executes as JavaScript in Node.

Each server/shared workspace compiles `src/` into `dist/`. The shared packages export `dist/index.js`, so we build them before the apps start. This avoids development-only import aliases that fail after compilation. Vite handles the browser's different build needs with Bundler resolution and React JSX.

`tsx watch` executes and reloads server TypeScript during development. `tsc` checks types and emits server JavaScript for production execution. Typechecking alone cannot verify network behavior or database constraints; that is why runtime checks are separate.

## 3. Environment loading and validation

`packages/config/src/index.ts` resolves the repository's `.env` relative to its own location. That works whether npm starts an app from its workspace folder or a command runs from the root. The relative depth is the same from `src/` and compiled `dist/`.

Zod checks allowed environment/log levels, the port range, and database/Redis URL schemes. Startup fails early with invalid setting names. Error messages deliberately omit values because database URLs can contain passwords. `.env.example` documents required settings; `.env` is the private local copy.

Validation proves that the configuration has a suitable shape. It does not prove that a database exists or that credentials are correct. `infra:check` handles that second question.

## 4. Why Docker Compose contains only two services

We use containers to get predictable PostgreSQL and Redis installations without installing either server directly into Windows. API/web hot reload remains straightforward on the host. Compose describes images, environment variables, port mappings, volumes, restart policies, and health checks.

`127.0.0.1:55432:5432` maps the host loopback port to the PostgreSQL container's port. Apps on the host therefore use `127.0.0.1`. When we containerize the applications later, their URLs will use Compose service names such as `postgres` and `redis`: inside a container, localhost refers to that container itself.

A container's writable layer is disposable. Named volumes keep database/Redis data across container recreation. They are storage, not backups. Health checks (`pg_isready` and Redis `PING`) let `docker compose up --wait` distinguish a started process from a service that responds.

Redis's append-only file records changes for recovery. `noeviction` prevents Redis from silently dropping queue keys to make room when memory limits are reached. Queue correctness will still require application-level duplicate handling and recovery logic later.

## 5. Prisma's three distinct jobs

The schema describes database models. The initial User model contains a UUID ID, unique email, password hash field, and creation time. There is no authentication route yet; this small model gives the foundation a real schema and migration without prematurely implementing the complete domain.

The migration is versioned SQL that creates the actual table and unique index. `db:deploy` applies committed SQL and records which migrations ran. `db:migrate` is a development command for creating the next migration after a schema edit. Never edit an already-applied migration to change production state; add a new migration.

`db:generate` generates the TypeScript database client from the schema. It does not apply database changes. The client is generated into an ignored source directory, then compiled with the database package.

Prisma 7 uses a PostgreSQL driver adapter in `packages/db/src/index.ts`, while the CLI connection URL lives in `prisma.config.ts`. The factory accepts a connection string instead of hiding configuration inside the database package. Connection/query timeouts bound the foundation's connectivity checks.

The UUID default in this schema is generated by Prisma, so raw SQL inserts must supply an ID. Later database invariants will include constraints Prisma cannot express directly, using custom SQL migrations.

## 6. Express application versus HTTP server

`apps/api/src/app.ts` creates an Express application without opening a port. This makes the routes testable in isolation. `src/index.ts` loads settings, creates the logger, and starts the HTTP listener.

`GET /health` means the API process can answer HTTP requests. It deliberately does not mean PostgreSQL, Redis, or a future scheduler is healthy. Keeping liveness separate prevents a dependency outage from being confused with a dead API process. Dependency readiness and worker health reporting will be expanded later.

Unknown routes return consistent JSON instead of an HTML error page. Pino outputs structured JSON logs that tools can filter by fields such as `service` and `port`. Signal handlers stop the server gracefully, with a deadline so shutdown cannot wait forever.

## 7. What the worker does today

The worker starts as a separate Node process, validates configuration, queries PostgreSQL with `SELECT 1`, connects to Redis, and sends `PING`. If startup checks fail it logs a safe error, closes clients, and exits unsuccessfully. If they succeed it stays alive with a debug heartbeat.

This is only a foundation. It does not continuously probe dependencies, retry indefinitely, enqueue jobs, or monitor websites. The deliberately bounded Redis startup policy is for this skeleton; BullMQ workers will need their own appropriate connection/reconnection settings when implemented.

The independent process boundary is already useful: future website checks should not depend on an API request or a browser tab remaining open. The API will handle user requests; the worker will handle scheduled background work.

## 8. What each verification step proves

| Check                    | What it establishes                                           |
| ------------------------ | ------------------------------------------------------------- |
| Prisma validate/generate | Schema is valid and client generation works                   |
| Typecheck/build          | Packages resolve and compile, including the browser bundle    |
| Lint/format              | Source follows the configured static rules                    |
| Vitest + Supertest       | Health/404 contracts and safe configuration rejection work    |
| Compose health           | Database and Redis processes answer their container checks    |
| Migration deploy         | Committed schema SQL applies to this PostgreSQL instance      |
| infra:check              | Host application clients can actually reach both dependencies |
| Live HTTP smoke check    | Compiled API listens and answers over a real local port       |

Passing these checks establishes a runnable skeleton. It does not establish authorization, SSRF protection, monitoring correctness, or email delivery; those need their own implementation and tests in later milestones.

## Suggested reading order

Read root `package.json`, `docker-compose.yml`, `packages/config/src/index.ts`, the Prisma schema/migration, `packages/db/src/index.ts`, `apps/api/src/app.ts`, API `index.ts`, worker `index.ts`, then `scripts/check-infra.ts`. Trace which code runs in each process and when each connection is opened.

## Official references used

- [Prisma 7 client generation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators)
- [Prisma database drivers and adapters](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/database-drivers)
- [Vite setup and Node requirements](https://vite.dev/guide/)
