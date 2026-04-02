---
phase: 04-database-foundation-auth-core
plan: 02
subsystem: auth-integration
tags: [better-auth, cors, fastify, vite, shared-types]

requires:
  - 04-01 (better-auth instance, /api/auth/* route handler)

provides:
  - CORS with credentials: true for credentialed cross-origin requests
  - Auth route registration in Fastify server (before feed/video routes)
  - Auth preHandler guards on feed and video endpoints (returns 401 without session)
  - Vite dev proxy for /api path routing to backend
  - Frontend auth client with useSession, signIn, signOut, signUp exports
  - feedApi updated to send credentials and throw errors with .status property
  - Shared User, Session, AuthState types in @goonster/shared

affects:
  - 04-03: React Router setup, auth-aware UI components can now use useSession
  - 04-04: Profile API, auth middleware wired in server

tech-stack:
  added:
    - better-auth (frontend) — react client via createAuthClient
    - react-router — installed in frontend, used in Plan 03
  patterns:
    - auth.api.getSession() + fromNodeHeaders() as Fastify preHandler auth guard
    - createAuthClient({ baseURL }) pattern for frontend better-auth React integration
    - credentials: 'include' on all authenticated fetch calls
    - Error enrichment with .status for HTTP-aware error handling

key-files:
  created:
    - packages/frontend/src/auth/client.ts
    - packages/shared/src/types/auth.ts
  modified:
    - packages/backend/src/server.ts (CORS credentials, authRoutes registration)
    - packages/backend/src/routes/feed.ts (auth preHandler hook)
    - packages/backend/src/routes/video.ts (auth preHandler hook)
    - packages/frontend/vite.config.ts (added /api proxy)
    - packages/frontend/src/api/feedApi.ts (credentials: include, status error)
    - packages/frontend/package.json (added better-auth, react-router)
    - packages/shared/package.json (added ./auth export)
    - pnpm-lock.yaml

key-decisions:
  - "Frontend better-auth client uses baseURL: localhost:3000 directly (not relative) — production-portable, Vite proxy covers dev"
  - "react-router installed in Plan 02 ahead of use — Plan 03 requires it for routing setup; installing here avoids blocking"

duration: 2min
completed: 2026-04-03
---

# Phase 04 Plan 02: Auth Wiring Summary

**CORS credentials + auth preHandler guards on feed/video + Vite /api proxy + frontend better-auth client + shared User/Session types**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-02T22:21:08Z
- **Completed:** 2026-04-02T22:23:31Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- CORS updated with `credentials: true`, explicit `methods`, and `allowedHeaders` — satisfies INFRA-05
- `authRoutes` registered in Fastify server before feed/video routes
- Auth `preHandler` hook added to feed.ts and video.ts — both return 401 when no session cookie is present
- Vite dev server proxy extended with `/api` path for auth API calls during development
- `packages/frontend/src/auth/client.ts` created with `createAuthClient` and named exports: `useSession`, `signIn`, `signOut`, `signUp`
- `feedApi.ts` updated: `credentials: 'include'` added to fetch call, errors enriched with `.status` property
- `packages/shared/src/types/auth.ts` created with `User`, `Session`, `AuthState` interfaces
- `packages/shared/package.json` updated with `./auth` export path

## Task Commits

Each task was committed atomically:

1. **Task 1: CORS credentials fix, auth route registration, auth guards on feed/video** — `b2dfe5f` (feat)
2. **Task 2: Vite proxy, frontend auth client, feedApi credentials, shared types** — `7c1b752` (feat)

## Files Created/Modified

- `packages/backend/src/server.ts` — CORS updated (credentials: true, methods, allowedHeaders), authRoutes imported and registered before feed/video
- `packages/backend/src/routes/feed.ts` — auth preHandler hook using auth.api.getSession + fromNodeHeaders
- `packages/backend/src/routes/video.ts` — auth preHandler hook using auth.api.getSession + fromNodeHeaders
- `packages/frontend/vite.config.ts` — `/api` added to proxy config
- `packages/frontend/src/auth/client.ts` — createAuthClient with useSession/signIn/signOut/signUp exports
- `packages/frontend/src/api/feedApi.ts` — credentials: include, .status error enrichment
- `packages/frontend/package.json` — better-auth and react-router added
- `packages/shared/src/types/auth.ts` — User, Session, AuthState interfaces
- `packages/shared/package.json` — ./auth export added

## Decisions Made

- **Frontend auth client uses explicit baseURL** — `http://localhost:3000` rather than a relative path, making the client portable to production environments without reconfiguration. In development the Vite proxy handles `/api` routing regardless.
- **react-router installed in Plan 02** — Plan 03 requires it for React Router setup; installing it here prevents a blocking dependency gap.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no stub patterns introduced. Auth client wires directly to better-auth; shared types are full definitions, not placeholders.

---
*Phase: 04-database-foundation-auth-core*
*Completed: 2026-04-03*
