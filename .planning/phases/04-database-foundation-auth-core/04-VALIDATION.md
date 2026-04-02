---
phase: 4
slug: database-foundation-auth-core
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-02
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.2 |
| **Config file (backend)** | `packages/backend/vitest.config.ts` |
| **Config file (frontend)** | `packages/frontend/vite.config.ts` (vitest runs via vite) |
| **Quick run command** | `pnpm --filter backend test --run` |
| **Full suite command** | `pnpm -r run test --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter backend test --run`
- **After every plan wave:** Run `pnpm -r run test --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | INFRA-01 | smoke | `drizzle-kit migrate` then `psql -c "\dt"` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | INFRA-05 | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | AUTH-01 | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | AUTH-02 | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 1 | AUTH-03 | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-04 | 02 | 1 | AUTH-04 | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 2 | INFRA-02 | integration | `pnpm --filter backend test --run -- feed.test.ts` | ✅ extend | ⬜ pending |
| 04-03-02 | 03 | 2 | INFRA-03 | unit | `pnpm --filter frontend test --run -- App.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `packages/backend/tests/auth.test.ts` — stubs for INFRA-02, INFRA-05, AUTH-01 through AUTH-04
- [ ] `packages/frontend/src/__tests__/App.test.tsx` — stubs for INFRA-03 route rendering
- [ ] `packages/backend/.env.test` — test DATABASE_URL pointing to test database
- [ ] `docker-compose.yml` at repo root — PostgreSQL for integration tests

*Integration tests for auth require a real database. Consider better-auth's memory adapter for unit tests and a dedicated test PostgreSQL for integration.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Floating label animation | D-03 | CSS animation visual | Open /login at 375px, focus email field, verify label floats above |
| Dark background + light card | D-02 | Visual design | Open /login, verify dark bg with light centered card |
| Button spinner on submit | D-08 | Visual + timing | Click login, verify spinner appears and button disables |
| Silent redirect on 401 | D-13 | UX flow | Let session expire, make API call, verify quiet redirect to /login |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
