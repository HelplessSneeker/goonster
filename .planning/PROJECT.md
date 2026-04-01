# Goonster

## What This Is

A mobile-first short-form video player that aggregates content shared by friends from TikTok, Instagram Reels, and YouTube Shorts into a single, friend-curated feed. Instead of an algorithm deciding what you watch, your feed is built from what your friends actually share.

## Core Value

A vertical-swipe video feed that plays content your friends chose to share — no algorithm, just people you trust.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Mobile-first web app with vertical swipe video feed
- [ ] Full-screen autoplay and loop for short-form videos
- [ ] Backend serves static video files via API
- [ ] Smooth swipe-to-next navigation between videos
- [ ] Responsive design optimized for mobile viewports

### Out of Scope

- Link sharing / URL ingestion — future milestone, after player is solid
- Video extraction from platforms (TikTok, Reels, Shorts) — future milestone, complex platform integration
- Friend/social mechanics (accounts, following, sharing) — future milestone, requires auth and social graph
- User authentication — not needed for static video playback
- Video upload — v1 uses pre-existing static files only
- Algorithm or recommendation engine — fundamentally against the product vision

## Context

- **Product vision:** Anti-algorithm video feed. Friends share links from major short-form platforms, Goonster extracts and aggregates the videos into one feed.
- **Milestone 1 focus:** Get the video player experience right with static files. No social features, no extraction — just a buttery vertical swipe feed.
- **Future path:** Web app first, then wrap or rebuild as native mobile app via framework (React Native, Flutter, or Capacitor — TBD based on research).
- **Tech direction:** Node/TypeScript backend. Frontend framework TBD (research will inform).
- **Storage evolution:** Static files on disk for v1, plan architecture to support cloud storage (S3/GCS) in future milestones.

## Constraints

- **Tech stack (backend)**: Node/TypeScript — user preference
- **Mobile-first**: Web app must work excellently on mobile viewports; desktop is secondary
- **Static content only (m1)**: No upload, no extraction, no external API calls — serve files from disk
- **Future mobile**: Architecture choices should not preclude wrapping as native app later

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Node/TypeScript backend | User preference, JS everywhere | — Pending |
| Mobile framework deferred | Research needed, not blocking m1 | — Pending |
| Static files for m1 | Simplify scope, focus on player UX | — Pending |
| No algorithm by design | Core product differentiator — friend-curated feed | — Pending |

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
*Last updated: 2026-04-01 after initialization*
