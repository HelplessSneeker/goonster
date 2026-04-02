---
phase: 2
slug: video-player-core
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-04-01
updated: 2026-04-01
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `packages/frontend/vitest.config.ts` (Wave 0 — created in Plan 02-01 Task 1) |
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
| 02-01-01 | 01 | 1 | PLAY-01 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |
| 02-01-02 | 01 | 1 | PLAY-02 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |
| 02-01-03 | 01 | 1 | PLAY-03 | unit | `pnpm --filter frontend test --run tests/MuteButton.test.tsx` | W0 stub | pending |
| 02-01-04 | 01 | 1 | PLAY-04 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |
| 02-01-05 | 01 | 1 | PLAY-05 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |
| 02-01-06 | 01 | 1 | PLAY-06 | unit | `pnpm --filter frontend test --run tests/ProgressBar.test.tsx` | W0 stub | pending |
| 02-01-07 | 01 | 1 | MOBL-01 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |
| 02-01-08 | 01 | 1 | MOBL-02 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |
| 02-01-09 | 01 | 1 | MOBL-03 | unit | `pnpm --filter frontend test --run tests/MuteButton.test.tsx` | W0 stub | pending |
| 02-01-10 | 01 | 1 | MOBL-04 | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | W0 stub | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `packages/frontend/vitest.config.ts` — test environment config (jsdom) — **created in Plan 02-01 Task 1**
- [x] `packages/frontend/tests/setup.ts` — @testing-library/jest-dom setup — **created in Plan 02-01 Task 1**
- [x] `packages/frontend/tests/VideoPlayer.test.tsx` — stub with .todo tests — **created in Plan 02-01 Task 1, replaced with full tests in Plan 02-02 Task 2**
- [x] `packages/frontend/tests/ProgressBar.test.tsx` — stub with .todo tests — **created in Plan 02-01 Task 1, replaced with full tests in Plan 02-02 Task 2**
- [x] `packages/frontend/tests/MuteButton.test.tsx` — stub with .todo tests — **created in Plan 02-01 Task 1, replaced with full tests in Plan 02-02 Task 2**
- [x] Framework install: `pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom` — **in Plan 02-01 Task 1 package.json**

---

## Nyquist Sampling Continuity

| Task Sequence | Verify Command | Has Test Execution |
|---------------|----------------|--------------------|
| 02-01 Task 1 (scaffold + stubs) | `typecheck && test --run` | Yes (3 stub tests) |
| 02-01 Task 2 (hooks + API) | `typecheck && test --run` | Yes (stubs still pass) |
| 02-02 Task 1 (components + resolveVideoUrl) | `typecheck && test --run` | Yes (stubs still pass) |
| 02-02 Task 2 (full tests) | `test --run` | Yes (full test suite) |
| 02-03 Task 1 (servers) | `curl retry loop` | N/A (integration check) |
| 02-03 Task 2 (human verify) | manual | N/A (checkpoint) |

No 3 consecutive tasks without test execution. Nyquist compliant.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Video autoplays muted on real iPhone | MOBL-02 | JSDOM cannot simulate real iOS autoplay policy | Open app URL on iPhone Safari, verify video plays without interaction |
| Video fills screen without letterboxing | PLAY-01 | JSDOM has no viewport rendering | Open on iPhone, verify no black bars, address bar doesn't crop video |
| Touch target >=44px feels correct on device | MOBL-03 | Pixel dimensions need real DPI | Tap mute button on iPhone, verify easy to hit with thumb |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
