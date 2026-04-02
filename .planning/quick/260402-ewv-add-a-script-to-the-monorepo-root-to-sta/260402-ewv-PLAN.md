---
type: quick
task_id: 260402-ewv
description: Add a dev script to the monorepo root that starts backend + frontend concurrently
---

<objective>
Add a single `pnpm dev` command at the monorepo root that starts both the backend (Fastify on :3000) and frontend (Vite on :5173) concurrently with labeled output.

Purpose: Developer convenience — one command to run the full app.
Output: Updated root package.json with `dev` and `dev:frontend` scripts.
</objective>

<context>
@package.json — root monorepo package.json (already has `dev:backend`)
@packages/backend/package.json — has `dev` script: `tsx watch src/server.ts`
@packages/frontend/package.json — has `dev` script: `vite`
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add concurrent dev script to root package.json</name>
  <files>package.json</files>
  <action>
    Add two scripts to the root package.json `scripts` field:

    1. `"dev:frontend": "pnpm --filter frontend dev"` — mirrors the existing `dev:backend` pattern
    2. `"dev": "pnpm --filter backend dev & pnpm --filter frontend dev"` — runs both in parallel using shell backgrounding

    pnpm's `--filter` already prefixes output with the package name, so no extra labeling tool is needed. Using shell `&` avoids adding a dependency like `concurrently` or `npm-run-all`.

    The final scripts object should be:
    ```json
    "scripts": {
      "dev": "pnpm --filter backend dev & pnpm --filter frontend dev",
      "dev:backend": "pnpm --filter backend dev",
      "dev:frontend": "pnpm --filter frontend dev",
      "test": "pnpm --filter backend test --run",
      "typecheck": "pnpm -r run typecheck"
    }
    ```
  </action>
  <verify>
    <automated>node -e "const pkg = require('./package.json'); const s = pkg.scripts; if (!s.dev || !s['dev:frontend'] || !s['dev:backend']) { process.exit(1); } console.log('All dev scripts present');"</automated>
  </verify>
  <done>Root package.json has `dev`, `dev:backend`, and `dev:frontend` scripts. Running `pnpm dev` starts both backend and frontend concurrently.</done>
</task>

</tasks>

<verification>
- `pnpm dev` starts both servers (backend on :3000, frontend on :5173)
- `pnpm dev:backend` starts only backend
- `pnpm dev:frontend` starts only frontend
- No new dependencies added
</verification>

<success_criteria>
A single `pnpm dev` command at the monorepo root launches both backend and frontend dev servers concurrently.
</success_criteria>
