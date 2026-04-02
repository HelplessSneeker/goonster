---
phase: 04-database-foundation-auth-core
plan: 01
subsystem: database
tags: [postgres, drizzle-orm, better-auth, docker, fastify]

requires: []
provides:
  - PostgreSQL 16 local development database via Docker Compose
  - Drizzle ORM schema with 4 better-auth tables (user, session, account, verification)
  - better-auth server instance configured for email/password with 30-day sessions
  - Fastify catch-all /api/auth/* route handler
  - Backend auth integration test stubs (7 test cases, DATABASE_URL-gated)
  - Frontend App routing test stubs (6 todo cases)
affects:
  - 04-02: auth route registration, CORS credentials config
  - 04-03: React Router setup, frontend auth client
  - 04-04: profile API, auth middleware

tech-stack:
  added:
    - better-auth 1.5.6 (email/password auth framework with session management)
    - drizzle-orm 0.45.2 (PostgreSQL ORM)
    - drizzle-kit 0.31.10 (schema migration CLI)
    - pg 8.20.0 (PostgreSQL node driver)
    - "@types/pg 8.20.0 (TypeScript types for pg)"
  patterns:
    - better-auth Fastify catch-all route pattern using fromNodeHeaders + Request/Response bridge
    - Drizzle ORM with node-postgres driver, schema as named exports
    - drizzleAdapter linking better-auth to Drizzle db instance
    - describe.skipIf(!DATABASE_URL) for integration tests requiring a live database

key-files:
  created:
    - docker-compose.yml
    - packages/backend/.env.example
    - packages/backend/drizzle.config.ts
    - packages/backend/src/db/index.ts
    - packages/backend/src/db/schema.ts
    - packages/backend/src/auth.ts
    - packages/backend/src/routes/auth.ts
    - packages/backend/tests/auth.test.ts
    - packages/frontend/src/__tests__/App.test.tsx
  modified:
    - packages/backend/package.json (added better-auth, drizzle-orm, pg, drizzle-kit, @types/pg)
    - pnpm-lock.yaml
    - packages/frontend/vitest.config.ts (extended include to pick up src/__tests__)

key-decisions:
  - "Zod v3 intentionally retained for backend route validation — better-auth bundles its own zod v4 internally, no runtime conflict; upgrading would break existing z.coerce.number() usage in feed.ts"
  - "describe.skipIf(!DATABASE_URL) guards auth integration tests — prevents CI failures when PostgreSQL is unavailable"
  - "Frontend test file placed in src/__tests__/ per plan spec — vitest config extended to include this path (Rule 3 fix)"

patterns-established:
  - "better-auth Fastify bridge: fromNodeHeaders() + new Request() + auth.handler() + response.headers.forEach()"
  - "Drizzle ORM instance: drizzle(DATABASE_URL, { schema }) from drizzle-orm/node-postgres"
  - "better-auth tables: user, session, account, verification — all using text primary keys"

requirements-completed:
  - INFRA-01
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04

duration: 3min
completed: 2026-04-03
---

# Phase 04 Plan 01: Database Foundation & Auth Core Summary

**PostgreSQL 16 + Drizzle ORM schema (4 better-auth tables) + better-auth server instance with email/password auth + Fastify /api/auth/* catch-all route**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-02T22:14:42Z
- **Completed:** 2026-04-02T22:17:57Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments

- Docker Compose configuration for PostgreSQL 16 local development database
- Drizzle ORM schema with all 4 required better-auth tables (user, session, account, verification)
- better-auth server instance configured with email/password (8+ char min), 30-day sessions, trusted origins
- Fastify catch-all /api/auth/* route using official better-auth Fastify bridge pattern
- Backend auth integration test stub with 7 test cases gated behind DATABASE_URL check
- Frontend App routing test stub with 6 todo test cases for INFRA-03

## Task Commits

Each task was committed atomically:

1. **Task 0: Wave 0 test stubs for backend auth and frontend routing** - `367d54c` (test)
2. **Task 1: PostgreSQL + Drizzle ORM + better-auth backend infrastructure** - `815d2f9` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `docker-compose.yml` - PostgreSQL 16 service with named volume
- `packages/backend/.env.example` - Documents DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, NODE_ENV
- `packages/backend/drizzle.config.ts` - drizzle-kit config pointing to schema.ts
- `packages/backend/src/db/index.ts` - Drizzle db instance via node-postgres driver
- `packages/backend/src/db/schema.ts` - 4 better-auth tables: user, session, account, verification
- `packages/backend/src/auth.ts` - better-auth instance with drizzleAdapter, emailAndPassword, 30-day sessions
- `packages/backend/src/routes/auth.ts` - Fastify plugin with /api/auth/* catch-all handler
- `packages/backend/tests/auth.test.ts` - Integration test stub (skipIf !DATABASE_URL)
- `packages/frontend/src/__tests__/App.test.tsx` - App routing test stub (6 todo cases)
- `packages/backend/package.json` - Added better-auth, drizzle-orm, pg, drizzle-kit, @types/pg
- `packages/frontend/vitest.config.ts` - Extended include to pick up src/__tests__ directory

## Decisions Made

- **Zod v3 retained** — better-auth bundles zod v4 internally; upgrading the project's zod from v3 to v4 would break existing `z.coerce.number()` usage in feed.ts route validation. Runtime coexistence works fine; upgrade deferred to future cleanup.
- **describe.skipIf(!DATABASE_URL)** — auth integration tests require a live PostgreSQL database. Using skipIf prevents CI failures in environments without PostgreSQL while still documenting the test contract.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Extended frontend vitest config to include src/__tests__**
- **Found during:** Task 0 (Wave 0 test stubs)
- **Issue:** Plan placed App.test.tsx in `src/__tests__/` but vitest config only picked up `tests/**/*.test.tsx`. File would not be discovered by the test runner.
- **Fix:** Added `src/__tests__/**/*.test.tsx` and `src/__tests__/**/*.test.ts` to the include list in packages/frontend/vitest.config.ts
- **Files modified:** packages/frontend/vitest.config.ts
- **Verification:** File path matches updated glob pattern
- **Committed in:** 367d54c (Task 0 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for test file to be picked up by vitest. No scope creep.

## Issues Encountered

- zod peer dependency warning from better-call (better-auth internal): expects `zod@^4.0.0`, found `3.25.76`. This is a warning only — better-auth bundles its own zod v4 internally. No runtime conflict. Intentionally not resolved per plan spec.

## User Setup Required

None — no external service configuration required in this plan. PostgreSQL is provisioned via Docker Compose. Run `docker compose up -d` to start the database.

## Next Phase Readiness

- Plan 02 can now: register authRoutes with Fastify server, update CORS to `credentials: true`, add `/api/auth/*` to server.ts
- Drizzle schema is ready for `drizzle-kit generate` + `drizzle-kit migrate` once PostgreSQL is running
- better-auth instance is exported from `src/auth.ts` for use by auth middleware in Plan 02

---
*Phase: 04-database-foundation-auth-core*
*Completed: 2026-04-03*

## Self-Check: PASSED

All claimed files verified present. All task commits verified in git log.

| Item | Status |
|------|--------|
| docker-compose.yml | FOUND |
| packages/backend/.env.example | FOUND |
| packages/backend/drizzle.config.ts | FOUND |
| packages/backend/src/db/index.ts | FOUND |
| packages/backend/src/db/schema.ts | FOUND |
| packages/backend/src/auth.ts | FOUND |
| packages/backend/src/routes/auth.ts | FOUND |
| packages/backend/tests/auth.test.ts | FOUND |
| packages/frontend/src/__tests__/App.test.tsx | FOUND |
| .planning/.../04-01-SUMMARY.md | FOUND |
| Commit 367d54c | FOUND |
| Commit 815d2f9 | FOUND |
