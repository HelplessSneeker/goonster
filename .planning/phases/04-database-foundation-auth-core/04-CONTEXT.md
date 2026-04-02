# Phase 4: Database Foundation & Auth Core - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create accounts with email/password, log in, maintain sessions, and access an auth-gated video feed. This phase adds PostgreSQL (Drizzle ORM), server-side sessions with httpOnly cookies, client-side routing, and CORS for credentialed requests.

Requirements: INFRA-01, INFRA-02, INFRA-03, INFRA-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04

</domain>

<decisions>
## Implementation Decisions

### Auth Screens Design
- **D-01:** Centered card layout on dark branded background — clean centered form card, mobile-first, standard auth pattern
- **D-02:** Dark & minimal visual tone — dark background with light card, matches existing dark video player aesthetic for auth → feed continuity
- **D-03:** Floating label inputs — labels inside inputs that float above when focused/filled, modern and compact for mobile
- **D-04:** Registration form has email + password only — display name is deferred to Phase 5 (PROF-02). Minimal friction signup.
- **D-05:** Link toggle between login/register — "Don't have an account? Register" / "Already have an account? Log in" text links below the form, navigating between /login and /register

### Auth Flow UX
- **D-06:** Inline error display below the relevant field — "Email already registered" appears under email, "Invalid password" under password. Most usable on mobile.
- **D-07:** Post-login redirect to /feed — users land directly on the video feed after successful login
- **D-08:** Button spinner on submit — submit button shows spinner and disables during auth request, prevents double-submit
- **D-09:** Instant redirect for unauthenticated users — visiting /feed without auth immediately redirects to /login, no flash of feed content

### Password Policy
- **D-10:** 8+ character minimum, no complexity rules — follows NIST 800-63B guidance. No uppercase/number/special requirements.
- **D-11:** Hint text below password field — "8+ characters" shown as subtle persistent hint text, no surprises on submit

### Session & Expiry
- **D-12:** 30-day session duration — standard for social/media apps, balances convenience and security
- **D-13:** Silent redirect on session expiry — on 401 from API, quietly redirect to /login. No modal, no toast, no "session expired" message.

### Claude's Discretion
- Database schema design (table structure, indexes, constraints)
- Session store implementation (PostgreSQL-backed vs in-memory)
- Password hashing algorithm choice (bcrypt/argon2)
- Client-side router selection and configuration
- CORS credentialed request configuration
- Auth middleware/plugin pattern for Fastify
- Route guard component pattern for React

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & Requirements
- `.planning/PROJECT.md` — Core value, constraints, tech stack decisions
- `.planning/REQUIREMENTS.md` — AUTH-01 through AUTH-04, INFRA-01/02/03/05 acceptance criteria
- `.planning/ROADMAP.md` — Phase 4 success criteria (5 items that must be TRUE)

### Existing Codebase
- `packages/backend/src/server.ts` — Fastify setup, plugin registration pattern, CORS config to update
- `packages/frontend/src/main.tsx` — React entry point, QueryClientProvider setup (router wraps here)
- `packages/frontend/src/App.tsx` — Currently renders FeedContainer directly (needs router integration)
- `packages/frontend/src/store/` — Zustand store pattern for reference

### Tech Stack Reference (CLAUDE.md)
- `CLAUDE.md` §Technology Stack — Approved stack with version constraints
- `CLAUDE.md` §Stack Patterns — Video playback patterns, Fastify plugin patterns

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Zustand store pattern (packages/frontend/src/store/) — reference for any new client state
- TanStack Query setup (main.tsx) — QueryClient already configured, use for auth API calls
- Tailwind CSS v4 with @tailwindcss/vite plugin — use for all auth screen styling

### Established Patterns
- Fastify plugin registration — async plugin pattern in server.ts (register cors, static, routes)
- Monorepo structure — packages/backend, packages/frontend, packages/shared with workspace refs
- Shared types — @goonster/shared package for cross-package type definitions

### Integration Points
- `server.ts` — New auth routes, session plugin, and CORS credential config register here
- `main.tsx` — Router provider wraps QueryClientProvider or vice versa
- `App.tsx` — Replace direct FeedContainer render with router outlet
- `packages/shared/src/types/` — Auth-related types (User, Session) belong here

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for all technical implementation decisions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-database-foundation-auth-core*
*Context gathered: 2026-04-02*
