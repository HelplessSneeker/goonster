# Phase 4: Database Foundation & Auth Core — Research

**Researched:** 2026-04-02
**Domain:** PostgreSQL / Drizzle ORM / better-auth / React Router / Session management
**Confidence:** HIGH (all critical claims verified via official docs or npm registry)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Centered card layout on dark branded background
- **D-02:** Dark & minimal visual tone — dark background with light card, matches existing dark video player aesthetic
- **D-03:** Floating label inputs — labels inside inputs that float above when focused/filled
- **D-04:** Registration form has email + password only — display name deferred to Phase 5 (PROF-02)
- **D-05:** Link toggle between login/register below the form
- **D-06:** Inline error display below the relevant field
- **D-07:** Post-login redirect to /feed
- **D-08:** Button spinner on submit
- **D-09:** Instant redirect for unauthenticated users — no flash of feed content
- **D-10:** 8+ character minimum, no complexity rules (NIST 800-63B)
- **D-11:** Hint text below password field — "8+ characters"
- **D-12:** 30-day session duration
- **D-13:** Silent redirect on session expiry — 401 from API quietly redirects to /login

### Claude's Discretion

- Database schema design (table structure, indexes, constraints)
- Session store implementation (PostgreSQL-backed vs in-memory)
- Password hashing algorithm choice (bcrypt/argon2)
- Client-side router selection and configuration
- CORS credentialed request configuration
- Auth middleware/plugin pattern for Fastify
- Route guard component pattern for React

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | PostgreSQL database with Drizzle ORM schema (users, sessions, accounts, tokens) | better-auth 1.5.6 + @better-auth/drizzle-adapter 1.5.6 auto-generates the four required tables; drizzle-orm 0.45.2 is confirmed compatible |
| INFRA-02 | Video feed requires authentication to view | `auth.api.getSession()` + `fromNodeHeaders()` pattern enables per-route auth check in Fastify; client `ProtectedRoute` wrapper handles frontend redirect |
| INFRA-03 | Client-side routing (login, register, profile, feed pages) | React Router v7 declarative mode (BrowserRouter + Routes + Route); single npm package `react-router` |
| INFRA-05 | CORS configuration updated for credentialed requests | @fastify/cors must add `credentials: true` and explicit origin list; better-auth's `trustedOrigins` must mirror those origins |
| AUTH-01 | User can register with email and password | `authClient.signUp.email()` — note: `name` field is required by better-auth even though D-04 defers display name; workaround is to pass email prefix as placeholder name |
| AUTH-02 | User can log in with email and password | `authClient.signIn.email()` |
| AUTH-03 | User can log out (session destroyed server-side) | `authClient.signOut()` — better-auth destroys the session row in the database |
| AUTH-04 | User session persists across browser refresh (httpOnly cookie) | better-auth sets `session_token` as httpOnly cookie by default in production; dev mode requires explicit httpOnly config or `useSecureCookies: false` |
</phase_requirements>

---

## Summary

Phase 4 introduces a PostgreSQL database, better-auth session management, and client-side routing to transform the current single-page video player into an authenticated web application. The locked decisions from STATE.md (better-auth 1.5.x, drizzle-orm 0.45.x) narrow the research scope significantly — the main work is integrating three well-documented systems: the better-auth Fastify handler, the Drizzle adapter, and React Router v7 in declarative mode.

The only genuine tricky point in this phase is that better-auth's `signUp.email()` requires a `name` field even though D-04 defers display names to Phase 5. The consensus workaround is to pass the email local-part (before `@`) as the name value — this satisfies the schema constraint and is invisible to the user. This was an open issue as of 2025 (#7120) with no resolution.

A second important finding is a zod version conflict: the backend currently declares `"zod": "^3.25.2"` but better-auth 1.5.6 ships with `zod: '^4.3.6'` as a bundled dependency. Since better-auth bundles its own zod, this does not cause a runtime conflict, but the backend's own zod usage (for route validation) will still be on v3 unless explicitly upgraded. The plan should upgrade the backend's zod declaration to `^4.3.6` to align with better-auth and avoid two zod runtimes.

**Primary recommendation:** Use better-auth 1.5.6 with the bundled Drizzle adapter, React Router v7 in declarative mode, and PostgreSQL via Docker Compose for local development. Follow the Fastify integration pattern exactly as documented (catch-all `/api/auth/*` route, `fromNodeHeaders` adapter, `credentials: true` in CORS).

---

## Standard Stack

### Core (new packages for this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| better-auth | 1.5.6 | Auth framework (sessions, email/password, cookies) | Locked in STATE.md; replaces passport + express-session + connect-pg-simple + bcrypt — 5 packages in one |
| @better-auth/drizzle-adapter | 1.5.6 | Drizzle ORM adapter (bundled inside better-auth) | Bundled in better-auth itself — no separate install needed; confirmed by npm view |
| drizzle-orm | 0.45.2 | ORM for PostgreSQL schema + queries | Locked in STATE.md (v1.0.0-beta breaks better-auth adapter); peer dep >=0.41.0 |
| drizzle-kit | 0.31.10 | CLI for schema generation and migration | Peer dep >=0.31.4 confirmed; required for `drizzle-kit generate` + `drizzle-kit migrate` |
| pg | 8.20.0 | PostgreSQL client driver | Required by drizzle-orm/node-postgres; confirmed version 8.x |
| react-router | 7.14.0 | Client-side routing (BrowserRouter, Routes, Route, Navigate, Outlet) | Declarative mode is the right choice for this SPA; no framework/SSR overhead |
| zod | 4.3.6 | Runtime validation for backend routes | Backend currently on ^3.25.2; upgrade to ^4.3.6 to align with better-auth bundled dep |

### Supporting (existing packages that get new usage)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @fastify/cors | 11.2.0 (already installed) | Add `credentials: true` for cross-origin cookie transmission | Must be updated in server.ts before any auth endpoint is called |
| @fastify/cookie | 11.0.2 | Cookie parsing (better-auth relies on this implicitly via its response headers) | Register in Fastify before auth handler |
| zustand | 5.x (existing) | Auth state store (current user, loading flag) | New `useAuthStore` alongside existing `useFeedStore` |
| @tanstack/react-query | 5.x (existing) | Session queries + global 401 handler via QueryCache.onError | QueryClient configured with `QueryCache({ onError })` for session expiry redirect |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| better-auth | passport + express-session + bcrypt | Rejected in STATE.md — 4-5 packages, manual wiring, session store config |
| React Router v7 declarative | TanStack Router | Both solid; React Router chosen because it's the ecosystem default and simpler for this scope |
| React Router v7 declarative | React Router v7 data mode | Data mode adds loader/action complexity that isn't needed for a simple auth SPA |
| Docker Compose PostgreSQL | Neon serverless / Supabase | Local file-serving project should not have external DB dependency; Docker Compose is self-contained |

### Installation

```bash
# Backend
pnpm --filter backend add better-auth drizzle-orm pg
pnpm --filter backend add -D drizzle-kit @types/pg
pnpm --filter backend add zod@^4.3.6

# Frontend
pnpm --filter frontend add react-router
```

Note: `@better-auth/drizzle-adapter` is bundled inside the `better-auth` package — no separate install.

### Version verification (confirmed against npm registry, 2026-04-02)

| Package | Registry Latest | Date Confirmed |
|---------|----------------|----------------|
| better-auth | 1.5.6 | 2026-04-02 |
| drizzle-orm | 0.45.2 | 2026-04-02 |
| drizzle-kit | 0.31.10 | 2026-04-02 |
| pg | 8.20.0 | 2026-04-02 |
| react-router | 7.14.0 | 2026-04-02 |
| zod | 4.3.6 | 2026-04-02 |

---

## Architecture Patterns

### Recommended Project Structure (additions to existing monorepo)

```
packages/
├── backend/src/
│   ├── auth.ts              # better-auth instance (betterAuth({...}))
│   ├── db/
│   │   ├── index.ts         # drizzle(process.env.DATABASE_URL!) export
│   │   └── schema.ts        # better-auth generated tables + any app tables
│   ├── routes/
│   │   ├── auth.ts          # /api/auth/* catch-all handler
│   │   ├── feed.ts          # existing — add auth guard
│   │   └── video.ts         # existing — add auth guard
│   └── server.ts            # existing — register auth routes + update CORS
│
├── frontend/src/
│   ├── auth/
│   │   └── client.ts        # createAuthClient({ baseURL }) export
│   ├── components/Auth/
│   │   ├── AuthCard.tsx
│   │   ├── FloatingLabelInput.tsx
│   │   ├── SubmitButton.tsx
│   │   ├── InlineError.tsx
│   │   ├── AuthToggleLink.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── store/
│   │   ├── feedStore.ts     # existing
│   │   └── authStore.ts     # new: { user, isLoading } Zustand store
│   └── App.tsx              # replace direct FeedContainer with BrowserRouter + Routes
│
└── shared/src/types/
    ├── video.ts             # existing
    └── auth.ts              # new: User type (shared between packages)
```

### Pattern 1: better-auth Fastify Integration

**What:** A catch-all route at `/api/auth/*` that delegates all auth requests to better-auth's handler. This is the canonical pattern from the official Fastify integration guide.

**When to use:** Always — this is the only supported integration approach for better-auth with Fastify.

```typescript
// packages/backend/src/routes/auth.ts
// Source: https://www.better-auth.com/docs/integrations/fastify
import type { FastifyPluginAsync } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'

export const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.route({
    method: ['GET', 'POST'],
    url: '/api/auth/*',
    async handler(request, reply) {
      const url = new URL(request.url, `http://${request.headers.host}`)
      const req = new Request(url.toString(), {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        ...(request.body ? { body: JSON.stringify(request.body) } : {}),
      })
      const response = await auth.handler(req)
      reply.status(response.status)
      response.headers.forEach((value, key) => reply.header(key, value))
      reply.send(response.body ? await response.text() : null)
    },
  })
}
```

### Pattern 2: better-auth Server Instance Configuration

**What:** The central auth configuration file. Drizzle adapter receives the db instance and schema. Session configured for 30-day expiry (D-12). Email/password enabled with 8-character minimum (D-10).

```typescript
// packages/backend/src/auth.ts
// Source: https://www.better-auth.com/docs/installation
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/index.js'
import * as schema from './db/schema.js'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,        // D-10
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,   // 30 days (D-12)
    updateAge: 60 * 60 * 24,         // refresh daily on activity
  },
  trustedOrigins: [
    process.env.NODE_ENV === 'production'
      ? 'https://goonster.app'
      : 'http://localhost:5173',
  ],
  secret: process.env.BETTER_AUTH_SECRET!,
})
```

### Pattern 3: CORS Update for Credentialed Requests (INFRA-05)

**What:** CORS must add `credentials: true` before any auth cookie flows work. This is a blocking prerequisite — every auth call from the frontend will fail without it.

```typescript
// packages/backend/src/server.ts — updated CORS registration
await server.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://goonster.app']
    : ['http://localhost:5173'],
  credentials: true,                          // REQUIRED for cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

### Pattern 4: Protected Route in Fastify (INFRA-02)

**What:** Inline auth guard using `auth.api.getSession()` in a Fastify `preHandler` hook. Attach to the feed and video routes.

```typescript
// packages/backend/src/routes/feed.ts (updated)
// Source: https://www.better-auth.com/docs/integrations/fastify
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'

// Inside route registration:
fastify.addHook('preHandler', async (request, reply) => {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(request.headers),
  })
  if (!session) {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})
```

### Pattern 5: React Router v7 Declarative Setup (INFRA-03)

**What:** Replace direct `<FeedContainer />` render in App.tsx with BrowserRouter + route tree. ProtectedRoute uses `useSession` from the auth client.

```tsx
// packages/frontend/src/App.tsx
// Source: https://reactrouter.com/start/declarative/routing
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import ProtectedRoute from './components/Auth/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedContainer from './components/Feed/FeedContainer'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <FeedContainer />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/feed" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
```

### Pattern 6: ProtectedRoute Component (D-09 — instant redirect, no flash)

**What:** Wraps any route that requires auth. Reads session state from the better-auth `useSession` hook. Shows nothing (null render) while session is loading to prevent flash of feed content.

```tsx
// packages/frontend/src/components/Auth/ProtectedRoute.tsx
import { Navigate } from 'react-router'
import { useSession } from '../auth/client'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) return null               // black screen during hydration (D-09)
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
```

### Pattern 7: better-auth React Client (frontend)

**What:** Single client instance exported from a shared module. `baseURL` must point to the backend server when frontend and backend are on different ports.

```typescript
// packages/frontend/src/auth/client.ts
// Source: https://www.better-auth.com/docs/concepts/client
import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000',
})

export const { useSession, signIn, signOut, signUp } = authClient
```

### Pattern 8: name Field Workaround for D-04

**What:** better-auth `signUp.email()` requires a `name` field (issue #7120, open as of 2026-03-31). D-04 defers display names to Phase 5. The workaround is to silently pass the email local-part as name.

```typescript
// Inside RegisterPage.tsx submit handler
await authClient.signUp.email({
  email,
  password,
  name: email.split('@')[0],   // invisible to user, satisfies schema constraint
})
```

### Pattern 9: Drizzle Configuration

```typescript
// packages/backend/drizzle.config.ts
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

### Pattern 10: Global 401 Handler in QueryClient (D-13 — silent session expiry redirect)

```typescript
// packages/frontend/src/main.tsx — updated QueryClient setup
import { QueryCache, QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: unknown) => {
      if ((error as { status?: number }).status === 401) {
        window.location.href = '/login'   // silent redirect (D-13)
      }
    },
  }),
})
```

### Anti-Patterns to Avoid

- **Do not** use `@fastify/session` or `@fastify/cookie` as the session mechanism — better-auth manages its own cookies via response headers. Adding a session plugin will conflict.
- **Do not** put the CORS plugin after the auth route registration — CORS must be first.
- **Do not** use `credentials: 'omit'` in fetch calls — better-auth/react's `better-fetch` sends cookies automatically, but TanStack Query's `fetch` calls to the feed API must include `credentials: 'include'` explicitly.
- **Do not** render any feed content while `isPending` is true in ProtectedRoute — this produces the flash of content that D-09 prohibits.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session storage and cookie management | Custom httpOnly cookie logic | better-auth built-in | Cookie rotation, expiry, httpOnly flag, SameSite — all edge-case-heavy |
| Password hashing | Custom scrypt/bcrypt calls | better-auth built-in (scrypt via @noble/hashes) | Correct salt generation, timing-safe comparison are subtle |
| CSRF protection | Custom token middleware | better-auth built-in | Already handles same-site cookie defaults |
| Session invalidation on logout | Manual DB delete | `authClient.signOut()` | Atomically deletes session row and clears cookie |
| Route protection loading state | Custom auth context | better-auth `useSession` `isPending` | isPending handles initial hydration from server correctly |
| Database schema for auth tables | Manual table design | `npx auth generate` CLI | Schema must exactly match better-auth's expectations; deviation breaks the adapter |

**Key insight:** better-auth is opinionated by design. Fighting its conventions (e.g., overriding the schema, replacing its cookie logic) creates maintenance debt with each version upgrade. Accept its conventions where they exist.

---

## Common Pitfalls

### Pitfall 1: CORS `credentials: true` Missing

**What goes wrong:** All auth requests fail with a CORS error. The `better-auth` handler returns the correct Set-Cookie header but the browser strips it because CORS credentials mode is not negotiated.

**Why it happens:** The Fastify CORS config currently lacks `credentials: true`. The browser enforces that credentialed cross-origin requests require an explicit Access-Control-Allow-Credentials: true response header.

**How to avoid:** Update CORS registration in server.ts before registering any auth routes. This is the first task in the phase (noted as a blocker in STATE.md).

**Warning signs:** Preflight passes but POST /api/auth/sign-in returns no cookie; `document.cookie` is empty after sign-in.

### Pitfall 2: Vite Proxy Not Covering `/api/auth/*`

**What goes wrong:** Frontend auth calls fail with CORS errors or 404s in development because the Vite dev server proxy only forwards `/feed` and `/video` routes.

**Why it happens:** The current `vite.config.ts` proxy configuration only covers the video API paths.

**How to avoid:** Add `/api` to the Vite proxy configuration:
```typescript
proxy: {
  '/feed': 'http://localhost:3000',
  '/video': 'http://localhost:3000',
  '/api': 'http://localhost:3000',   // ADD THIS
}
```
When proxied, `authClient.baseURL` can be omitted (same origin from browser's perspective).

**Warning signs:** Auth calls work from Postman but fail in the browser during development.

### Pitfall 3: better-auth `name` Field Required

**What goes wrong:** `authClient.signUp.email({ email, password })` throws a validation error — `name` is a required field in the better-auth user schema.

**Why it happens:** D-04 defers display name to Phase 5, but better-auth's user table has a non-nullable `name` column. Issue #7120 documents this and was closed as duplicate with no resolution in v1.5.x.

**How to avoid:** Pass `name: email.split('@')[0]` in the signUp call. Update to a real display name in Phase 5 (PROF-02).

**Warning signs:** Registration form submits but server returns 422 with schema validation error.

### Pitfall 4: drizzle-orm 1.x Beta Breaks the Adapter

**What goes wrong:** If drizzle-orm is upgraded to 1.0.0-beta.x, the better-auth Drizzle adapter fails with "Unknown relational filter field" errors.

**Why it happens:** drizzle-orm 1.0 changed the internal query API that the adapter relies on. Issue #6766 tracks this; a fix PR (#6913) exists but was not merged as of research date.

**How to avoid:** Pin to `"drizzle-orm": "0.45.2"` (exact, not `^`). Do not upgrade to the 1.x beta until better-auth officially supports it.

**Warning signs:** Existing tests pass but runtime auth calls return 500 errors after a drizzle-orm upgrade.

### Pitfall 5: httpOnly Cookie Not Set in Development

**What goes wrong:** Session cookie is set in production but not in localhost development, so `useSession` always returns null.

**Why it happens:** better-auth sets `secure: true` on cookies by default, which browsers reject over HTTP (localhost is an exception in Chrome but not all browsers).

**How to avoid:** Set `BETTER_AUTH_URL=http://localhost:3000` in `.env` — better-auth uses this to determine the environment and will not force `secure: true` on HTTP origins.

**Warning signs:** Sign-in returns 200 with session data in the response body but no cookie is set.

### Pitfall 6: `<Navigate>` Flash of Unauthenticated Content

**What goes wrong:** Protected feed briefly renders before the session check completes, violating D-09.

**Why it happens:** `useSession` is async — on first render `isPending` is true and `session` is undefined. A naive `if (!session) return <Navigate />` check will momentarily render children when session is undefined but not yet loaded.

**How to avoid:** The ProtectedRoute must return `null` (not `<Navigate />`) when `isPending` is true. Navigate only when `isPending` is false AND session is absent.

### Pitfall 7: Feed API Does Not Send Credentials

**What goes wrong:** The feed API returns 401 even when the user is logged in, because the browser does not send the session cookie with non-same-origin fetch calls.

**Why it happens:** `fetchFeed` in `feedApi.ts` uses `fetch()` without `credentials: 'include'`. The Vite proxy workaround (Pitfall 2) sidesteps this in dev, but production deployments on different origins require explicit credentials.

**How to avoid:** Update all `fetch()` calls to backend API routes to include `{ credentials: 'include' }`. The Vite proxy makes localhost transparent, but this is required for correctness.

---

## Code Examples

### Drizzle DB Setup

```typescript
// packages/backend/src/db/index.ts
// Source: https://orm.drizzle.team/docs/get-started/postgresql-new
import { drizzle } from 'drizzle-orm/node-postgres'
import * as schema from './schema.js'

export const db = drizzle(process.env.DATABASE_URL!, { schema })
```

### Schema Generation Workflow

```bash
# 1. Generate better-auth table definitions into src/db/schema.ts
npx @better-auth/cli generate

# 2. Generate SQL migration from schema
npx drizzle-kit generate

# 3. Apply migration to database
npx drizzle-kit migrate
```

### Docker Compose for Local PostgreSQL

```yaml
# docker-compose.yml (project root)
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_USER: goonster
      POSTGRES_PASSWORD: goonster
      POSTGRES_DB: goonster
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Environment Variables

```bash
# packages/backend/.env
DATABASE_URL=postgresql://goonster:goonster@localhost:5432/goonster
BETTER_AUTH_SECRET=<openssl rand -base64 32>
BETTER_AUTH_URL=http://localhost:3000
NODE_ENV=development
```

### Floating Label Input (Tailwind v4 peer pattern)

```tsx
// packages/frontend/src/components/Auth/FloatingLabelInput.tsx
// Source: Tailwind peer-placeholder-shown pattern (verified working in v4)
export function FloatingLabelInput({ id, label, type, value, onChange, error }: Props) {
  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder=" "
        className="peer block w-full rounded-lg bg-white/5 border border-white/20
                   px-4 pt-5 pb-2 text-base text-white placeholder-transparent
                   focus:outline-none focus:border-white min-h-[56px]"
      />
      <label
        htmlFor={id}
        className="absolute left-4 top-4 text-base text-white/50 transition-all duration-150
                   peer-placeholder-shown:top-4 peer-placeholder-shown:text-base
                   peer-focus:top-1 peer-focus:text-xs peer-focus:text-white/70
                   peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs"
      >
        {label}
      </label>
      {error && <p className="mt-1 text-sm font-semibold text-red-500">{error}</p>}
    </div>
  )
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| passport.js + express-session + connect-pg-simple | better-auth (all-in-one) | 2024 | 5 packages → 1; TypeScript-native; built-in Drizzle adapter |
| React Router v6 (react-router-dom) | React Router v7 (react-router) | Late 2024 | Package renamed; Remix merged in; import from `react-router` not `react-router-dom` |
| CRA + react-router-dom | Vite + react-router | 2023-2024 | CRA unmaintained; react-router-dom still works but react-router is the canonical v7 package |
| JWT stateless tokens | Database-backed sessions | Architectural choice | Server-side invalidation required (STATE.md); database sessions are the locked decision |

**Deprecated/outdated:**

- `react-router-dom`: Still works but v7 docs and package use `react-router`. Import from `react-router` directly in new code.
- `passport.js`: Not deprecated but better-auth supersedes it for TypeScript-first projects.
- `drizzle-orm` 1.0.0-beta: Do NOT use — breaks better-auth adapter until issue #6766 fix is merged.

---

## Open Questions

1. **PostgreSQL provisioning for production**
   - What we know: Docker Compose works for local dev
   - What's unclear: No production hosting decision has been made (out of scope for this phase)
   - Recommendation: Add a `docker-compose.yml` at repo root; add DATABASE_URL to `.env.example`; defer production decision

2. **Vite proxy vs `baseURL` in authClient**
   - What we know: With Vite proxy covering `/api`, `baseURL` can be omitted from the frontend client (same-origin from the browser's perspective). Without proxy, `baseURL: 'http://localhost:3000'` is required.
   - What's unclear: Whether the final deployment uses a reverse proxy or same-origin setup
   - Recommendation: Add `/api` to the Vite proxy for dev consistency; set `baseURL` anyway for portability

3. **`@fastify/cookie` required or not**
   - What we know: better-auth sets cookies via response headers directly; it does not use `@fastify/cookie`'s reply.setCookie API
   - What's unclear: Whether Fastify requires the cookie plugin to properly forward Set-Cookie headers
   - Recommendation: Do NOT register `@fastify/cookie` — better-auth adds Set-Cookie via `reply.header()` directly; adding the plugin may cause double-registration

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | All runtime | ✓ | v24.14.0 | — |
| pnpm | Package manager | ✓ (inferred from pnpm-lock.yaml) | — | npm |
| PostgreSQL (psql) | INFRA-01 | ✗ | — | Docker Compose (see below) |
| Docker / docker-compose | Local PostgreSQL | ✗ | — | Manual PostgreSQL install or Neon free tier |

**Missing dependencies with no fallback:**

- PostgreSQL is not available on this machine. Docker is also not installed. The plan must include a Wave 0 setup task that either: (a) installs Docker and provides the `docker-compose.yml`, or (b) provides instructions to install PostgreSQL directly (e.g., `sudo apt install postgresql-16` on Ubuntu/WSL2), or (c) provides a Neon free tier connection string as an alternative. The planner must make this decision explicit.

**Missing dependencies with fallback:**

- PostgreSQL via Docker Compose: Docker is unavailable on this machine. Fallback: direct PostgreSQL installation on WSL2 Ubuntu (`sudo apt install postgresql-16`). The plan should provide both options and note that the DATABASE_URL format is identical either way.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file (backend) | `packages/backend/vitest.config.ts` (exists) |
| Config file (frontend) | `packages/frontend/vite.config.ts` (vitest runs via vite, no separate config file; `"test": "vitest run"` in package.json) |
| Quick run command | `pnpm --filter backend test --run` |
| Full suite command | `pnpm -r run test --run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Database tables created by migration | smoke | manual — `psql -c "\dt"` after `drizzle-kit migrate` | ❌ Wave 0 |
| INFRA-02 | Unauthenticated GET /feed returns 401 | integration | `pnpm --filter backend test --run -- feed.test.ts` | ✅ (extend existing) |
| INFRA-03 | React Router routes render correct pages | unit | `pnpm --filter frontend test --run -- App.test.tsx` | ❌ Wave 0 |
| INFRA-05 | CORS preflight for /api/auth/* includes credentials | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ Wave 0 |
| AUTH-01 | POST /api/auth/sign-up creates user row | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ Wave 0 |
| AUTH-02 | POST /api/auth/sign-in sets session cookie | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ Wave 0 |
| AUTH-03 | POST /api/auth/sign-out deletes session row | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ Wave 0 |
| AUTH-04 | Session cookie is httpOnly | integration | `pnpm --filter backend test --run -- auth.test.ts` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter backend test --run`
- **Per wave merge:** `pnpm -r run test --run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/backend/tests/auth.test.ts` — covers INFRA-02, INFRA-05, AUTH-01 through AUTH-04
- [ ] `packages/frontend/src/__tests__/App.test.tsx` — covers INFRA-03 route rendering
- [ ] `packages/backend/.env.test` — test DATABASE_URL pointing to a test database or SQLite in-memory (better-auth supports SQLite for tests)
- [ ] `docker-compose.yml` at repo root — required before any backend tests that touch the real DB

*(Integration tests for auth will require a real (or in-memory) database. Consider using better-auth's memory adapter for unit tests and a dedicated test PostgreSQL database for integration.)*

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on Phase 4 |
|-----------|------------------|
| Tech stack: Node/TypeScript | All backend code in TypeScript; `tsx watch` for dev, `tsc` for prod |
| Mobile-first | Auth screens use `h-dvh`, min touch target 44px, tested at 375px viewport |
| Static content only (m1) | Not applicable to Phase 4 — auth is server-side sessions, not file serving |
| Future mobile: no native preclude | React Router v7 declarative mode is compatible with React Native Web if needed |
| No CRA | Vite already in use — no issue |
| No Redux | Zustand already in use — auth state added to Zustand store |
| No Material UI / Chakra | Custom components per UI-SPEC — no component library |
| GSD workflow enforcement | All code changes must go through `/gsd:execute-phase` |

---

## Sources

### Primary (HIGH confidence)

- `https://www.better-auth.com/docs/integrations/fastify` — Fastify catch-all route handler, CORS config, `fromNodeHeaders`, session retrieval
- `https://www.better-auth.com/docs/adapters/drizzle` — Drizzle adapter setup, provider config, schema generation CLI
- `https://www.better-auth.com/docs/concepts/session-management` — Session duration config, cookie caching, invalidation API
- `https://www.better-auth.com/docs/authentication/email-password` — signUp/signIn/signOut client methods, scrypt hashing default, password config options
- `https://www.better-auth.com/docs/concepts/cookies` — httpOnly default, cookie names, secure config
- `https://www.better-auth.com/docs/installation` — BETTER_AUTH_SECRET, BETTER_AUTH_URL env vars, table list (user, session, account, verification)
- `https://www.better-auth.com/docs/concepts/client` — createAuthClient, useSession hook API, baseURL config
- `https://reactrouter.com/start/declarative/routing` — BrowserRouter, Routes, Route, Outlet, Navigate — declarative mode SPA setup
- `https://orm.drizzle.team/docs/get-started/postgresql-new` — drizzle-orm PostgreSQL setup, drizzle.config.ts, drizzle-kit commands
- npm registry — all package versions confirmed against latest tag on 2026-04-02

### Secondary (MEDIUM confidence)

- `https://github.com/better-auth/better-auth/issues/6766` — drizzle-orm v1.0 beta incompatibility confirmed; fix PR #6913 exists but not merged; stay on 0.45.x
- `https://github.com/better-auth/better-auth/issues/7120` — name field required in signUp confirmed; email-prefix workaround documented
- `https://zod.dev/v4/versioning` — zod v4 subpath strategy; ^3.25.2 already contains v4 at `zod/v4`; root import now exports v4 at latest

### Tertiary (LOW confidence — marked for validation)

- Multiple GitHub discussions confirming `credentials: true` CORS requirement — consistent across all sources, but not explicitly in the official better-auth Fastify docs page fetched

---

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH — versions confirmed from npm registry; drizzle/better-auth compatibility confirmed via GitHub issue tracker
- Architecture: HIGH — patterns verified from official docs; Fastify integration code from official integration page
- Pitfalls: HIGH — each pitfall backed by official docs or confirmed GitHub issues
- Environment: HIGH — direct shell probe confirmed no Docker/PostgreSQL on machine

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (30 days; better-auth moves quickly — check for new releases before executing)
