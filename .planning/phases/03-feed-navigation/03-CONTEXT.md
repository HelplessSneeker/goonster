# Phase 3: Feed & Navigation - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Vertical swipe feed with preloading, buffering indicators, and end-of-feed state. Users can swipe through the full video feed — each swipe is instant, buffering is communicated, and the feed has a clear end. No new backend endpoints, no social features, no new video controls.

</domain>

<decisions>
## Implementation Decisions

### Swipe transition feel
- **D-01:** TikTok-style snap — fast snap with no momentum or rubber-band effect. Finger release immediately commits to next/previous video (~200-300ms transition)
- **D-02:** No overscroll or bounce at feed edges
- **D-03:** Mousewheel/trackpad scrolling works on desktop — scroll wheel advances one video per click. Makes desktop testing easy and the app usable on laptop browsers

### Preloading strategy
- **D-04:** Preload 2 videos ahead of the current position. Previous video stays loaded in DOM for instant back-swipe. ~3-4 video elements in DOM at once
- **D-05:** Mute state persists across swipes — if user unmuted, next video plays with sound too. Global mute toggle via Zustand store (TikTok/Reels behavior)

### Buffering indicator
- **D-06:** Centered white spinner on black background when video is not yet ready. No text label. Disappears when video starts playing
- **D-07:** Same spinner overlay for both initial load and mid-playback stalls — consistent behavior, no special stall indicator

### End-of-feed state
- **D-08:** Minimal text only — clean black screen with centered white text: "You've seen everything". No buttons, no illustrations, no action prompts
- **D-09:** Dead end — end-of-feed slide blocks further swiping up. User can only swipe back down. Matches FEED-06: "no further swipes advance"

### Claude's Discretion
- Swiper.js configuration details (speed, resistance, threshold values)
- Spinner animation style and size (CSS or SVG)
- Zustand store shape for feed state (current index, video list, mute state)
- TanStack Query `useInfiniteQuery` configuration (page size, stale time, refetch)
- How to manage multiple `<video>` elements (Swiper slides with lazy loading vs manual DOM management)
- Intersection Observer usage for play/pause as slides enter/exit viewport
- Component decomposition (Feed container, Slide wrapper, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, constraints (mobile-first, static content only for m1)
- `.planning/REQUIREMENTS.md` — FEED-01 through FEED-06 acceptance criteria
- `.planning/ROADMAP.md` §Phase 3 — Success criteria (snap swipe, preload, buffering indicator, end-of-feed)

### Stack research
- `.planning/research/STACK.md` — Swiper.js 11 for vertical swipe, Zustand 5 for state, TanStack Query 5 for data fetching
- `.planning/research/ARCHITECTURE.md` — Component boundaries, feed architecture patterns

### Prior phase context
- `.planning/phases/02-video-player-core/02-CONTEXT.md` — VideoPlayer component decisions (overlay style, controls, tap behavior)

### Backend integration
- `packages/shared/src/types/video.ts` — VideoMeta interface (id, filename, title, duration, mimeType, size)
- `packages/backend/src/routes/feed.ts` — Feed API returns `{ data: { items, nextCursor }, meta: { total } }`
- `packages/backend/src/routes/video.ts` — Video files served at `/video/{filename}` via @fastify/static

### Frontend integration
- `packages/frontend/src/components/VideoPlayer/VideoPlayer.tsx` — Existing single-video player to wrap in feed slides
- `packages/frontend/src/hooks/useVideoPlayer.ts` — Play/pause/mute hook (needs per-slide adaptation)
- `packages/frontend/src/hooks/useVideoProgress.ts` — Progress bar hook
- `packages/frontend/src/api/feedApi.ts` — Current `fetchFeed(limit)` function (needs cursor/infinite query upgrade)
- `packages/frontend/src/lib/resolveVideoUrl.ts` — URL resolution abstraction
- `packages/frontend/src/App.tsx` — Current single-video app (needs feed container replacement)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `VideoPlayer` component — renders single video with mute button, progress bar, pause flash. Will be wrapped as individual Swiper slides
- `useVideoPlayer` hook — manages play/pause/mute state for a single video element. Mute state will move to Zustand; play/pause stays per-video
- `useVideoProgress` hook — tracks video progress for the progress bar. Reusable per-slide
- `fetchFeed` API — fetches feed with limit parameter. Needs cursor support for infinite query
- `resolveVideoUrl` — abstracts video URL construction. Reusable as-is

### Established Patterns
- TanStack Query for data fetching (already configured with QueryClient provider)
- Vite proxy for `/feed` and `/video/*` routes to backend on :3000
- Tailwind CSS with `fullscreen-container` class for 100dvh mobile viewport
- Overlay controls are always visible (no auto-hide) — Phase 2 decision

### Integration Points
- `App.tsx` currently renders a single `VideoPlayer` — will be replaced with Swiper feed container
- Feed API already supports cursor pagination via `nextCursor` — frontend just needs to use it
- Global mute state needs to be lifted from `useVideoPlayer` hook to Zustand store

</code_context>

<specifics>
## Specific Ideas

- Swipe feel should match TikTok — decisive snap, not exploratory drag
- Buffering spinner matches the minimal overlay aesthetic from Phase 2 (no text labels, just clean icons)
- End-of-feed is intentionally minimal — "You've seen everything" is the anti-infinite-scroll statement that aligns with the product's anti-algorithm identity

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-feed-navigation*
*Context gathered: 2026-04-02*
