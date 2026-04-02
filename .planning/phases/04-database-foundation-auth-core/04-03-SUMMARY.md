---
phase: 04-database-foundation-auth-core
plan: "03"
subsystem: auth
tags: [react-router, better-auth, zustand, tailwind, auth-ui, protected-routes]

# Dependency graph
requires:
  - phase: 04-02
    provides: better-auth client (useSession, signIn, signOut, signUp), react-router installed, shared auth types

provides:
  - Login page at /login with floating label inputs, inline error, spinner CTA
  - Register page at /register with client-side validation and field-specific errors
  - ProfilePage stub at /profile with user info and logout button
  - ProtectedRoute component — null during hydration, Navigate to /login when unauthenticated
  - BrowserRouter with /login, /register, /feed (protected), /profile (protected), catch-all to /feed
  - LogoutButton — signOut() + navigate(/login), absolute overlay on feed
  - Zustand authStore for imperative auth state
  - QueryCache onError 401 handler in main.tsx — silent redirect to /login
  - All 6 auth UI primitives: AuthCard, FloatingLabelInput, SubmitButton, InlineError, AuthToggleLink, LogoutButton

affects: [04-04, phase-5-profile, any phase building protected frontend routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ProtectedRoute pattern — useSession() with isPending gate (no feed flash on cold load)
    - Floating label input — peer-placeholder-shown CSS trick for label-as-placeholder
    - Auth UI component pattern — AuthCard wrapping form components, consistent with dark video UI
    - QueryCache 401 handler — global session expiry redirect without per-query boilerplate
    - email.split('@')[0] as name workaround — better-auth requires name field, defer display name to Phase 5

key-files:
  created:
    - packages/frontend/src/components/Auth/AuthCard.tsx
    - packages/frontend/src/components/Auth/FloatingLabelInput.tsx
    - packages/frontend/src/components/Auth/SubmitButton.tsx
    - packages/frontend/src/components/Auth/InlineError.tsx
    - packages/frontend/src/components/Auth/AuthToggleLink.tsx
    - packages/frontend/src/components/Auth/LogoutButton.tsx
    - packages/frontend/src/components/Auth/ProtectedRoute.tsx
    - packages/frontend/src/pages/LoginPage.tsx
    - packages/frontend/src/pages/RegisterPage.tsx
    - packages/frontend/src/pages/ProfilePage.tsx
    - packages/frontend/src/store/authStore.ts
  modified:
    - packages/frontend/src/App.tsx
    - packages/frontend/src/main.tsx

key-decisions:
  - "ProtectedRoute returns null (not a loader) during isPending — black screen prevents feed flash (D-09)"
  - "email.split('@')[0] as name for signUp.email() — better-auth requires name field, display name deferred to Phase 5 (D-04)"
  - "Client-side 8-char password validation on register before API call — reduces unnecessary round trips (D-10)"
  - "QueryCache onError 401 uses window.location.href not navigate() — full navigation clears all React state cleanly"
  - "LogoutButton positioned absolute top-right matching MuteButton pattern — no new positioning system needed"

patterns-established:
  - "Auth components pattern: AuthCard wrapper + FloatingLabelInput + SubmitButton + AuthToggleLink composable stack"
  - "Route guard pattern: useSession isPending → null, no session → Navigate, session exists → children"
  - "Error mapping pattern: server error messages normalized to user-friendly copy at the page layer"

requirements-completed: [INFRA-02, INFRA-03, AUTH-01, AUTH-02, AUTH-03, AUTH-04]

# Metrics
duration: 2min
completed: 2026-04-02
---

# Phase 04 Plan 03: Auth UI Summary

**Login/Register pages with floating label inputs and React Router v7 routing, ProtectedRoute guard blocking unauthenticated feed access, LogoutButton overlay, and 401 global session expiry redirect**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-04-02T22:26:12Z
- **Completed:** 2026-04-02T22:28:23Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments

- Six auth UI primitives (AuthCard, FloatingLabelInput, SubmitButton, InlineError, AuthToggleLink, LogoutButton) matching the UI-SPEC design contract exactly
- Login page at /login calling signIn.email() with inline error "Incorrect email or password" per copywriting contract
- Register page at /register calling signUp.email() with field-specific errors, 8-char client validation
- ProtectedRoute returns null during hydration (no feed flash per D-09), redirects to /login when unauthenticated
- BrowserRouter with /login, /register, /feed (protected + LogoutButton overlay), /profile (protected stub), catch-all to /feed
- QueryCache onError 401 handler in main.tsx silently redirects to /login via window.location.href

## Task Commits

Each task was committed atomically:

1. **Task 1: Auth UI components** - `29b6b0a` (feat)
2. **Task 2: Pages, router, ProtectedRoute, auth store, 401 handler** - `c1fb8f3` (feat)

**Plan metadata:** (pending docs commit)

## Files Created/Modified

- `packages/frontend/src/components/Auth/AuthCard.tsx` — centered card wrapper, bg-zinc-900 on bg-black, max-w-sm rounded-2xl
- `packages/frontend/src/components/Auth/FloatingLabelInput.tsx` — floating label via peer-placeholder-shown, 56px min height
- `packages/frontend/src/components/Auth/SubmitButton.tsx` — white CTA with animate-spin spinner, disabled:opacity-60
- `packages/frontend/src/components/Auth/InlineError.tsx` — role=alert, text-red-500, standalone error component
- `packages/frontend/src/components/Auth/AuthToggleLink.tsx` — react-router Link, text-white underline
- `packages/frontend/src/components/Auth/LogoutButton.tsx` — signOut() + navigate(/login), absolute top-right overlay
- `packages/frontend/src/components/Auth/ProtectedRoute.tsx` — useSession guard, null during isPending
- `packages/frontend/src/pages/LoginPage.tsx` — signIn.email(), error under password field, navigate(/feed)
- `packages/frontend/src/pages/RegisterPage.tsx` — signUp.email(), name=email.split('@')[0], field-specific errors
- `packages/frontend/src/pages/ProfilePage.tsx` — stub with user.name, user.email, LogoutButton
- `packages/frontend/src/store/authStore.ts` — Zustand store following feedStore pattern
- `packages/frontend/src/App.tsx` — BrowserRouter with all routes, FeedContainer wrapped in ProtectedRoute
- `packages/frontend/src/main.tsx` — QueryCache onError 401 handler, silent redirect to /login

## Decisions Made

- ProtectedRoute returns null (not a spinner or skeleton) during isPending — black screen prevents any flash of feed content (D-09). This is a deliberate UX choice.
- email.split('@')[0] as the name parameter for signUp.email() — better-auth v1.5.x requires a name field on registration; display name configuration is deferred to Phase 5 per D-04.
- Client-side 8-char password validation before API call on register — reduces unnecessary round trips and provides immediate feedback per D-10.
- window.location.href for the 401 redirect in QueryCache onError — full page navigation clears all React + Zustand state atomically, safer than react-router navigate() which may leave stale state.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `packages/frontend/src/pages/ProfilePage.tsx` — intentional stub. Shows user name/email but no editing, avatar, or connected accounts. Plan explicitly designates this as "Profile management coming in Phase 5." The /profile route exists and renders user data from session — the stub is functional, not broken.
- `packages/frontend/src/store/authStore.ts` — authStore is currently unused by any component. It follows the Zustand pattern from feedStore and is provided as extension point for Phase 5 profile data. The primary auth state comes from useSession().

## Issues Encountered

None — all components typechecked clean on first attempt.

## User Setup Required

None — no external service configuration required for this plan.

## Next Phase Readiness

- Auth UI is complete and wired to better-auth client from Plan 02
- Plan 04 (OAuth provider setup) can now wire OAuth buttons into these same auth pages if needed
- The ProtectedRoute is in place — as soon as the backend auth endpoints are running (Plan 01/02 output), the full flow is testable end-to-end
- ProfilePage stub is ready for Phase 5 expansion (display name editing, avatar, connected accounts list)

---
*Phase: 04-database-foundation-auth-core*
*Completed: 2026-04-02*
