# Roadmap: Goonster

## Overview

Three phases that build in strict dependency order: backend first (serve video files correctly), player second (one video working perfectly on mobile), feed last (swipe navigation over the full list). Each phase is independently testable. Phase 1 can be verified with curl. Phase 2 can be verified on a real iPhone before a single swipe gesture exists. Phase 3 delivers the full product.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Backend Foundation** - Node/TypeScript server with HTTP 206 video streaming and cursor-paginated feed API (completed 2026-04-01)
- [ ] **Phase 2: Video Player Core** - Single-video player component with all iOS Safari constraints addressed
- [ ] **Phase 3: Feed & Navigation** - Vertical swipe feed with preloading, buffering indicators, and end-of-feed state

## Phase Details

### Phase 1: Backend Foundation
**Goal**: The API serves video files correctly and feed metadata reliably — everything the frontend needs exists and is testable before any UI is written
**Depends on**: Nothing (first phase)
**Requirements**: API-01, API-02, API-03, API-04
**Success Criteria** (what must be TRUE):
  1. `curl -r 0-1023 http://localhost:PORT/video/:id` returns HTTP 206 with correct `Content-Range` header
  2. `GET /feed` returns a paginated list of video metadata and a cursor that produces the next page on repeat calls
  3. Inserting a new video file does not break pagination for an in-progress session (cursor stability)
  4. Swapping from the disk `VideoStore` to a mock implementation requires no changes to route handlers
**Plans**: 2 plans
Plans:
- [x] 01-01-PLAN.md — Monorepo scaffold, shared types, VideoStore interface, DiskVideoStore, feedService, fixtures
- [x] 01-02-PLAN.md — Fastify server, HTTP routes, integration tests for 206 streaming and feed pagination

### Phase 2: Video Player Core
**Goal**: A single video plays fullscreen in vertical format on a real mobile device with correct iOS Safari behavior — mute control visible, tap-to-pause working, loop continuous, progress bar showing
**Depends on**: Phase 1
**Requirements**: PLAY-01, PLAY-02, PLAY-03, PLAY-04, PLAY-05, PLAY-06, MOBL-01, MOBL-02, MOBL-03, MOBL-04
**Success Criteria** (what must be TRUE):
  1. Opening the app on an iPhone loads a fullscreen vertical video that begins playing muted without any user interaction
  2. The video fills the screen without letterboxing and without being cropped by the browser address bar
  3. A mute/unmute button is visible on the video; tapping it toggles audio; tapping the video body pauses and resumes playback
  4. The video loops seamlessly when it ends; a thin progress bar at the bottom shows elapsed time throughout
  5. Only one video element ever plays at a time (verified by checking the iOS single-video hardware constraint is not violated)
**Plans**: 3 plans
Plans:
- [x] 02-01-PLAN.md — Frontend scaffold (Vite + React 19 + Tailwind 4), hooks (useVideoPlayer, useVideoProgress), feed API client
- [x] 02-02-PLAN.md — VideoPlayer component tree (MuteButton, ProgressBar, PauseFlash), App wiring, component tests
- [x] 02-03-PLAN.md — Human verification checkpoint: browser and mobile device testing
**UI hint**: yes

### Phase 3: Feed & Navigation
**Goal**: Users can swipe through the full video feed — each swipe is instant, buffering is communicated, and the feed has a clear end
**Depends on**: Phase 2
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04, FEED-05, FEED-06
**Success Criteria** (what must be TRUE):
  1. Swiping up advances to the next video; swiping down returns to the previous video; each transition snaps cleanly without overshooting on a fast flick
  2. The next video begins playing with no perceptible gap after a swipe (preload is in effect)
  3. A loading indicator appears when a video is buffering and disappears when playback begins
  4. After the last video, the screen shows "You've seen everything" and no further swipes advance
**Plans**: 3 plans
Plans:
- [ ] 03-01-PLAN.md — Install swiper+zustand, create feedStore, upgrade feedApi to cursor pagination, create useFeed hook, refactor useVideoPlayer mute state
- [ ] 03-02-PLAN.md — Feed components (FeedContainer, FeedSlide, BufferingSpinner, EndOfFeedSlide), App.tsx wiring, component tests
- [ ] 03-03-PLAN.md — Human verification checkpoint: desktop and mobile device testing
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Backend Foundation | 2/2 | Complete   | 2026-04-01 |
| 2. Video Player Core | 2/3 | In Progress|  |
| 3. Feed & Navigation | 0/3 | Not started | - |
