# Milestone 1 verification

Verified locally on 21 November 2026 (Asia/Calcutta). This records the workspace/service foundation, not all day-1 deliverables.

| Command or observation                            | Result                                                                     |
| ------------------------------------------------- | -------------------------------------------------------------------------- |
| Node / npm                                        | Node 24.14.1 and npm 11.11.0 available                                     |
| `npm.cmd ci --cache .npm-cache --fetch-retries=0` | Clean lockfile installation succeeded; audit reported zero vulnerabilities |
| `docker compose up -d --wait`                     | PostgreSQL and Redis healthy                                               |
| `npm.cmd run db:validate`                         | Prisma schema valid                                                        |
| `npm.cmd run db:deploy`                           | Initial User-table migration applied successfully                          |
| `npm.cmd run infra:check`                         | PostgreSQL and Redis reachable from application clients                    |
| `npm.cmd run build`                               | Shared packages, API, worker, and Vite production build passed             |
| `npm.cmd run typecheck`                           | All five workspaces passed                                                 |
| `npm.cmd run lint`                                | Passed                                                                     |
| `npm.cmd test`                                    | Three tests passed in two files                                            |
| `npm.cmd run format:check`                        | Passed                                                                     |
| Compiled API process and HTTP `/health`           | Returned `{"status":"ok","service":"api"}`                                 |
| Compiled worker process                           | Reported successful dependency checks and foundation readiness             |
| `npm.cmd run dev`                                 | API, worker, and Vite started together successfully                        |
| Vite HTTP `/` and proxied `/health`               | Web returned HTTP 200; proxy returned API health JSON                      |

## Adjustments made during verification

- Used `npm.cmd` because PowerShell blocks the installed `npm.ps1` wrapper. System execution policy was not changed.
- Started Docker Desktop through `docker desktop start` because it was initially stopped and installed outside the usual Program Files location.
- Mapped PostgreSQL to host port 55432 because Windows rejected binding port 5432. The container still uses 5432. Both `.env.example` and local `.env` match the new mapping.
- Aligned Vite and React plugin versions, removed stale generated workspace dependencies, and verified a clean lockfile installation.
- Kept Prisma on stable major version 7. Its CLI dependency pinned a vulnerable Effect release; a scoped npm override selects patched Effect 3.22.5. Remove the override when Prisma's upstream dependency no longer needs it. Prisma generation, migration deployment, and builds worked with this override.

## Scope and limits

The web application is a placeholder; it was HTTP/build tested, not subjected to a visual browser review. The worker checks dependencies at startup and stays alive; it does not yet execute monitoring jobs. The API provides liveness, not dependency readiness. The initial User model does not implement authentication. There is no deployed endpoint, hosted CI run, or performance benchmark to report.

Next milestone: full database schema and invariants for monitors, results, incidents, notifications, and sessions.
