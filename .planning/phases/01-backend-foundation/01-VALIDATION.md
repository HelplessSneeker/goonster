---
phase: 1
slug: backend-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-01
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file** | `packages/backend/vitest.config.ts` — Wave 0 creates this |
| **Quick run command** | `pnpm --filter backend test --run` |
| **Full suite command** | `pnpm --filter backend test --run --coverage` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter backend test --run`
- **After every plan wave:** Run `pnpm --filter backend test --run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | API-01 | integration | `pnpm --filter backend test --run tests/video.test.ts` | ❌ W0 | ⬜ pending |
| 01-01-02 | 01 | 1 | API-01 | integration | `pnpm --filter backend test --run tests/video.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-01 | 02 | 1 | API-02 | integration | `pnpm --filter backend test --run tests/feed.test.ts` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 1 | API-02 | integration | `pnpm --filter backend test --run tests/feed.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 1 | API-03 | integration | `pnpm --filter backend test --run tests/feed.test.ts` | ❌ W0 | ⬜ pending |
| 01-03-02 | 03 | 1 | API-03 | unit | `pnpm --filter backend test --run tests/feedService.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 1 | API-04 | integration | `pnpm --filter backend test --run tests/feed.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-02 | 04 | 1 | API-04 | unit | `pnpm --filter backend test --run tests/DiskVideoStore.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/backend/vitest.config.ts` — test config
- [ ] `packages/backend/tests/video.test.ts` — API-01 HTTP 206 coverage
- [ ] `packages/backend/tests/feed.test.ts` — API-02, API-03, API-04 coverage
- [ ] `packages/backend/tests/feedService.test.ts` — cursor stability unit tests
- [ ] `packages/backend/tests/DiskVideoStore.test.ts` — store unit tests
- [ ] `packages/backend/tests/fixtures/MockVideoStore.ts` — shared test helper
- [ ] Framework install: `pnpm add -D vitest @vitest/coverage-v8`

---

## Manual-Only Verifications

*All phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
