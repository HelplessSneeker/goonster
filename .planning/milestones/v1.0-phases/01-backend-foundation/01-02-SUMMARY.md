---
phase: 01-backend-foundation
plan: 02
subsystem: api
tags: [fastify, typescript, vitest, http-range, cursor-pagination, static-files, zod]

# Dependency graph
requires:
  - phase: 01-01
    provides: VideoStore interface, DiskVideoStore, feedService, MockVideoStore, fixture videos
provides:
  - Fastify buildApp factory with optional store injection for test isolation
  - GET /video/{filename} via @fastify/static with HTTP Range (206) support
  - GET /video/:id/meta metadata endpoint
  - GET /feed with Zod query validation and cursor pagination (INVALID_CURSOR 400)
  - 12 integration tests: 4 video streaming (API-01) + 8 feed pagination (API-02, API-03, API-04)
affects: [02-player, 03-feed]

# Tech tracking
tech-stack:
  added:
    - "@fastify/static 9.0.0 (activated — HTTP Range 206 support for iOS Safari video seeking)"
    - "@fastify/cors 11.2.0 (activated — CORS for Vite dev server on :5173)"
    - zod 3.25.2 (activated — query validation in feedRoutes)
  patterns:
    - buildApp factory pattern — Fastify server factory accepting optional VideoStore override for test injection
    - server.inject() for integration tests — Fastify's built-in HTTP test helper, no supertest needed
    - Worktree-aware testing — pnpm filter must run from worktree root, not main repo root

key-files:
  created:
    - packages/backend/src/server.ts
    - packages/backend/src/routes/feed.ts
    - packages/backend/src/routes/video.ts
    - packages/backend/tests/video.test.ts
    - packages/backend/tests/feed.test.ts
  modified: []

key-decisions:
  - "buildApp factory with overrides?.store — single injection point proving API-04 swappability without route handler changes"
  - "import.meta.url + fileURLToPath for __dirname — required for ESM module compatibility in Node16 mode"
  - "isMain guard using path.resolve comparison — prevents server startup when imported in tests"
  - "feedRoutes catches 'Invalid cursor' error string — matches feedService.ts throw message exactly"

patterns-established:
  - "buildApp factory: all test-facing servers created via buildApp({ store: mockStore }), never directly instantiating Fastify"
  - "Route handlers never reference DiskVideoStore directly — always use VideoStore interface via options.store"
  - "pnpm --filter from worktree root: run test/typecheck from worktree directory, not main repo"

requirements-completed: [API-01, API-02]

# Metrics
duration: 2min
completed: 2026-04-01
---

# Phase 01 Plan 02: HTTP Server and Integration Tests Summary

**Fastify server with @fastify/static HTTP 206 range support, Zod-validated feed route, and 28 passing tests (12 integration) proving storage abstraction swappability**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-01T09:43:07Z
- **Completed:** 2026-04-01T09:45:30Z
- **Tasks:** 2
- **Files modified:** 5 created

## Accomplishments
- Fastify server with `buildApp` factory accepts any `VideoStore` — DiskVideoStore in prod, MockVideoStore in tests (API-04)
- `@fastify/static` serves `/video/` with HTTP Range support enabled — `acceptRanges` never disabled, required for iOS Safari seeking
- Integration tests cover HTTP 206 with `Content-Range`/`Accept-Ranges` headers against real fixture files
- Feed pagination integration tests run against `MockVideoStore` with zero route handler changes, proving API-04 contract

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Fastify server entry and route handlers** - `02ea838` (feat)
2. **Task 2: Integration tests for HTTP 206 streaming and feed pagination** - `fc419bb` (test)

## Files Created/Modified
- `packages/backend/src/server.ts` - buildApp factory with @fastify/static, CORS, feedRoutes, videoRoutes
- `packages/backend/src/routes/feed.ts` - GET /feed with Zod query validation, cursor pagination, error envelopes
- `packages/backend/src/routes/video.ts` - GET /video/:id/meta metadata route (video files served by @fastify/static)
- `packages/backend/tests/video.test.ts` - 4 integration tests: 206, Accept-Ranges, 200, 404
- `packages/backend/tests/feed.test.ts` - 8 integration tests: envelope shape, pagination, cursor, 400 errors

## Decisions Made
- Used `fileURLToPath(import.meta.url)` and `path.resolve` for `isMain` guard — `import.meta.dirname` doesn't exist in Node16 ESM mode without polyfill; `fileURLToPath` is the standard ESM approach
- `buildApp` returns `{ server, ready }` tuple — `ready` is the plugin registration promise; callers `await app.ready` then `await server.ready()` before injecting requests
- `feedRoutes` catches error message string `'Invalid cursor'` — matches the exact throw in `feedService.ts`, keeping coupling minimal

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used fileURLToPath instead of import.meta.dirname**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** Plan used `import.meta.dirname` but this property is not available in Node16 module mode TypeScript without extra config — `fileURLToPath(import.meta.url)` is the correct ESM-compatible approach
- **Fix:** Used `path.dirname(fileURLToPath(import.meta.url))` to derive `__dirname`
- **Files modified:** packages/backend/src/server.ts
- **Verification:** `pnpm -r run typecheck` exits 0
- **Committed in:** 02ea838 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 bug)
**Impact on plan:** Necessary for TypeScript compilation in Node16 ESM mode. No scope creep.

## Issues Encountered
- Node_modules missing from worktree — needed `pnpm install` from worktree root before tests could run. After install, all 28 tests passed on first run.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Backend API surface complete: GET /video/{file} (206 range), GET /feed (cursor pagination), GET /video/:id/meta
- Both DiskVideoStore (production) and MockVideoStore (tests) proven via integration tests
- `tsx watch src/server.ts` starts server on port 3000 (or $PORT) ready for frontend connection in Phase 02
- TypeScript compiles clean, all 28 tests pass

---
*Phase: 01-backend-foundation*
*Completed: 2026-04-01*
