---
phase: 2
slug: video-player-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `packages/frontend/vitest.config.ts` (Wave 0 — does not exist yet) |
| **Quick run command** | `pnpm --filter frontend test --run` |
| **Full suite command** | `pnpm --filter frontend test --run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter frontend test --run`
- **After every plan wave:** Run `pnpm --filter frontend test --run && pnpm typecheck`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | PLAY-01 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | PLAY-02 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | PLAY-03 | unit | `pnpm --filter frontend test --run tests/MuteButton.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | PLAY-04 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-05 | 01 | 1 | PLAY-05 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-06 | 01 | 1 | PLAY-06 | unit | `pnpm --filter frontend test --run tests/ProgressBar.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-07 | 01 | 1 | MOBL-01 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-08 | 01 | 1 | MOBL-02 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-09 | 01 | 1 | MOBL-03 | unit | `pnpm --filter frontend test --run tests/MuteButton.test.tsx` | ❌ W0 | ⬜ pending |
| 02-01-10 | 01 | 1 | MOBL-04 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/frontend/vitest.config.ts` — test environment config (jsdom)
- [ ] `packages/frontend/tests/setup.ts` — @testing-library/jest-dom setup
- [ ] `packages/frontend/tests/VideoPlayer.test.tsx` — covers PLAY-01 through PLAY-05, MOBL-01, MOBL-02, MOBL-04
- [ ] `packages/frontend/tests/ProgressBar.test.tsx` — covers PLAY-06
- [ ] `packages/frontend/tests/MuteButton.test.tsx` — covers PLAY-03, MOBL-03
- [ ] Framework install: `pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Video autoplays muted on real iPhone | MOBL-02 | JSDOM cannot simulate real iOS autoplay policy | Open app URL on iPhone Safari, verify video plays without interaction |
| Video fills screen without letterboxing | PLAY-01 | JSDOM has no viewport rendering | Open on iPhone, verify no black bars, address bar doesn't crop video |
| Touch target ≥44px feels correct on device | MOBL-03 | Pixel dimensions need real DPI | Tap mute button on iPhone, verify easy to hit with thumb |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
