# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Static Video Player

**Shipped:** 2026-04-02
**Phases:** 3 | **Plans:** 8

### What Was Built
- Fastify 5 backend with HTTP 206 range streaming, cursor-paginated feed API, and VideoStore abstraction
- React 19 video player with fullscreen vertical playback, mute/pause controls, progress bar, and PauseFlash overlay
- Swiper.js vertical feed with preloading, buffering indicators, end-of-feed sentinel, and global mute via Zustand
- 79 automated tests across all three packages (28 backend, 18 player, 33 feed)
- Full human verification on desktop and mobile browsers

### What Worked
- **Strict dependency ordering** (backend → player → feed) meant each phase could be verified independently before building the next layer
- **Research-first planning** — stack decisions (React 19, Fastify 5, Swiper.js) were validated before coding, avoiding mid-phase pivots
- **Nyquist validation** on all 3 phases caught zero gaps — test coverage was built in during execution rather than bolted on
- **Quick task workflow** for tech debt cleanup kept the milestone scope clean while addressing debt iteratively
- **UI-SPEC design contracts** for phases 2 and 3 prevented design churn during implementation

### What Was Inefficient
- **SUMMARY frontmatter inconsistency** — phases 1 and 2 shipped without `requirements-completed` fields; required a follow-up quick task to fix metadata
- **VideoStore streaming bypass** — invested in `getSize()` and `createReadStream()` interface methods that @fastify/static never calls. The abstraction only covers `listVideos` in practice.
- **10 human verification items** accumulated across phases 2 and 3 — could have been consolidated into a single verification phase rather than two separate checkpoints
- **Orphaned endpoint** (`/video/:id/meta`) built but never consumed by frontend — wasted effort

### Patterns Established
- pnpm monorepo with `@goonster/shared` types package — cross-package type safety
- `resolveVideoUrl()` abstraction for URL generation — single swap point for cloud migration
- Zustand store for cross-component UI state (mute, active index)
- TanStack Query `useInfiniteQuery` for cursor-based feed pagination
- Intersection Observer pattern for video play/pause lifecycle

### Key Lessons
1. **Build the abstraction you actually call** — VideoStore's streaming methods are dead code because @fastify/static handles file serving directly. Design interfaces around real call sites, not imagined future ones.
2. **Consolidate human verification** — Two separate human checkpoint plans (02-03, 03-03) created scheduling friction. One end-of-milestone UAT phase would be more efficient.
3. **Fix metadata as you go** — SUMMARY frontmatter gaps accumulated and required a dedicated cleanup task. Enforce consistency during plan execution, not after.

### Cost Observations
- Model mix: ~70% opus, ~25% sonnet, ~5% haiku (estimated from agent types used)
- Timeline: 2 calendar days (2026-04-01 → 2026-04-02), 75 commits
- Notable: The entire v1.0 MVP shipped in 2 days with full test coverage and human verification

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Phases | Plans | Key Change |
|-----------|--------|-------|------------|
| v1.0 | 3 | 8 | Initial process — research → plan → execute → verify established |

### Cumulative Quality

| Milestone | Tests | Human Items | Tech Debt Items |
|-----------|-------|-------------|-----------------|
| v1.0 | 79 | 10 pending | 9 documented |

### Top Lessons (Verified Across Milestones)

1. Strict phase dependency ordering enables independent verification at each layer
2. Research-first stack decisions prevent mid-implementation pivots
