# UptimeTracker

An uptime monitoring project built incrementally. Milestone 1 provides the workspace and local infrastructure. Authentication, monitor checks, BullMQ jobs, incidents, and emails are not implemented yet.

## Local development (PowerShell)

Use Node.js 24.14 or later in the Node 24 series, npm, and Docker Desktop with Linux containers. Run commands from the repository root. Use `npm.cmd` if PowerShell's execution policy blocks `npm.ps1`; no execution-policy change is necessary.

```powershell
npm.cmd ci
Copy-Item .env.example .env # First setup only; do not overwrite your existing settings.
npm.cmd run infra:up
npm.cmd run db:deploy
npm.cmd run build:packages
npm.cmd run infra:check
npm.cmd run dev
```

Web: http://127.0.0.1:5173. API: http://127.0.0.1:3000/health. The web page is a placeholder. Vite forwards `/api` and `/health` to the API during development. API and worker run on the host; only PostgreSQL and Redis run in containers at this stage.

`GET /health` returns `{"status":"ok","service":"api"}`. This is a process liveness check, not a claim that dependencies or monitoring jobs work. `npm.cmd run infra:check` independently queries PostgreSQL and pings Redis; it exits nonzero if either fails.

## Commands

| Command                                             | Purpose                                                         |
| --------------------------------------------------- | --------------------------------------------------------------- |
| `npm.cmd run dev`                                   | Generate/build shared packages, then watch API, worker, and web |
| `npm.cmd run build`                                 | Generate Prisma client and compile all packages/apps            |
| `npm.cmd run typecheck`                             | Build shared packages and check TypeScript                      |
| `npm.cmd run lint`                                  | Check JavaScript/TypeScript conventions                         |
| `npm.cmd test`                                      | Run the foundation tests                                        |
| `npm.cmd run format`                                | Format source and documentation                                 |
| `npm.cmd run format:check`                          | Check formatting without editing                                |
| `npm.cmd run db:validate`                           | Validate the Prisma schema                                      |
| `npm.cmd run db:generate`                           | Generate the typed database client                              |
| `npm.cmd run db:migrate -- --name descriptive_name` | Create/apply a development migration after schema changes       |
| `npm.cmd run db:deploy`                             | Apply committed migrations without generating new ones          |
| `npm.cmd run infra:up`                              | Start PostgreSQL/Redis and wait for their health checks         |
| `npm.cmd run infra:down`                            | Stop containers, preserving named-volume data                   |
| `npm.cmd run infra:check`                           | Verify application-level database/Redis connectivity            |

After editing shared packages, restart `npm.cmd run dev` to rebuild them. App code is watched automatically; shared package output is deliberately built explicitly for now.

## Configuration

Copy `.env.example` once. `.env` is ignored by Git; the example contains local-only credentials. Real deployment secrets must be supplied separately. Existing process environment variables take precedence over `.env` values.

| Variable                                            | Meaning                                                      |
| --------------------------------------------------- | ------------------------------------------------------------ |
| `NODE_ENV`                                          | development, test, or production                             |
| `LOG_LEVEL`                                         | Pino log verbosity                                           |
| `API_PORT`                                          | Host API port, default 3000                                  |
| `DATABASE_URL`                                      | PostgreSQL connection string for the apps and Prisma CLI     |
| `REDIS_URL`                                         | Redis connection string for the worker and diagnostic script |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Initial database container configuration                     |

Keep the database URL credentials/database consistent with the Compose variables. PostgreSQL initialization settings only apply to a fresh volume; changing the environment does not change an existing database user's password. Port mappings are bound to loopback for local use. If host ports 55432/6379 are occupied, adjust the host mapping and corresponding URL together.

Redis uses append-only persistence and `noeviction`, preparing for durable queue data. These settings do not provide backups or exactly-once job execution. Do not use `docker compose down -v` unless you intentionally want to delete local database and Redis data.

## Learning and architecture

Read [the foundation walkthrough](docs/foundation-walkthrough.md) for an explanation of the code, commands, and current architecture. Read [architecture](docs/architecture.md) for current boundaries and planned additions.

Dependencies are resolved in `package-lock.json`; use `npm ci` for repeatable installs. Generated Prisma files and build output are ignored and recreated by build commands.
