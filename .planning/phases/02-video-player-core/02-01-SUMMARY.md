---
phase: 02-video-player-core
plan: 01
subsystem: ui
tags: [react, vite, tailwind, typescript, tanstack-query, vitest, jsdom]

# Dependency graph
requires:
  - phase: 01-backend-foundation
    provides: backend API at /feed and /video endpoints with VideoMeta types

provides:
  - React 19 + Vite 8 + Tailwind 4 frontend package scaffold
  - Vite proxy config forwarding /feed and /video to localhost:3000
  - Mobile viewport CSS with 100dvh and -webkit-fill-available fallback
  - feedApi fetchFeed() typed fetch for GET /feed
  - useVideoPlayer hook (play/pause/mute state with video element event sync)
  - useVideoProgress hook (0-1 progress from timeupdate events)
  - App shell with TanStack Query provider and loading/error/empty states
  - Wave 0 stub test files for Nyquist compliance (VideoPlayer, MuteButton, ProgressBar)

affects:
  - 02-02-PLAN (VideoPlayer, MuteButton, ProgressBar components consume hooks and api)

# Tech tracking
tech-stack:
  added:
    - react@19.2.4
    - react-dom@19.2.4
    - "@tanstack/react-query@^5"
    - vite@8.0.3
    - "@vitejs/plugin-react@^4"
    - tailwindcss@^4
    - "@tailwindcss/vite@^4"
    - vitest@^4
    - jsdom@^29
    - "@testing-library/react@^16"
    - "@testing-library/user-event@^14"
    - "@testing-library/jest-dom@^6"
    - "@types/react@^19"
    - "@types/react-dom@^19"
  patterns:
    - Vite proxy to backend instead of CORS — clean separation for dev
    - useVideoPlayer reads back video.muted from DOM after mutation (avoids stale closure Pitfall 4)
    - play() promise rejection caught silently (browser autoplay policy)
    - useVideoProgress uses timeupdate event listener, not scroll-based tracking
    - TanStack Query wraps App at root in QueryClientProvider

key-files:
  created:
    - packages/frontend/package.json
    - packages/frontend/index.html
    - packages/frontend/vite.config.ts
    - packages/frontend/tsconfig.json
    - packages/frontend/tsconfig.node.json
    - packages/frontend/vitest.config.ts
    - packages/frontend/src/vite-env.d.ts
    - packages/frontend/src/index.css
    - packages/frontend/src/main.tsx
    - packages/frontend/src/App.tsx
    - packages/frontend/src/api/feedApi.ts
    - packages/frontend/src/hooks/useVideoPlayer.ts
    - packages/frontend/src/hooks/useVideoProgress.ts
    - packages/frontend/tests/setup.ts
    - packages/frontend/tests/VideoPlayer.test.tsx
    - packages/frontend/tests/MuteButton.test.tsx
    - packages/frontend/tests/ProgressBar.test.tsx
  modified:
    - pnpm-lock.yaml

key-decisions:
  - "Used moduleResolution: Bundler (not Node16) for Vite/React frontend — avoids Pitfall 7 (Node16 resolution incompatible with bundler-based imports)"
  - "Added @types/react explicitly to devDependencies — React 19 ships no bundled .d.ts files, types package still required"
  - "Added vite-env.d.ts with vite/client reference — resolves TS2882 CSS side-effect import type error"
  - "isMuted initial state is true — required for autoplay (browsers block unmuted autoplay)"

patterns-established:
  - "Pattern: useVideoPlayer reads DOM state (video.muted) back after mutation rather than inverting React state"
  - "Pattern: play() promise always gets .catch(() => {}) to prevent unhandled rejection from autoplay policy"
  - "Pattern: useVideoProgress uses addEventListener timeupdate, cleans up in useEffect return"
  - "Pattern: fullscreen-container CSS class provides 100dvh with -webkit-fill-available fallback"

requirements-completed: [PLAY-02, PLAY-04, PLAY-05, MOBL-01, MOBL-02, MOBL-04]

# Metrics
duration: 4min
completed: 2026-04-01
---

# Phase 2 Plan 01: Frontend Scaffold Summary

**React 19 + Vite 8 + Tailwind 4 frontend package with proxy, mobile viewport CSS, typed feed API, play/pause/mute/progress hooks, and Wave 0 stub test infrastructure**

## Performance

- **Duration:** 4 min
- **Started:** 2026-04-01T11:46:36Z
- **Completed:** 2026-04-01T11:49:55Z
- **Tasks:** 2 completed
- **Files modified:** 17

## Accomplishments

- Scaffolded full frontend package: Vite 8, React 19, Tailwind 4, TanStack Query 5, Vitest 4 — all compile clean
- Implemented feedApi (typed), useVideoPlayer (play/pause/mute with DOM event sync), and useVideoProgress (timeupdate-driven)
- Created Wave 0 stub test files with todo stubs for all Nyquist-tracked requirements — vitest runs green (3 passes, 11 todos)

## Task Commits

1. **Task 1: Scaffold Vite + React 19 + Tailwind 4 frontend with Wave 0 test stubs** - `4b30d95` (feat)
2. **Task 2: Implement feedApi, useVideoPlayer, and useVideoProgress hooks** - `4772e3a` (feat)

## Files Created/Modified

- `packages/frontend/package.json` - All dependencies: React 19, Vite 8, Tailwind 4, TanStack Query, Vitest
- `packages/frontend/index.html` - HTML entry with viewport-fit=cover for iPhone notch
- `packages/frontend/vite.config.ts` - React + Tailwind plugins, proxy /feed and /video to localhost:3000
- `packages/frontend/tsconfig.json` - moduleResolution: Bundler, no Node16
- `packages/frontend/tsconfig.node.json` - For vite.config.ts and vitest.config.ts
- `packages/frontend/vitest.config.ts` - jsdom environment, tests/ include, setup.ts
- `packages/frontend/src/vite-env.d.ts` - vite/client reference for CSS import types
- `packages/frontend/src/index.css` - Tailwind import, 100dvh, -webkit-fill-available viewport fix
- `packages/frontend/src/main.tsx` - StrictMode + QueryClientProvider wrapping App
- `packages/frontend/src/App.tsx` - TanStack Query shell with loading/error/empty/placeholder states
- `packages/frontend/src/api/feedApi.ts` - fetchFeed() typed for FeedResponse with VideoMeta[]
- `packages/frontend/src/hooks/useVideoPlayer.ts` - play/pause/mute with DOM event sync
- `packages/frontend/src/hooks/useVideoProgress.ts` - timeupdate 0-1 progress
- `packages/frontend/tests/setup.ts` - @testing-library/jest-dom/vitest import
- `packages/frontend/tests/VideoPlayer.test.tsx` - Wave 0 stubs for PLAY/MOBL requirements
- `packages/frontend/tests/MuteButton.test.tsx` - Wave 0 stubs for PLAY-03, MOBL-03
- `packages/frontend/tests/ProgressBar.test.tsx` - Wave 0 stubs for PLAY-06

## Decisions Made

- Added `@types/react` explicitly — React 19 does not bundle `.d.ts` files, types package still required
- Added `vite-env.d.ts` with `/// <reference types="vite/client" />` — resolves TS2882 CSS side-effect import error (standard Vite pattern)
- Used `moduleResolution: Bundler` not `Node16` — avoids import resolution mismatch with Vite's bundler pipeline

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added @types/react to devDependencies**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** React 19 ships no bundled `.d.ts` files; `@types/react` was missing from package.json causing TS7016 errors on JSX
- **Fix:** Added `@types/react@^19` and `@types/react-dom@^19` to devDependencies (plan specified `@types/react-dom` only)
- **Files modified:** packages/frontend/package.json
- **Verification:** `pnpm typecheck` exits 0
- **Committed in:** 4b30d95 (Task 1 commit)

**2. [Rule 2 - Missing Critical] Added vite-env.d.ts for CSS import type support**
- **Found during:** Task 1 (typecheck verification)
- **Issue:** TypeScript TS2882 error on `import './index.css'` — CSS side-effect imports need type declaration
- **Fix:** Created `packages/frontend/src/vite-env.d.ts` with `/// <reference types="vite/client" />`
- **Files modified:** packages/frontend/src/vite-env.d.ts
- **Verification:** `pnpm typecheck` exits 0
- **Committed in:** 4b30d95 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 2 — missing critical type support)
**Impact on plan:** Both auto-fixes required for TypeScript compilation. No scope creep.

## Issues Encountered

- `@vitejs/plugin-react@4.7.0` has unmet peer dep warning for `vite@"^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0"` — plugin has not yet updated its peer dep range to include Vite 8, but works in practice. No action taken; this is a cosmetic warning only.

## Known Stubs

The following stubs exist intentionally — Wave 0 placeholders to be replaced in Plan 02 Task 2:

- `packages/frontend/tests/VideoPlayer.test.tsx` — 7 `it.todo()` stubs for PLAY-01, PLAY-02, PLAY-04, PLAY-05, MOBL-01, MOBL-02, MOBL-04
- `packages/frontend/tests/MuteButton.test.tsx` — 2 `it.todo()` stubs for PLAY-03, MOBL-03
- `packages/frontend/tests/ProgressBar.test.tsx` — 2 `it.todo()` stubs for PLAY-06

These stubs exist to satisfy Nyquist compliance tracking. They do not prevent this plan's goal (hooks + scaffold) from being achieved. Plan 02 Task 2 resolves them.

The `App.tsx` VideoPlayer placeholder (`<span className="text-white">Video: {video.title}</span>`) is an intentional stub — Plan 02 wires the real VideoPlayer component.

## Next Phase Readiness

- All hooks exported and typed, ready for Plan 02 component wiring
- Vite proxy configured — frontend can call `/feed` and `/video` without CORS issues
- Stub tests pass, TypeScript compiles clean
- No blockers for Plan 02

---
*Phase: 02-video-player-core*
*Completed: 2026-04-01*
