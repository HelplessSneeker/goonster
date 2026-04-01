---
phase: 01-backend-foundation
plan: 01
subsystem: api
tags: [pnpm, typescript, fastify, vitest, monorepo, node]

# Dependency graph
requires: []
provides:
  - pnpm monorepo with packages/backend, packages/shared, packages/frontend workspace layout
  - VideoMeta type in @goonster/shared with id, filename, title, duration, mimeType, size, social fields
  - VideoStore interface with listVideos, getSize, createReadStream methods
  - DiskVideoStore implementation reading metadata.json from disk
  - feedService with cursor-based pagination (base64url-encoded last-seen ID, insertion-stable)
  - MockVideoStore for test isolation
  - 3 placeholder vertical 360x640 mp4 fixtures (3s each)
  - Unit tests: DiskVideoStore (7 tests), feedService (9 tests) — all green
affects: [02-backend-foundation, 02-player, 03-feed]

# Tech tracking
tech-stack:
  added:
    - pnpm 10.33.0 (workspace monorepo)
    - TypeScript 6.0.2 (Node16 module mode, strict)
    - Fastify 5.8.4 (installed, wired in Plan 02)
    - "@fastify/static 9.0.0 (installed, wired in Plan 02)"
    - "@fastify/cors 11.2.0 (installed, wired in Plan 02)"
    - zod 3.25.2 (installed, wired in Plan 02)
    - Vitest 4.1.2 (unit testing)
    - tsx 4.21.0 (dev server)
    - "@types/node 25.5.0"
  patterns:
    - VideoStore interface abstraction — all file I/O through interface, not raw fs
    - Cursor pagination — base64url-encoded last-seen ID, stable under list insertion
    - pnpm workspace:* — shared types via @goonster/shared package
    - MockVideoStore — test isolation pattern, no disk I/O in unit tests
    - Node16 module mode — .js extensions on relative imports in TypeScript

key-files:
  created:
    - packages/shared/src/types/video.ts
    - packages/backend/src/store/VideoStore.ts
    - packages/backend/src/store/DiskVideoStore.ts
    - packages/backend/src/services/feedService.ts
    - packages/backend/fixtures/metadata.json
    - packages/backend/fixtures/videos/placeholder-01.mp4
    - packages/backend/fixtures/videos/placeholder-02.mp4
    - packages/backend/fixtures/videos/placeholder-03.mp4
    - packages/backend/tests/DiskVideoStore.test.ts
    - packages/backend/tests/feedService.test.ts
    - packages/backend/tests/fixtures/MockVideoStore.ts
    - packages/backend/vitest.config.ts
    - tsconfig.base.json
    - pnpm-workspace.yaml
  modified: []

key-decisions:
  - "pnpm workspaces (not Turborepo) — sufficient for 3-package monorepo scope"
  - "TypeScript 6.0.2 and Vitest 4.1.2 used instead of 5.x/3.x from CLAUDE.md — research confirmed newer versions"
  - "Cursor encodes last-seen ID via base64url — insertion-stable, not offset-based"
  - "packages/shared has its own typescript devDependency to support independent typecheck script"
  - "Backend tsconfig includes types: [node] to resolve NodeJS.ReadableStream namespace"
  - "Fixture videos are checked into repo (< 6KB each) — no LFS needed at this size"

patterns-established:
  - "VideoStore abstraction: route handlers must depend only on VideoStore interface, never on fs directly"
  - "ESM imports: always use .js extensions on relative TypeScript imports (Node16 module mode)"
  - "Cursor pagination: encodeCursor(lastId) = Buffer.from(id).toString('base64url')"
  - "Test fixtures: MockVideoStore for unit tests, real DiskVideoStore for integration paths"

requirements-completed: [API-04, API-03]

# Metrics
duration: 4min
completed: 2026-04-01
---

# Phase 01 Plan 01: Monorepo Scaffold and Data Layer Summary

**pnpm monorepo with VideoStore abstraction, DiskVideoStore, base64url cursor pagination, and 16 passing unit tests covering insertion-stable cursors**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-04-01T09:34:57Z
- **Completed:** 2026-04-01T09:38:55Z
- **Tasks:** 2
- **Files modified:** 16 created

## Accomplishments
- pnpm workspace monorepo established with @goonster/shared, @goonster/backend, @goonster/frontend packages
- VideoStore interface and DiskVideoStore implementation provide clean storage abstraction for Plan 02 HTTP layer
- feedService cursor pagination stable under list insertion — cursors encode item ID not offset position
- 3 placeholder vertical (360x640) mp4 fixtures checked in at <6KB each using ffmpeg

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold monorepo, shared types, VideoStore contracts** - `d682e58` (feat)
2. **Task 2: DiskVideoStore, feedService, fixtures, unit tests** - `4b26ef4` (feat)

## Files Created/Modified
- `packages/shared/src/types/video.ts` - VideoMeta interface with social fields stub
- `packages/backend/src/store/VideoStore.ts` - VideoStore interface (listVideos, getSize, createReadStream)
- `packages/backend/src/store/DiskVideoStore.ts` - Disk implementation reading metadata.json
- `packages/backend/src/services/feedService.ts` - Cursor pagination with encodeCursor/decodeCursor
- `packages/backend/fixtures/metadata.json` - 3 video records with real file sizes
- `packages/backend/fixtures/videos/placeholder-{01,02,03}.mp4` - ffmpeg-generated vertical placeholders
- `packages/backend/tests/DiskVideoStore.test.ts` - 7 unit tests for store
- `packages/backend/tests/feedService.test.ts` - 9 unit tests including cursor stability test
- `packages/backend/tests/fixtures/MockVideoStore.ts` - In-memory VideoStore for test isolation
- `packages/backend/vitest.config.ts` - Vitest 4.1.2 config
- `tsconfig.base.json` - Shared TypeScript config with Node16 module mode and strict
- `pnpm-workspace.yaml` - Workspace package glob

## Decisions Made
- Used pnpm workspaces without Turborepo — 3-package scope doesn't need build graph optimization
- TypeScript 6.0.2 and Vitest 4.1.2 used — research confirmed these are the current stable versions
- Cursor encodes item ID (not array index) via base64url — passing insertion-stability test confirms correctness
- Added `typescript` as devDependency to packages/shared so it can run its own typecheck independently
- Added `types: ["node"]` to backend tsconfig to resolve NodeJS.ReadableStream namespace

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added typescript devDependency to @goonster/shared**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** packages/shared typecheck script ran `tsc --noEmit` but no typescript installed in that package — `tsc: command not found`
- **Fix:** Added `"typescript": "^6.0.2"` to packages/shared devDependencies
- **Files modified:** packages/shared/package.json
- **Verification:** `pnpm -r run typecheck` exits 0
- **Committed in:** d682e58 (Task 1 commit)

**2. [Rule 1 - Bug] Added types: ["node"] to backend tsconfig**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** `NodeJS.ReadableStream` type not found because @types/node wasn't activated in tsconfig
- **Fix:** Added `"types": ["node"]` to packages/backend/tsconfig.json compilerOptions
- **Files modified:** packages/backend/tsconfig.json
- **Verification:** `pnpm -r run typecheck` exits 0
- **Committed in:** d682e58 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs)
**Impact on plan:** Both fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the TypeScript configuration fixes documented above.

## Next Phase Readiness
- VideoStore interface ready for Plan 02 HTTP layer (Fastify server, feed routes, video streaming)
- All dependencies installed in node_modules — Plan 02 can immediately import fastify, @fastify/static, @fastify/cors, zod
- MockVideoStore available for Plan 02 route handler tests without disk I/O
- 3 fixture videos on disk for HTTP 206 range request integration tests

---
*Phase: 01-backend-foundation*
*Completed: 2026-04-01*
