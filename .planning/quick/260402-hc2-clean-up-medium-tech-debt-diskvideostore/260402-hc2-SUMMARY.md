---
phase: quick-260402-hc2
plan: "01"
subsystem: backend
tags: [tech-debt, error-handling, logging, refactor, shared-package]
dependency_graph:
  requires: []
  provides: [hardened-disk-video-store, pino-logging, startup-validation, feed-error-envelope, shared-package-compiled-exports]
  affects: [packages/backend, packages/shared]
tech_stack:
  added: []
  patterns: [pino-structured-logging, try-catch-error-wrapping, async-interface-contracts]
key_files:
  created: []
  modified:
    - packages/backend/src/store/DiskVideoStore.ts
    - packages/backend/src/store/VideoStore.ts
    - packages/backend/src/server.ts
    - packages/backend/src/routes/feed.ts
    - packages/shared/package.json
    - packages/backend/tests/DiskVideoStore.test.ts
    - packages/backend/tests/fixtures/MockVideoStore.ts
decisions:
  - "createReadStream made async — eliminates duplicate sync readFileSync by reusing findMeta"
  - "startup validation uses separate tmp Fastify instance just for fatal log — avoids coupling buildApp() to filesystem check"
  - "shared package keeps 'default' conditional export pointing to src/ for tsx dev compatibility"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-04-02"
  tasks_completed: 2
  files_modified: 7
requirements_completed: []
---

# Quick Task 260402-hc2: Clean Up Medium Tech Debt — DiskVideoStore Summary

**One-liner:** Hardened DiskVideoStore with async createReadStream and error-safe listVideos, enabled Fastify pino logger, added startup metadata validation, structured 500 error envelope in feed route, and updated shared package to export compiled dist/ output.

## Tasks Completed

| # | Name | Commit | Status |
|---|------|--------|--------|
| 1 | Harden DiskVideoStore — async createReadStream, error-safe listVideos | 23f91a0 | Done |
| 2 | Server logging, startup validation, feed error envelope, shared exports | fdb44b0 | Done |

## What Was Built

### Task 1: DiskVideoStore Hardening (TDD)

**DiskVideoStore.ts:**
- `createReadStream` is now `async` — returns `Promise<NodeJS.ReadableStream>` instead of `NodeJS.ReadableStream`
- Eliminated the duplicated synchronous `fs.readFileSync` + `JSON.parse` block; `createReadStream` now calls `await this.findMeta(id)` like the other methods
- `listVideos()` wraps both the file read (`fs.promises.readFile`) and `JSON.parse` in try/catch, rethrowing with the message `"Failed to load video metadata: {original}"` — covers ENOENT and SyntaxError

**VideoStore.ts interface:**
- `createReadStream` return type updated from `NodeJS.ReadableStream` to `Promise<NodeJS.ReadableStream>`

**MockVideoStore.ts:**
- `createReadStream` updated to `async` to satisfy the updated interface

**Tests added:**
- `listVideos()` throws descriptive error for corrupt metadata.json (writes temp file with invalid JSON)
- `listVideos()` throws descriptive error for missing metadata.json (uses nonexistent path)
- `createReadStream()` returns a readable stream for a valid id (confirming async works)
- `createReadStream()` throws "Video not found" for a nonexistent id

### Task 2: Server, Feed, Shared Package

**server.ts:**
- `Fastify({ logger: false })` changed to `Fastify({ logger: { level: 'info' } })` — activates pino structured logging
- `console.log(...)` removed — Fastify automatically logs the listen event with pino
- Added startup check: `fs.promises.access(metadataPath)` in the `isMain` block before `buildApp()`. If metadata.json is missing, logs fatal and exits with code 1.

**feed.ts:**
- Bare `throw err` replaced with structured 500 response: `{ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } }`
- Uses `request.log.error(err, 'Feed request failed')` to log the actual error before returning the safe envelope

**shared/package.json:**
- `main`, `types`, and `exports` updated to point to `./dist/types/video.js` / `./dist/types/video.d.ts`
- Added `"build": "tsc"` script
- Kept `"default"` conditional export pointing to `./src/types/video.ts` for tsx dev-mode compatibility
- `pnpm --filter @goonster/shared run build` generates `dist/types/video.js`, `video.d.ts`, source maps

## Verification

All 32 backend tests pass after both tasks. Typecheck passes on both backend and frontend.

```
Test Files  4 passed (4)
Tests  32 passed (32)
```

- No `console.log` in server.ts: confirmed
- No `readFileSync` in DiskVideoStore.ts: confirmed  
- No bare `throw err` in feed.ts: confirmed
- `packages/shared/dist/types/video.js` and `.d.ts` generated: confirmed
- Backend typecheck: clean
- Frontend typecheck: clean

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- The startup metadata check creates a temporary Fastify instance solely for the `fatal` log output rather than coupling the check to `buildApp()`. This keeps `buildApp()` clean for test use without side effects.
- The `dist/` directory is gitignored (`.gitignore: dist/`), which is correct — build output is generated on-demand, not committed.

## Known Stubs

None.

## Self-Check: PASSED

- `packages/backend/src/store/DiskVideoStore.ts`: FOUND
- `packages/backend/src/store/VideoStore.ts`: FOUND
- `packages/backend/src/server.ts`: FOUND
- `packages/backend/src/routes/feed.ts`: FOUND
- `packages/shared/package.json`: FOUND
- `packages/backend/tests/DiskVideoStore.test.ts`: FOUND
- `packages/backend/tests/fixtures/MockVideoStore.ts`: FOUND
- Commit 8d3e8d1 (RED tests): FOUND
- Commit 23f91a0 (Task 1 GREEN): FOUND
- Commit fdb44b0 (Task 2): FOUND
