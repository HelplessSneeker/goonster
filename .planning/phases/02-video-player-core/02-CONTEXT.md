# Phase 2: Video Player Core - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Single-video player component with all iOS Safari constraints addressed. Video plays fullscreen in vertical format on a real mobile device with mute control, tap-to-pause, loop, and progress bar. No swipe navigation, no feed scrolling — that's Phase 3.

</domain>

<decisions>
## Implementation Decisions

### Control overlay
- **D-01:** Mute/unmute button positioned in the bottom-right corner of the video (TikTok-style, thumb-reachable)
- **D-02:** All overlay controls (mute button, progress bar) are always visible — no auto-hide behavior
- **D-03:** Thin progress bar at the very bottom edge of the video area (TikTok/Reels style)

### Tap & pause interaction
- **D-04:** Tapping the video body toggles play/pause; tapping the mute button only toggles audio — exclusive tap zones, no overlap
- **D-05:** On pause, a large semi-transparent play icon appears centered, flashes briefly (~0.5s), then fades out. Video stays paused with a clean screen until tapped again to resume.

### Non-standard video handling
- **D-06:** All videos display with `object-fit: cover` regardless of aspect ratio — 9:16 fills perfectly, non-standard ratios get cropped to fill the screen. Consistent immersive feel prioritized over showing all content.

### Frontend scaffold
- **D-07:** Vite dev server proxies `/feed` and `/video/*` requests to Fastify backend on :3000 — no CORS configuration needed during development
- **D-08:** Local React state only (useState/useRef) for playback state, mute, progress. No Zustand in this phase — add global store in Phase 3 when feed state matters.

### Claude's Discretion
- Component file organization within `/packages/frontend/src/`
- Tailwind CSS configuration and utility patterns
- React + Vite + Tailwind scaffold details (tsconfig, vite.config, etc.)
- Intersection Observer vs other approaches for play/pause triggering
- Progress bar color, thickness, and animation
- Mute button icon style and size
- Play icon appearance (size, opacity, fade animation timing)
- Testing setup (Vitest + Testing Library configuration)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` -- Core value, constraints (mobile-first, static content only for m1)
- `.planning/REQUIREMENTS.md` -- PLAY-01 through PLAY-06 and MOBL-01 through MOBL-04 acceptance criteria
- `.planning/ROADMAP.md` SS Phase 2 -- Success criteria (iPhone fullscreen, mute toggle, tap-to-pause, loop, progress bar, single-video constraint)

### Stack research
- `.planning/research/STACK.md` -- React 19 + Vite 8 + Tailwind 4 confirmed; Swiper.js 11 for Phase 3
- `.planning/research/ARCHITECTURE.md` -- Component boundaries, VideoStore abstraction

### Backend integration
- `packages/shared/src/types/video.ts` -- VideoMeta interface (id, filename, title, duration, mimeType, size)
- `packages/backend/src/routes/feed.ts` -- Feed API returns `{ data: { items, nextCursor }, meta: { total } }`
- `packages/backend/src/routes/video.ts` -- Video files served at `/video/{filename}` via @fastify/static

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `packages/shared/src/types/video.ts` -- VideoMeta type shared between frontend and backend
- Backend already serves video files with HTTP 206 range requests via @fastify/static

### Established Patterns
- Monorepo with pnpm workspaces: `/packages/backend`, `/packages/shared`, `/packages/frontend` (to create)
- Zod for runtime validation on backend; frontend types from shared package
- Fastify plugin pattern for route registration

### Integration Points
- Frontend fetches feed from `GET /feed?limit=1` (single video for Phase 2)
- Video files served at `GET /video/{filename}` with range request support
- Video metadata available at `GET /video/:id/meta`
- VideoMeta.filename used to construct video URL

</code_context>

<specifics>
## Specific Ideas

- Controls should feel like TikTok — mute button bottom-right, thin progress bar at very bottom edge
- Pause feedback: brief flash of large play icon then fade to clean screen (not persistent overlay)

</specifics>

<deferred>
## Deferred Ideas

None -- discussion stayed within phase scope

</deferred>

---

*Phase: 02-video-player-core*
*Context gathered: 2026-04-01*
