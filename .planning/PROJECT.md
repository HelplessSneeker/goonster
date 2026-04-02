# Goonster

## What This Is

A mobile-first short-form video player that aggregates content shared by friends from TikTok, Instagram Reels, and YouTube Shorts into a single, friend-curated feed. v1.0 delivers a buttery vertical swipe feed playing static video files with full iOS Safari compatibility.

## Core Value

A vertical-swipe video feed that plays content your friends chose to share — no algorithm, just people you trust.

## Requirements

### Validated

- ✓ Video plays fullscreen in vertical (9:16) format with correct mobile viewport — v1.0
- ✓ First video autoplays muted on page load without user interaction — v1.0
- ✓ Mute/unmute control, tap-to-pause, auto-loop, progress bar — v1.0
- ✓ Vertical swipe navigation with snap animation — v1.0
- ✓ Next video preloaded, buffering indicator, end-of-feed state — v1.0
- ✓ HTTP 206 range streaming, cursor-paginated feed API — v1.0
- ✓ Storage abstraction interface (DiskVideoStore, cloud-swappable) — v1.0
- ✓ iOS Safari playsInline, 100dvh viewport, single-video constraint — v1.0

### Active

None — planning next milestone.

### Out of Scope

- Link sharing / URL ingestion — future milestone, after player is solid
- Video extraction from platforms (TikTok, Reels, Shorts) — future milestone, complex platform integration
- Friend/social mechanics (accounts, following, sharing) — future milestone, requires auth and social graph
- User authentication — not needed for static video playback
- Video upload — v1 uses pre-existing static files only
- Algorithm or recommendation engine — fundamentally against the product vision
- Offline mode — real-time friend-curated feed is core value
- Push notifications per share — notification fatigue; anti-pattern for this product's ethos

## Context

Shipped v1.0 with 1,554 LOC TypeScript across 3 packages (shared, backend, frontend).
Tech stack: React 19 + Vite 8 + Fastify 5 + Tailwind 4 + Swiper.js 11 + Zustand 5 + TanStack Query 5.
pnpm monorepo with shared types package.
79 tests (28 backend, 18 video player, 33 feed) all passing.
10 human verification items pending (real-device browser testing).
9 tech debt items documented in milestone audit (none blocking).

## Constraints

- **Tech stack (backend)**: Node/TypeScript — user preference
- **Mobile-first**: Web app must work excellently on mobile viewports; desktop is secondary
- **Static content only (m1)**: No upload, no extraction, no external API calls — serve files from disk
- **Future mobile**: Architecture choices should not preclude wrapping as native app later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Node/TypeScript backend | User preference, JS everywhere | ✓ Good — Fastify 5 + TypeScript monorepo |
| React 19 + Vite 8 frontend | Largest ecosystem, best React Native upgrade path | ✓ Good — concurrent rendering, fast HMR |
| Fastify 5 over Express | 2-3x performance, native TypeScript, built-in schema validation | ✓ Good — @fastify/static handles HTTP 206 natively |
| Swiper.js over CSS scroll-snap | Battle-tested touch gestures, iOS Safari momentum handling | ✓ Good — eliminated snap jank issues |
| Zustand over Redux | Minimal boilerplate for simple feed state (index, mute) | ✓ Good — clean global mute sync |
| VideoStore abstraction | Cloud-swappable later without route handler changes | ⚠️ Revisit — @fastify/static bypasses store for streaming |
| Static files for m1 | Simplify scope, focus on player UX | ✓ Good — DiskVideoStore + fixtures |
| Mobile framework deferred | Research needed, not blocking m1 | — Pending |
| No algorithm by design | Core product differentiator — friend-curated feed | — Pending |
| resolveVideoUrl abstraction | Single function to swap local/cloud URLs | ✓ Good — clean separation |
| Global mute in Zustand store | Mute state persists across swipes | ✓ Good — natural UX |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-02 after v1.0 milestone*
