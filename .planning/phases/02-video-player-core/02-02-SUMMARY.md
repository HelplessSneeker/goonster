---
phase: 02-video-player-core
plan: 02
subsystem: ui
tags: [react, tailwind, typescript, vitest, jsdom, video-player]

# Dependency graph
requires:
  - phase: 02-video-player-core
    plan: 01
    provides: useVideoPlayer, useVideoProgress hooks, feedApi, App scaffold, Wave 0 stub tests

provides:
  - resolveVideoUrl abstraction (v1 local path, v2 will be signed S3/GCS URL)
  - VideoPlayer component with autoPlay/muted/loop/playsInline, fullscreen-container, object-cover
  - MuteButton with 44px touch target, stopPropagation, pointer-events-auto, bottom-right
  - ProgressBar with 2px height, bg-white/30 track, bg-white fill, transition-[width]
  - PauseFlash with 500ms hold + 300ms fade on playing-to-paused transition
  - App.tsx wired to live feed data with VideoPlayer replacing placeholder stub
  - 18 passing component tests covering all PLAY and MOBL requirements

affects:
  - 02-03-PLAN (Swiper feed will consume VideoPlayer as a per-slide component)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - resolveVideoUrl abstraction — single function returning /video/{filename} in v1; swap to signed URL in v2 without touching components
    - PauseFlash uses prevPlayingRef to detect playing→paused transition only (not initial load)
    - MuteButton uses stopPropagation + pointer-events-auto inside pointer-events-none overlay parent
    - HTMLMediaElement.prototype.play/pause mocked via vi.fn() in tests (jsdom limitation)
    - VideoPlayer useEffect calls play().catch() on video.filename change to guarantee autoplay

key-files:
  created:
    - packages/frontend/src/lib/resolveVideoUrl.ts
    - packages/frontend/src/components/VideoPlayer/VideoPlayer.tsx
    - packages/frontend/src/components/VideoPlayer/MuteButton.tsx
    - packages/frontend/src/components/VideoPlayer/ProgressBar.tsx
    - packages/frontend/src/components/VideoPlayer/PauseFlash.tsx
    - packages/frontend/src/components/VideoPlayer/index.ts
  modified:
    - packages/frontend/src/App.tsx
    - packages/frontend/tests/VideoPlayer.test.tsx
    - packages/frontend/tests/MuteButton.test.tsx
    - packages/frontend/tests/ProgressBar.test.tsx

key-decisions:
  - "resolveVideoUrl returns /video/{filename} in v1 — per CLAUDE.md constraint to abstract URL resolution from components"
  - "PauseFlash triggers only on playing→paused transition using prevPlayingRef — not on initial load or resume"
  - "MuteButton icon has no background circle — per UI-SPEC: icon alone on video (no bg-black/50 ring around mute icon)"

# Metrics
duration: 10min
completed: 2026-04-01
---

# Phase 2 Plan 02: VideoPlayer Component Tree Summary

**VideoPlayer, MuteButton, ProgressBar, PauseFlash with resolveVideoUrl abstraction, wired into App via TanStack Query, 18 passing Vitest tests covering all PLAY and MOBL requirements**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-04-01T11:46:36Z
- **Completed:** 2026-04-01T11:56:03Z
- **Tasks:** 2 completed
- **Files modified:** 10

## Accomplishments

- Built full VideoPlayer component tree per UI-SPEC: VideoPlayer, MuteButton, ProgressBar, PauseFlash
- Created resolveVideoUrl abstraction per CLAUDE.md requirement — v1 returns `/video/{filename}`, change only this function for v2 signed URLs
- Wired App.tsx to show live VideoPlayer component replacing placeholder span
- Wrote 18 passing tests covering PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, MOBL-01, MOBL-02, MOBL-03, MOBL-04
- TypeScript compiles clean, all 18 tests pass

## Task Commits

1. **Task 1: Create resolveVideoUrl abstraction, VideoPlayer component tree, and wire into App** - `bd4d263` (feat)
2. **Task 2: Write component tests covering all requirements** - `1d2db30` (test)

## Files Created/Modified

- `packages/frontend/src/lib/resolveVideoUrl.ts` — URL abstraction: `/video/${filename}` in v1, signed URL in v2
- `packages/frontend/src/components/VideoPlayer/VideoPlayer.tsx` — Full-screen video with autoPlay/muted/loop/playsInline, wires useVideoPlayer + useVideoProgress + resolveVideoUrl
- `packages/frontend/src/components/VideoPlayer/MuteButton.tsx` — Bottom-right toggle, min-w/h-[44px], pointer-events-auto, stopPropagation
- `packages/frontend/src/components/VideoPlayer/ProgressBar.tsx` — 2px bottom bar, bg-white/30 track, bg-white fill, transition-[width]
- `packages/frontend/src/components/VideoPlayer/PauseFlash.tsx` — Center flash, 500ms hold + 300ms fade, playing→paused only
- `packages/frontend/src/components/VideoPlayer/index.ts` — Re-exports VideoPlayer
- `packages/frontend/src/App.tsx` — Replaced placeholder with `<VideoPlayer video={video} />`
- `packages/frontend/tests/VideoPlayer.test.tsx` — 8 tests covering PLAY-01/02/04/05, MOBL-01/02/04, resolveVideoUrl URL
- `packages/frontend/tests/MuteButton.test.tsx` — 5 tests covering PLAY-03, MOBL-03, pointer-events
- `packages/frontend/tests/ProgressBar.test.tsx` — 5 tests covering PLAY-06, track/fill styling, height

## Decisions Made

- `resolveVideoUrl` returns `/video/${filename}` — per CLAUDE.md requirement to abstract URL resolution from components; v2 will change only this function for signed S3/GCS URLs
- PauseFlash detects playing→paused transition via `prevPlayingRef` — fires once on pause, not on initial load or resume
- MuteButton has no background circle — per UI-SPEC D-01: "icon alone on video"

## Deviations from Plan

None — plan executed exactly as written. All components match UI-SPEC specifications. Tests cover all declared requirements.

## Known Stubs

None — all Wave 0 stubs replaced with real tests. All 18 tests assert real behavior.

## Self-Check

- [x] `packages/frontend/src/lib/resolveVideoUrl.ts` exists
- [x] `packages/frontend/src/components/VideoPlayer/VideoPlayer.tsx` exists
- [x] `packages/frontend/src/components/VideoPlayer/MuteButton.tsx` exists
- [x] `packages/frontend/src/components/VideoPlayer/ProgressBar.tsx` exists
- [x] `packages/frontend/src/components/VideoPlayer/PauseFlash.tsx` exists
- [x] `packages/frontend/src/components/VideoPlayer/index.ts` exists
- [x] commit `bd4d263` exists (Task 1)
- [x] commit `1d2db30` exists (Task 2)
- [x] 18 tests pass, TypeScript compiles clean

## Self-Check: PASSED

---
*Phase: 02-video-player-core*
*Completed: 2026-04-01*
