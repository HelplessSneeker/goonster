---
task_id: 260402-ewv
type: quick
description: Add a dev script to the monorepo root that starts backend + frontend concurrently
completed: "2026-04-02"
duration: ~2 minutes
tasks_completed: 1
tasks_total: 1
files_modified: 1
key_files:
  modified:
    - package.json
decisions:
  - Used shell & backgrounding instead of adding concurrently/npm-run-all dependency
tags: [dx, scripts, monorepo]
---

# Quick Task 260402-ewv Summary

**One-liner:** Added `pnpm dev` and `pnpm dev:frontend` to root package.json using shell backgrounding to run backend and frontend concurrently with no new dependencies.

## What Was Done

Added two scripts to the monorepo root `package.json`:

- `"dev"`: Runs backend and frontend concurrently using shell `&` backgrounding — `pnpm --filter backend dev & pnpm --filter frontend dev`
- `"dev:frontend"`: Mirrors the existing `dev:backend` pattern — `pnpm --filter frontend dev`

## Final Scripts Object

```json
{
  "dev": "pnpm --filter backend dev & pnpm --filter frontend dev",
  "dev:backend": "pnpm --filter backend dev",
  "dev:frontend": "pnpm --filter frontend dev",
  "test": "pnpm --filter backend test --run",
  "typecheck": "pnpm -r run typecheck"
}
```

## Commits

| Hash | Description |
|------|-------------|
| ee70077 | chore(260402-ewv): add dev and dev:frontend scripts to root package.json |

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- package.json modified: FOUND
- Commit ee70077: FOUND
- All three dev scripts (dev, dev:backend, dev:frontend) verified present via node verification command
