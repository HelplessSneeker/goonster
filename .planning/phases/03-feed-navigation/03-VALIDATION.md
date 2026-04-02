---
phase: 03
slug: feed-navigation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.x |
| **Config file** | `packages/frontend/vitest.config.ts` |
| **Quick run command** | `cd packages/frontend && pnpm test` |
| **Full suite command** | `cd packages/frontend && pnpm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `cd packages/frontend && pnpm test`
- **After every plan wave:** Run `cd packages/frontend && pnpm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | FEED-01 | unit | `pnpm test -- FeedContainer` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | FEED-02 | unit | `pnpm test -- FeedContainer` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | FEED-03 | unit | `pnpm test -- FeedContainer` | ❌ W0 | ⬜ pending |
| 03-01-04 | 01 | 1 | FEED-04 | unit | `pnpm test -- FeedSlide` | ❌ W0 | ⬜ pending |
| 03-01-05 | 01 | 1 | FEED-05 | unit | `pnpm test -- FeedSlide` | ❌ W0 | ⬜ pending |
| 03-01-06 | 01 | 1 | FEED-06 | unit | `pnpm test -- EndOfFeedSlide` | ❌ W0 | ⬜ pending |
| 03-01-07 | 01 | 1 | D-05 | unit | `pnpm test -- feedStore` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/__tests__/FeedContainer.test.tsx` — covers FEED-01, FEED-02, FEED-03, FEED-06 (allowSlideNext)
- [ ] `src/__tests__/FeedSlide.test.tsx` — covers FEED-04, FEED-05
- [ ] `src/__tests__/EndOfFeedSlide.test.tsx` — covers FEED-06 (text content)
- [ ] `src/__tests__/feedStore.test.ts` — covers D-05 (mute persistence)
- [ ] `src/__tests__/useFeed.test.ts` — covers useInfiniteQuery page flattening

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Swipe gesture snaps cleanly on iOS Safari | FEED-03 | Touch events not emulable in JSDOM | Open on iPhone, swipe up/down, verify 200-300ms snap |
| Preloaded video plays instantly after swipe | FEED-04 | Requires real network + video decode | Swipe to next video, observe <200ms playback start |
| Buffering spinner appears on slow connection | FEED-05 | Requires network throttling | DevTools > Network > Slow 3G, reload app |
| iOS Safari autoplay via Swiper gesture | N/A | Gesture-triggered .play() on iOS | Swipe to new slide on iPhone, verify autoplay works |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
