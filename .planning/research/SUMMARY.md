# Project Research Summary

**Project:** Goonster
**Domain:** Mobile-first short-form vertical video player (friend-curated, anti-algorithm)
**Researched:** 2026-04-01
**Confidence:** HIGH (player core, pitfalls) / MEDIUM (social/aggregation layer)

## Executive Summary

Goonster is a friend-curated short-form video player — a web app that aggregates TikTok, Instagram Reels, and YouTube Shorts links shared by friends into a single vertical swipe feed, explicitly rejecting algorithmic recommendations in favor of social curation. The v1 product is simpler than it sounds: a static-file-backed video player with Swiper.js swipe navigation, built on React 19 + Vite 8 + Fastify 5. The entire social layer (auth, friend graph, video extraction) is deferred; the first milestone is just a polished player that proves the core interaction loop. This is the correct approach — the video player has zero dependencies on any social features, and platform video extraction (especially TikTok and Instagram) is fragile enough to warrant its own milestone.

The recommended stack is modern and well-suited: React 19 with TanStack Query for server state, Zustand for feed state, Tailwind CSS v4 for mobile-first styling, and a pnpm monorepo with `packages/web` and `packages/api`. The backend is a Fastify 5 Node server with `@fastify/static` for range-request-aware video serving. The key architectural seam is a `VideoStore` interface that abstracts disk vs. S3 from day one — this is a small investment that eliminates an expensive refactor when storage moves to cloud in a later milestone. The feed uses cursor-based pagination and a fixed pool of 3-5 DOM video elements with explicit buffer cleanup to avoid tab crashes on mobile.

The highest-risk area is iOS Safari, which has a cluster of well-documented but easily missed constraints: `playsinline` is mandatory (without it every video goes fullscreen), `100dvh` must replace `100vh` (otherwise the first slide overflows behind the browser bar), CSS scroll snap flicks to the end of the list on fast swipes without `scroll-snap-stop: always`, and iOS enforces a single concurrent playing video at the hardware level. All eight critical pitfalls identified in research are Phase 1 issues — they must be addressed in the player foundation before any social features are considered. The research also flags a clear anti-feature set to resist: no algorithm, no like counts, no infinite scroll without an end state.

## Key Findings

### Recommended Stack

The core stack is React 19 + Vite 8 + TypeScript 5 on the frontend, Fastify 5 on the backend, with Tailwind CSS v4 for styling. Supporting libraries are Swiper.js 11 (iOS-safe swipe container), Zustand 5 (feed state), TanStack Query 5 (server state + infinite scroll), and Zod 3 (backend validation). All major version choices are intentional — Fastify 4 reaches EOL June 2025, Vite requires Node 20.19+, and Tailwind v4's CSS-first config eliminates the PostCSS conflict with React 19. pnpm workspace monorepo with two packages (`packages/web`, `packages/api`) is the right structure for this scope.

**Core technologies:**
- React 19.2.x: UI framework — best web-to-native upgrade path; Concurrent rendering handles video preloading cleanly
- Vite 8.x: Build tool — fast HMR, `--host` flag for real-device testing during development
- Fastify 5.8.x: Node HTTP server — 2-3x faster than Express, built-in TypeScript, `@fastify/static` handles range requests natively
- Tailwind CSS 4.x: Styling — CSS-first config, mobile-first utilities (`h-dvh`, `aspect-ratio`) map directly to short-form video UI
- Swiper.js 11.x: Swipe container — battle-tested iOS touch gesture handling; CSS scroll-snap alone has known momentum bugs on iOS Safari
- Zustand 5.x: Feed state — lightweight global store for active index, mute state, and prefetch queue
- TanStack Query 5.x: Server state — `useInfiniteQuery` is the right primitive for paginated video feeds

**Critical version requirement:** Node 22.x LTS. Vite 8 requires Node ≥20.19; use 22 for long-term stability.

### Expected Features

The v1 product is a player, not a social network. The feature set splits cleanly into a self-contained player core (no social dependencies) and a deferred social layer (requires auth as the unlock). Research confirms this is the correct ordering — the player has zero dependencies on social features, while every social feature depends on auth.

**Must have (table stakes — v1 player):**
- Fullscreen vertical video player with 9:16 aspect ratio and `object-fit: cover`
- Autoplay muted on load — first frame must play immediately; unmuted autoplay is universally blocked
- Visible mute/unmute control — required for audio; browsers enforce muted start
- Swipe up/down navigation — the defining interaction of the format
- Video looping — no loop is a dead end that kills engagement
- Progress bar overlay — users expect temporal context even on short clips
- Buffering/loading indicator — prevents "is this broken?" perception
- Preload next video — eliminates perceived gap between swipes
- Finite feed end state — "You've seen everything" — free to implement with static files; counter-positions against every competitor

**Should have (competitive — v1.x post-player validation):**
- User authentication — the unlock for all social features
- Video URL submission — let friends share TikTok/Reels/Shorts links
- YouTube Shorts extraction — safest platform to start (official YouTube Data API v3 exists)
- "Who shared this" attribution — low complexity post-auth; high perceived value

**Defer (v2+):**
- TikTok extraction — high complexity, aggressively rate-limited, treat as integration problem not product feature
- Instagram Reels extraction — most restrictive platform; likely requires third-party scraping service
- Friend invitation and social graph construction
- Digest notifications
- Native mobile app wrapper (Capacitor or React Native)

**Anti-features to resist:** Algorithmic recommendations, like/reaction counts, trending/explore sections, infinite scroll without end state, video upload/creation, per-video comment threads.

### Architecture Approach

The architecture is a two-layer monorepo: a React SPA client with a Fastify Node server. The single most important architectural decision is the `VideoStore` interface, which abstracts all file I/O behind a `listVideos() / createReadStream() / getSize()` contract — the disk implementation is trivial in M1, but the interface discipline means cloud storage migration is a swap, not a rewrite. On the client side, the `feedStore` (Zustand) is the single source of truth: components are dumb, the store drives the player and prefetch manager. Feed pagination must use cursors from day one — offset pagination breaks when items are inserted in later milestones.

**Major components:**
1. FeedShell — scroll/swipe container; CSS scroll-snap + Swiper.js; keeps only 3-5 DOM nodes active via virtualization
2. VideoPlayer — thin wrapper over native `<video>`; enforces single-active-video invariant; emits events back to store
3. Prefetch Manager — buffers N+1 and N+2 ahead of active index using `preload="auto"` + `src` assignment (never `.play()`); triggers next-page fetch when buffer is low
4. feedStore (Zustand) — owns `activeIndex`, `items[]`, `nextCursor`, `prefetchQueue[]`; all components read from here
5. VideoStore interface (Fastify) — disk in M1, S3/GCS swap in M2+; never let route handlers import `fs` directly
6. Feed API (`GET /feed`) — cursor-paginated ordered metadata list
7. Video streaming route (`GET /video/:id`) — HTTP 206 Partial Content range requests; required for seek and iOS Safari playback

**Build order dictated by dependencies:**
1. VideoStore interface + disk implementation
2. HTTP 206 video streaming route (test with curl before writing any UI)
3. Feed metadata API
4. VideoPlayer component (against single hardcoded URL)
5. FeedShell + Feed State integration
6. Prefetch Manager (enhancement layer, build last)

### Critical Pitfalls

All eight critical pitfalls belong to Phase 1. They are well-documented, iOS Safari is the primary vector, and several have HIGH-cost recovery if discovered late.

1. **Missing `playsinline` on iOS Safari** — every `<video>` must have `playsinline` and `webkit-playsinline` unconditionally; without it iOS forces fullscreen takeover of the entire feed; add on day one of video element implementation
2. **CSS scroll snap flick-to-end on iOS** — `scroll-snap-type: y mandatory` alone lets fast flicks skip to end of list on WebKit; add `scroll-snap-stop: always` to every snap child; test with fast flick on a real iPhone (not Simulator)
3. **`100vh` breaks mobile layout** — `100vh` overflows behind browser chrome on first load; replace with `100dvh` + `-webkit-fill-available` fallback; non-negotiable for a mobile-first app
4. **Video element memory leaks** — removing a `<video>` from the DOM does not release buffered media; call `video.removeAttribute('src'); video.load()` before unmounting; use a fixed pool of 3-5 elements rather than creating/destroying on each swipe
5. **iOS single concurrent video limit** — iOS hardware enforces one playing stream; preload by assigning `src` and setting `preload="auto"`, never by calling `.play()` on a non-active element; redesigning this after the fact costs 1-3 days
6. **Server must return HTTP 206 Partial Content** — without range request support, seeking is broken and iOS Safari may refuse to play the video at all; `@fastify/static` handles this by default — do not disable it
7. **Autoplay `play()` rejection handled silently** — `video.play()` returns a rejected Promise on unmuted or ungestured mobile load; always `.catch()` the promise and show a play prompt to the user
8. **Intersection Observer race condition** — IO callbacks are async; on fast swipes, callbacks can fire for off-screen elements; gate `play()` with a re-check of `intersectionRatio >= 0.9`; combine with Page Visibility API for tab switching

## Implications for Roadmap

Based on research — particularly the clean dependency boundary between the player core and the social layer, the architecture's prescribed build order, and the concentration of all critical pitfalls in Phase 1 — a three-phase structure is recommended for v1 with a clear v2 social milestone.

### Phase 1: Player Foundation

**Rationale:** The video player has zero dependencies on social features. All eight critical pitfalls are in this phase. The build order from architecture research (storage → streaming route → metadata API → VideoPlayer → FeedShell → Prefetch) is clear. This phase delivers a working, iOS-safe swipe feed on static files.

**Delivers:** A fully functional vertical swipe feed serving local video files; the core interaction loop validated; all iOS pitfalls addressed.

**Features addressed:**
- Fullscreen vertical playback, autoplay muted, mute/unmute control
- Swipe navigation, video looping, progress bar, buffering indicator
- Preload of next video, finite feed end state

**Pitfalls to address in this phase (all of them):**
- `playsinline` + `webkit-playsinline` in initial video element template
- `100dvh` in layout CSS from the start
- `scroll-snap-stop: always` in swipe container
- VideoStore interface for disk I/O (prevents anti-pattern of scattered `fs` calls)
- HTTP 206 range request handling via `@fastify/static` (test with curl before UI work)
- Video element pool (3-5 elements) with explicit `removeAttribute('src'); load()` cleanup
- Single-active-video invariant enforced at store level
- Intersection Observer threshold gate + Page Visibility API integration

**Research flag:** Standard patterns — well-documented domain; no additional research phase needed.

### Phase 2: Auth and Social Foundation

**Rationale:** Auth is the unlock for every social feature. Once the player is validated, add user accounts and the simplest possible sharing mechanic. YouTube Shorts uses an official API (YouTube Data API v3) and is the safest first extraction target. "Who shared this" attribution is low-effort post-auth.

**Delivers:** User accounts; video URL submission by friends; YouTube Shorts extraction; "who shared this" on each feed card; the feed is now dynamically populated rather than static.

**Features addressed:** User authentication, video URL submission, YouTube Shorts extraction, "who shared this" attribution.

**Stack additions:** Auth library (JWT or session-based; research needed), database migration from JSON flat file to SQLite or PostgreSQL.

**Research flag:** Needs phase research — YouTube Data API v3 quota management and auth library choice (Lucia, Better Auth, or Fastify JWT) warrant a focused research pass before implementation.

### Phase 3: Platform Extraction Expansion

**Rationale:** TikTok and Instagram extraction are explicitly the highest-risk, most complex integrations in the feature research. They should be isolated as background worker problems, not product features. Only pursue after YouTube Shorts is stable and the social graph has users who demand them.

**Delivers:** TikTok video extraction, Instagram Reels extraction; multi-platform feed fully realized.

**Features addressed:** TikTok extraction, Instagram Reels extraction.

**Pitfall to avoid:** Treat each extractor as an isolated integration — rate limiting, session management, and anti-scraping measures change without notice; never couple extractors to the player or feed rendering pipeline.

**Research flag:** Needs phase research — platform scraping legality, rate limit strategies, third-party scraping services (Scrapfly, Apify), and stability of each platform's extraction surface are all live questions that need current research at the time of implementation.

### Phase 4: Native Mobile and Scale

**Rationale:** Defer until web product-market fit is confirmed. Capacitor wraps the existing Vite/React app with minimal changes. Cloud storage migration (S3 swap) is a one-implementation change enabled by the VideoStore interface established in Phase 1.

**Delivers:** Native mobile app (Capacitor wrapper); cloud video storage (S3/GCS); CDN for video delivery.

**Architecture leverage:** VideoStore interface enables disk → S3 swap without touching routes or client. `resolveVideoUrl(id)` abstraction means CDN URL swap is a single function change.

**Research flag:** Standard patterns for cloud storage migration (well-documented). Capacitor integration may need a focused research pass on iOS WKWebView video constraints at implementation time.

### Phase Ordering Rationale

- **Player before social** because the player has zero dependencies on social features; the reverse creates artificial coupling and delays learning whether the core UX is compelling.
- **Auth before extraction** because every social feature (attribution, friend feed, curation) depends on identity; building extraction first produces an anonymous feed with no social value.
- **YouTube before TikTok/Instagram** because YouTube Data API v3 is a legitimate, stable, quota-controlled integration; TikTok and Instagram are scraping problems with legal ambiguity and active countermeasures.
- **Web before native** because the Capacitor wrapper is a thin layer over a working web app; validating UX on web first avoids building native infrastructure for a product with unvalidated interaction design.
- **VideoStore abstraction in Phase 1** because every phase depends on it; retrofitting it in Phase 4 requires touching every route handler.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2:** Auth library selection (Lucia, Better Auth, Fastify JWT), JWT vs. session strategy, YouTube Data API v3 quota limits and response schema — current landscape for Node/Fastify auth has moved fast in 2025-2026.
- **Phase 3:** TikTok extraction stability, Instagram Graph API restrictions, third-party scraping service comparison (Scrapfly, Apify, etc.), legal considerations for scraping ToS-restricted platforms.
- **Phase 4 (Capacitor):** iOS WKWebView video constraints in 2026 — confirm `playsinline` behavior in Capacitor context; verify HTTP server plugin is still required or if native video handling has improved.

Phases with standard patterns (skip research-phase):
- **Phase 1:** Extremely well-documented domain; all pitfalls are known and solutions are established; build order is clear from architecture research.
- **Phase 4 (cloud storage):** AWS S3 + Fastify integration is a standard pattern; VideoStore interface makes the migration mechanical.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Core choices (React 19, Vite 8, Fastify 5, Tailwind 4) verified against official docs; version compatibility matrix confirmed; Swiper.js iOS behavior verified via community and official sources |
| Features | HIGH (player) / MEDIUM (social) | Player feature set is well-established by the category; social/aggregation features are correct in direction but platform extraction complexity can change without notice |
| Architecture | HIGH | Patterns (HTTP 206, storage abstraction, cursor pagination, single-active-video invariant) are verified against official sources and production implementations; build order is internally consistent |
| Pitfalls | HIGH | iOS/WebKit pitfalls verified against WebKit official blog, Apple developer docs, MDN, and official Chromium/WebKit bug trackers; memory leak pattern verified in official bug tracker |

**Overall confidence:** HIGH for Phase 1 and Phase 2 foundation; MEDIUM for Phase 3 (platform extraction fragility is inherent to the domain).

### Gaps to Address

- **Auth library selection:** Research did not make a firm recommendation between Lucia Auth, Better Auth, and Fastify JWT. This should be the first decision in Phase 2 planning — it affects database schema and session handling for all social features.
- **Database choice for M2+:** Research recommends JSON flat file for M1 and PostgreSQL for M2+, but did not evaluate SQLite as an intermediate step. SQLite with Drizzle ORM may be appropriate between static files and a full Postgres deployment.
- **Video format handling:** Research flagged hardcoding MP4 as acceptable for M1 static files. As platform extraction is added in Phase 3, format normalization (transcoding to a consistent format) will be needed. This is unscoped.
- **iOS Capacitor video behavior (Phase 4):** The `playsinline` pitfall in a Capacitor WKWebView context has a known issue history; needs verification at implementation time as Capacitor's iOS HTTP server plugin behavior may have changed.
- **TikTok legal landscape:** Extracting TikTok content without authorization sits in a grey zone that changes with enforcement cycles. This requires a legal/ToS review at the start of Phase 3, not just a technical research pass.

## Sources

### Primary (HIGH confidence)
- https://webkit.org/blog/6784/new-video-policies-for-ios/ — `playsinline`, iOS autoplay, single-video constraints
- https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html — Apple iOS video considerations
- https://bugs.webkit.org/show_bug.cgi?id=162366 — WebKit official: iOS single concurrent video limit
- https://bugs.chromium.org/p/chromium/issues/detail?id=969049 — Chromium official: video memory leak on src replacement
- https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type — CSS scroll-snap spec behavior
- https://web.dev/articles/fast-playback-with-preload — Google official: video preload strategies
- https://www.bram.us/2020/05/06/100vh-in-safari-on-ios/ — `100vh` iOS viewport height, widely cited
- https://fastify.dev/docs/latest/ — Fastify v5 confirmed stable
- https://vite.dev/guide/ — Vite 8 Node requirement confirmed
- https://github.com/fastify/fastify-static — `@fastify/static` Range request support

### Secondary (MEDIUM confidence)
- https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025 — Video playback best practices
- https://react.dev/blog/2025/10/01/react-19-2 — React 19.2.x stable
- https://tailwindcss.com/blog/tailwindcss-v4 — Tailwind v4 release
- https://tanstack.com/query/v5/docs/framework/react/overview — TanStack Query v5
- https://betterstack.com/community/guides/scaling-nodejs/fastify-express/ — Fastify vs Express benchmark
- https://www.fastpix.io/blog/scalable-system-design-and-architecture-for-a-tiktok-like-app — TikTok-style architecture
- https://scrapfly.io/blog/posts/social-media-scraping — Social media scraping complexity 2026
- https://nextnative.dev/blog/capacitor-vs-react-native — Capacitor vs React Native 2025
- https://github.com/bvaughn/react-window/issues/290 — CSS scroll-snap flick bug on iOS (community-verified)
- https://arxiv.org/pdf/2209.02927 — Network-aware prefetching for short-form video

### Tertiary (LOW confidence, needs validation)
- https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide — PWA iOS limitations 2026 (vendor site)
- https://rene-otto.medium.com/autoplay-and-infinite-scroll-8607abe52bb7 — Dark patterns analysis (single author opinion)

---
*Research completed: 2026-04-01*
*Ready for roadmap: yes*
