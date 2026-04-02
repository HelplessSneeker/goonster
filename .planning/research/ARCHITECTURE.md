# Architecture Research

**Domain:** Short-form vertical video player web app — v1.1 User Auth & Connected Accounts
**Researched:** 2026-04-02
**Confidence:** HIGH (core auth patterns, Fastify plugin ecosystem) / MEDIUM (TikTok/Instagram OAuth specifics, Drizzle monorepo structure) / LOW (exact @fastify/oauth2 v8 Fastify 5 peer deps — unconfirmed from public docs)

---

## Part 1: Existing Architecture (v1.0 Baseline)

The v1.0 system is a clean two-tier architecture:

```
packages/frontend/src/        packages/backend/src/
  App.tsx                       server.ts (buildApp factory)
  main.tsx (QueryClientProvider)  routes/feed.ts
  components/Feed/*               routes/video.ts
  components/VideoPlayer/*        services/feedService.ts
  hooks/useFeed.ts                store/DiskVideoStore.ts
  hooks/useVideoPlayer.ts         store/VideoStore.ts (interface)
  store/feedStore.ts (Zustand)
  api/feedApi.ts (TanStack Query)
  lib/resolveVideoUrl.ts
```

Key integration points for v1.1 to work around:
- `server.ts` uses `buildApp(overrides?)` factory pattern — auth plugins register into this same factory
- `feedRoutes` and `videoRoutes` are unprotected — both need an auth preHandler in v1.1
- `main.tsx` wraps the app only in `QueryClientProvider` — a router and auth context need to be added
- `App.tsx` renders `<FeedContainer />` directly — needs a guard: unauthenticated users redirect to login

---

## Part 2: New System Overview (v1.1)

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER (v1.1)                         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    React SPA (Vite)                          │    │
│  │                                                              │    │
│  │  main.tsx                                                    │    │
│  │    └── QueryClientProvider                                   │    │
│  │          └── AuthProvider (new — Zustand authStore)         │    │
│  │                └── Router (wouter or mini router)            │    │
│  │                      ├── /login          → LoginPage         │    │
│  │                      ├── /register       → RegisterPage      │    │
│  │                      ├── /auth/callback  → OAuthCallback     │    │
│  │                      ├── / (protected)   → App (FeedContainer│    │
│  │                      └── /profile        → ProfilePage       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  New state: authStore (Zustand)                                      │
│    user: { id, email, name, avatarUrl } | null                       │
│    accessToken: string | null                                        │
│    isLoading: boolean                                                │
│                                                                      │
└──────────────────────────────────────────┬───────────────────────────┘
                                           │ HTTP (REST + Range + Auth)
┌──────────────────────────────────────────┼───────────────────────────┐
│                     SERVER LAYER (v1.1)  │                           │
│                                          │                           │
│  server.ts (buildApp factory)            │                           │
│    ├── @fastify/cors            (exists) │                           │
│    ├── @fastify/static          (exists) │                           │
│    ├── @fastify/cookie          (NEW — required by oauth2)           │
│    ├── @fastify/jwt v9+         (NEW — JWT sign/verify)              │
│    ├── @fastify/oauth2 v8+      (NEW — Google/TikTok/Instagram)      │
│    │                                                                  │
│    ├── routes/auth.ts           (NEW)                                │
│    │     POST /auth/register                                         │
│    │     POST /auth/login                                            │
│    │     POST /auth/refresh                                          │
│    │     POST /auth/logout                                           │
│    │     GET  /auth/google/start                                     │
│    │     GET  /auth/google/callback                                  │
│    │     GET  /auth/tiktok/start                                     │
│    │     GET  /auth/tiktok/callback                                  │
│    │     GET  /auth/instagram/start                                  │
│    │     GET  /auth/instagram/callback                               │
│    │                                                                  │
│    ├── routes/user.ts           (NEW)                                │
│    │     GET  /user/me                                               │
│    │     PUT  /user/profile                                          │
│    │     DELETE /user/connections/:provider                          │
│    │                                                                  │
│    ├── routes/feed.ts           (MODIFIED — add authenticate hook)  │
│    └── routes/video.ts          (MODIFIED — add authenticate hook)  │
│                                                                      │
│  services/                                                           │
│    ├── authService.ts           (NEW — hash, verify, token issue)   │
│    ├── oauthService.ts          (NEW — provider token exchange)     │
│    ├── userService.ts           (NEW — CRUD against DB)             │
│    └── feedService.ts           (UNCHANGED)                         │
│                                                                      │
│  db/                            (NEW PACKAGE LAYER)                  │
│    ├── schema.ts                (Drizzle table definitions)          │
│    ├── client.ts                (postgres.js connection + Drizzle)  │
│    └── migrations/              (drizzle-kit generated SQL)          │
│                                                                      │
└──────────────────────────────────────────┬───────────────────────────┘
                                           │
┌──────────────────────────────────────────┼───────────────────────────┐
│                      DATA LAYER (v1.1)   │                           │
│                                          │                           │
│  PostgreSQL                              │                           │
│    ├── users               (new)         │                           │
│    ├── oauth_accounts      (new)         │                           │
│    └── refresh_tokens      (new)         │                           │
│                                          │                           │
│  Video Files (disk — unchanged)          │                           │
│  metadata.json (unchanged for v1.1)      │                           │
│                                          │                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Part 3: Component Breakdown — New vs Modified

### New Backend Components

| Component | File | Responsibility |
|-----------|------|----------------|
| DB client | `backend/src/db/client.ts` | postgres.js connection, Drizzle instance, exported as `db` |
| DB schema | `backend/src/db/schema.ts` | Drizzle table definitions for users, oauth_accounts, refresh_tokens |
| Auth routes | `backend/src/routes/auth.ts` | Register, login, refresh, logout, OAuth start/callback endpoints |
| User routes | `backend/src/routes/user.ts` | /user/me, profile update, disconnect provider |
| Auth service | `backend/src/services/authService.ts` | Password hash (argon2id), JWT sign/verify, refresh token rotation |
| OAuth service | `backend/src/services/oauthService.ts` | Exchange auth code for provider tokens, fetch user profile |
| User service | `backend/src/services/userService.ts` | Create user, find by email/provider, upsert oauth_account |
| Auth decorator | Inside `server.ts` or plugin | `fastify.authenticate` preHandler reading JWT from Authorization header |

### Modified Backend Components

| Component | File | Change |
|-----------|------|--------|
| server.ts | `backend/src/server.ts` | Register @fastify/cookie, @fastify/jwt, @fastify/oauth2; add authenticate decorator; pass db to route plugins |
| feed routes | `backend/src/routes/feed.ts` | Add `{ preHandler: [fastify.authenticate] }` to GET /feed |
| video routes | `backend/src/routes/video.ts` | Add `{ preHandler: [fastify.authenticate] }` to GET /video/:id and static serving |

### New Frontend Components

| Component | File | Responsibility |
|-----------|------|----------------|
| Auth store | `frontend/src/store/authStore.ts` | Zustand store: user, accessToken, isLoading, setUser, clearAuth |
| Auth API | `frontend/src/api/authApi.ts` | fetch wrappers for register, login, logout, refresh, OAuth redirect |
| Login page | `frontend/src/pages/LoginPage.tsx` | Email/password form + OAuth buttons (Google, TikTok, Instagram) |
| Register page | `frontend/src/pages/RegisterPage.tsx` | Email/password registration form |
| OAuth callback | `frontend/src/pages/OAuthCallback.tsx` | Handles ?code= from provider, exchanges via backend, stores token |
| Profile page | `frontend/src/pages/ProfilePage.tsx` | Display name, avatar, connected accounts list with link/unlink |
| Protected route | `frontend/src/components/ProtectedRoute.tsx` | Renders children if authenticated, else redirects to /login |
| Router | `frontend/src/Router.tsx` | Client-side routing — wouter recommended (see below) |

### Modified Frontend Components

| Component | File | Change |
|-----------|------|--------|
| main.tsx | `frontend/src/main.tsx` | Add Router and AuthProvider wrapping around QueryClientProvider |
| App.tsx | `frontend/src/App.tsx` | Render via Router instead of bare FeedContainer |
| feedApi.ts | `frontend/src/api/feedApi.ts` | Add Authorization header with accessToken from authStore |
| resolveVideoUrl.ts | `frontend/src/lib/resolveVideoUrl.ts` | No change needed — URL structure unchanged |

### New Shared Types

| Type | File | Fields |
|------|------|--------|
| User | `shared/src/types/user.ts` | id, email, name, avatarUrl, createdAt |
| AuthResponse | `shared/src/types/auth.ts` | accessToken, user: User |
| ConnectedAccount | `shared/src/types/auth.ts` | provider, providerUserId, connectedAt |

---

## Part 4: Database Schema

Use Drizzle ORM with postgres.js. All new, no existing schema to migrate.

```typescript
// packages/backend/src/db/schema.ts

import { pgTable, text, timestamp, uuid, boolean } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id:          uuid('id').primaryKey().defaultRandom(),
  email:       text('email').notNull().unique(),
  name:        text('name').notNull(),
  avatarUrl:   text('avatar_url'),
  passwordHash: text('password_hash'),  // null if OAuth-only account
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().notNull(),
})

export const oauthAccounts = pgTable('oauth_accounts', {
  id:              uuid('id').primaryKey().defaultRandom(),
  userId:          uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider:        text('provider').notNull(),          // 'google' | 'tiktok' | 'instagram'
  providerUserId:  text('provider_user_id').notNull(),
  accessToken:     text('access_token'),
  refreshToken:    text('refresh_token'),
  tokenExpiresAt:  timestamp('token_expires_at'),
  connectedAt:     timestamp('connected_at').defaultNow().notNull(),
})

export const refreshTokens = pgTable('refresh_tokens', {
  id:          uuid('id').primaryKey().defaultRandom(),
  userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tokenHash:   text('token_hash').notNull().unique(),  // hash of the opaque token, never store raw
  expiresAt:   timestamp('expires_at').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  usedAt:      timestamp('used_at'),                  // set on rotation; detect reuse if non-null
  revokedAt:   timestamp('revoked_at'),
})
```

**Unique constraint on oauth_accounts:** `(provider, provider_user_id)` — prevents duplicate connections from the same provider account. Add this as a unique index in the migration.

**Why three tables, not a sessions table:**
The project uses JWT access tokens (short-lived, stateless) + opaque refresh tokens (stored as hashes). No session row is needed per request. The `refresh_tokens` table only records long-lived credentials, not per-request sessions. This is the correct pattern for a mobile-first app that may later become a native app — native apps cannot use httpOnly cookies for JWT the same way browsers do.

---

## Part 5: Authentication Flow

### Token Strategy

Use dual-token: short-lived JWT access token (15 min) sent in `Authorization: Bearer` header, plus an opaque refresh token (7 days) stored in an httpOnly Secure cookie. This is the canonical pattern for SPAs that want XSS resistance on refresh tokens while keeping API calls stateless.

```
Access token:  JWT, 15 minutes, in memory (authStore.accessToken)
Refresh token: opaque UUID, 7 days, httpOnly cookie, stored as hash in DB
```

**Why NOT localStorage for tokens:** XSS vulnerable. Any injected script reads tokens.
**Why NOT httpOnly cookie for access token:** The SPA cannot read httpOnly cookies to attach to API calls. Access tokens must be readable by JavaScript and kept only in memory (lost on page reload — by design, the refresh flow handles that).

### Email/Password Register Flow

```
POST /auth/register { email, name, password }
  → validate with zod (password min 8, email format)
  → check email uniqueness in DB
  → hash password with argon2id
  → INSERT into users
  → issue access JWT + refresh token
  → set refresh token as httpOnly cookie
  → return { accessToken, user }

Frontend:
  authStore.setUser({ accessToken, user })
  redirect to /
```

### Email/Password Login Flow

```
POST /auth/login { email, password }
  → find user by email
  → argon2.verify(hash, password)
  → issue tokens
  → set cookie, return { accessToken, user }

Frontend:
  authStore.setUser({ accessToken, user })
  redirect to /
```

### Token Refresh Flow

```
On app mount (main.tsx) OR on 401 response from API:
  POST /auth/refresh  (no body — refresh token read from cookie)
  → verify httpOnly refresh token cookie
  → find token hash in refresh_tokens, check not expired/revoked
  → rotate: mark old token used, issue new refresh token
  → return new { accessToken, user }

Frontend:
  authStore.setUser({ accessToken, user })
  retry original request with new token
```

**Token rotation detection:** If `usedAt` is non-null on a refresh token being presented, revoke ALL tokens for that user — the token was replayed, indicating theft. This is the industry-standard refresh token reuse detection pattern.

### OAuth Flow (Google as canonical example)

```
User clicks "Connect Google"
  → GET /auth/google/start
      @fastify/oauth2 generates state + PKCE verifier, stores in httpOnly cookies
      redirects to accounts.google.com/o/oauth2/auth?client_id=...&state=...

Google redirects to:
  → GET /auth/google/callback?code=...&state=...
      @fastify/oauth2 verifies state cookie (CSRF protection)
      exchanges code for Google tokens
      oauthService.fetchGoogleProfile(accessToken)
      → upsert into oauth_accounts (userId = current user or new user if signup)
      → if new user: create users record, issue tokens, set cookie
      → if existing user: just update oauth_accounts, redirect to profile
      → redirect to frontend /auth/callback?token=<short-lived exchange token>

Frontend /auth/callback page:
  → reads ?token= from URL
  → POST /auth/exchange { token } → returns { accessToken, user }
  → authStore.setUser(...)
  → redirect to /profile
```

**Why a short-lived exchange token for the callback redirect?** The backend callback handler cannot set the `Authorization: Bearer` header directly — it redirects the browser. Embedding the access JWT in the URL is a security risk (referrer headers, browser history). Instead, issue a one-time-use short-lived exchange token (60 second TTL), pass it in the URL, and let the frontend exchange it immediately. This is the cleanest SPA + OAuth pattern.

### TikTok OAuth — Specifics

TikTok's Login Kit for Web uses standard Authorization Code flow with PKCE. Key differences from Google:

- Authorization endpoint: `https://www.tiktok.com/v2/auth/authorize/`
- Token endpoint: `https://open.tiktokapis.com/v2/oauth/token/`
- Required scopes for v1.1 (account linking only, no content access): `user.info.basic`
- **App review required for production.** TikTok has a sandbox mode (create via Developer Portal) for development without review.
- TikTok is not in @fastify/oauth2's preset list — configure manually with `credentials.auth.tokenHost`, `credentials.auth.authorizePath`, `credentials.auth.tokenPath`.
- MEDIUM confidence on TikTok specifics — verify against https://developers.tiktok.com/doc/login-kit-web/ before implementation.

### Instagram OAuth — Specifics

The Instagram Basic Display API was shut down December 4, 2024. The replacement is the **Instagram API with Instagram Login** (launched July 2024), which requires:

- The user's Instagram account to be set as Professional (Business or Creator)
- A Meta App with the `instagram_business_basic` permission
- Authorization endpoint: `https://www.instagram.com/oauth/authorize`
- Token endpoint: `https://api.instagram.com/oauth/access_token`

**Critical implication for v1.1:** Instagram login cannot be used for general user authentication (Meta explicitly prohibits using API data as an auth mechanism). Instagram in v1.1 is purely a **connected account** (link your IG professional account), not a login method. Only Google and TikTok support sign-in. Instagram is a connect-only flow available on the profile page after login.

- MEDIUM confidence on Instagram specifics — verify against https://developers.facebook.com/docs/instagram-platform/ before implementation.

---

## Part 6: Frontend Routing

Add a minimal client-side router. The existing codebase has no router. Two options:

**Recommended: wouter** — 1.4KB, no extra context, works with existing Zustand/TanStack Query setup, React 19 compatible, no file-system routing opinions.

**Alternative: React Router v7** — much larger, forces opinions about loaders/actions, adds complexity that isn't needed for 4 routes.

```typescript
// frontend/src/Router.tsx
import { Switch, Route, Redirect } from 'wouter'
import { useAuthStore } from './store/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <LoadingSpinner />
  if (!user) return <Redirect to="/login" />
  return <>{children}</>
}

export function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/auth/callback" component={OAuthCallback} />
      <Route path="/profile">
        <ProtectedRoute><ProfilePage /></ProtectedRoute>
      </Route>
      <Route path="/">
        <ProtectedRoute><App /></ProtectedRoute>
      </Route>
    </Switch>
  )
}
```

---

## Part 7: Auth State in Frontend

Extend `feedStore.ts` pattern with a parallel `authStore.ts`. Do not add auth state to `feedStore` — keep concerns separated.

```typescript
// frontend/src/store/authStore.ts
interface AuthStore {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  setAuth: (user: User, accessToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}
```

**On app mount:** `main.tsx` calls `POST /auth/refresh` before rendering. If it succeeds, `setAuth`. If it fails (no valid refresh token cookie), `clearAuth`. This restores session across page reloads without localStorage.

**Attaching token to API calls:** The existing `feedApi.ts` uses TanStack Query. Add a custom `fetch` wrapper or configure `queryClient` with a `defaultOptions.queries.queryFn` that reads `authStore.getState().accessToken` and attaches it. Do not pass the token as a prop — read from store directly.

```typescript
// frontend/src/api/feedApi.ts — modification
const authedFetch = (url: string, options?: RequestInit) => {
  const token = useAuthStore.getState().accessToken  // Zustand vanilla access
  return fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })
}
```

---

## Part 8: Backend Plugin Registration Order

Order matters in Fastify due to plugin encapsulation. The correct order in `server.ts`:

```typescript
// 1. CORS first (applies to all routes)
await server.register(cors, { ... })

// 2. Cookie — must be before oauth2
await server.register(cookie, { secret: process.env.COOKIE_SECRET })

// 3. JWT — decorates server with fastify.jwt, fastify.authenticate
await server.register(jwt, {
  secret: process.env.JWT_SECRET,
  sign: { expiresIn: '15m' },
})

// 4. Auth decorator (added inline after jwt registration)
server.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token invalid or expired' } })
  }
})

// 5. OAuth2 providers (each as a separate registration with a name)
await server.register(oauth2, { name: 'googleOAuth2', credentials: { ... }, ... })
// TikTok and Instagram: manual credential config, same plugin registered twice more

// 6. Static plugin (unchanged)
await server.register(staticPlugin, { root: ..., prefix: '/video/' })

// 7. Routes — inject db and store
await server.register(authRoutes, { db })
await server.register(userRoutes, { db })
await server.register(feedRoutes, { store })   // now adds authenticate preHandler
await server.register(videoRoutes, { store })
```

---

## Part 9: Database Setup in Monorepo

The Drizzle schema and migrations live inside `packages/backend`. This is the correct choice for a project of this size. A separate `packages/db` package is only justified when multiple services share the schema.

```
packages/backend/
  src/
    db/
      schema.ts       ← Drizzle table definitions
      client.ts       ← postgres.js + drizzle() instance
      index.ts        ← re-export db, schema
    migrations/       ← drizzle-kit generated SQL files
  drizzle.config.ts   ← points to src/db/schema.ts, migrations/
```

The `db` client is instantiated once in `server.ts` (or injected via buildApp overrides for testing) and passed to route plugins via Fastify's plugin options — same pattern as `VideoStore`.

```typescript
// packages/backend/src/db/client.ts
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema.js'

const sql = postgres(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })
export type DB = typeof db
```

For testing: pass a test database URL (or a transaction-wrapped connection) via `buildApp({ db: testDb })`.

---

## Part 10: Profile Page Architecture

The profile page is a read/write view with three concerns:

1. **Display name + avatar** — read from `users.name`, `users.avatar_url`; editable via PUT /user/profile
2. **Connected accounts list** — read from `oauth_accounts` joined to users; shows which providers are linked
3. **Link/unlink actions** — linking triggers OAuth flow from profile page; unlinking sends DELETE /user/connections/:provider

```
GET /user/me
→ { user: User, connections: ConnectedAccount[] }

Profile page renders:
  ├── Avatar (users.avatar_url or initials fallback)
  ├── Name (editable inline)
  ├── Email (read-only)
  └── Connected Accounts
        ├── Google: connected [unlink button] | [connect button]
        ├── TikTok: connected [unlink button] | [connect button]
        └── Instagram: connected [unlink button] | [connect button]
```

**Unlink guard:** If a user has only one auth method (e.g., signed up with Google only, no password), prevent unlinking the last connection. The backend enforces this: `DELETE /user/connections/:provider` returns 409 if it would leave the user with no login method.

---

## Part 11: Build Order (Dependency Graph)

Dependencies run from bottom to top. Each layer is a prerequisite for the next.

```
Layer 1: Database Foundation
  ├── PostgreSQL schema (drizzle schema.ts + initial migration)
  ├── DB client (postgres.js + drizzle client.ts)
  └── userService.ts (create, findByEmail, findByProvider)

Layer 2: Auth Core (depends on Layer 1)
  ├── authService.ts (argon2id hash/verify, JWT sign/verify, refresh token logic)
  ├── Email/password register endpoint (POST /auth/register)
  ├── Email/password login endpoint (POST /auth/login)
  ├── Token refresh endpoint (POST /auth/refresh)
  └── Logout endpoint (POST /auth/logout)

Layer 3: Frontend Auth Shell (depends on Layer 2)
  ├── authStore.ts (Zustand)
  ├── Router.tsx (wouter, 4 routes)
  ├── LoginPage.tsx (email/password form only — no OAuth buttons yet)
  ├── RegisterPage.tsx
  ├── ProtectedRoute.tsx
  └── feedApi.ts modification (attach Authorization header)

Layer 4: Feed Guard (depends on Layer 2 + 3)
  ├── Add authenticate preHandler to GET /feed
  ├── Add authenticate preHandler to GET /video/:id static serving
  └── Verify full feed flow works end-to-end with auth

Layer 5: OAuth Framework (depends on Layer 2)
  ├── @fastify/cookie + @fastify/oauth2 registration
  ├── Google OAuth start + callback endpoints
  ├── oauthService.ts (token exchange, profile fetch, upsert logic)
  ├── OAuthCallback.tsx frontend page
  └── Google login button on LoginPage

Layer 6: Profile Page (depends on Layer 3 + 5)
  ├── GET /user/me endpoint
  ├── PUT /user/profile endpoint
  ├── DELETE /user/connections/:provider endpoint
  └── ProfilePage.tsx (display + connected accounts UI)

Layer 7: TikTok + Instagram OAuth (depends on Layer 5)
  ├── TikTok start/callback (manual @fastify/oauth2 config)
  ├── Instagram start/callback (manual config, connect-only)
  └── TikTok/Instagram buttons on LoginPage/ProfilePage
```

**Why this order:**
- Layer 1-2 first: auth cannot be tested without a DB, and the DB schema is the most foundational decision — a mistake here requires a migration.
- Layer 3 before Layer 4: the frontend needs to be able to send tokens before the backend starts rejecting unauthenticated requests; otherwise you break development entirely.
- Layer 4 after 3: gating the feed is the product requirement, but don't do it before the auth flow is end-to-end testable.
- Layer 5 before 6: profile page shows connected accounts, which requires OAuth to be working.
- Layer 7 last: TikTok/Instagram require app registration, sandbox setup, and potential review cycles. Google is fastest to test locally. Always build Google first.

---

## Part 12: Anti-Patterns to Avoid

### Anti-Pattern 1: Protecting Video Static Files via a Route Handler

The existing `server.ts` uses `@fastify/static` with a URL prefix. The static plugin handles requests before any route handler. You cannot add a preHandler to a static file prefix.

**Do this instead:** Create a Fastify route handler for `/video/:id` that verifies the JWT, then streams the file manually (or calls the VideoStore). This route already exists in `routes/video.ts` — protect that route and disable the static plugin's `/video/` prefix, or keep the static plugin for other assets and serve all video files through the authenticated route.

Alternatively, accept that video bytes are large and add a signed URL expiry approach in a later milestone — for v1.1, requiring a valid JWT to get video bytes is correct.

### Anti-Pattern 2: Storing Access Tokens in localStorage

XSS-vulnerable. Any `<script>` on the page reads it. Store the access token only in memory (Zustand state). The refresh token is in an httpOnly cookie. On page reload, the app calls /auth/refresh to restore the session. This is standard and adds ~100ms to initial load — acceptable.

### Anti-Pattern 3: Multiple @fastify/oauth2 Registrations Sharing State

Each OAuth provider requires a separate plugin registration with a unique `name`. Sharing one registration for multiple providers causes state conflicts in the cookie-based PKCE flow. Register once per provider: `googleOAuth2`, `tiktokOAuth2`, `instagramOAuth2`.

### Anti-Pattern 4: One-Size-Fits-All OAuth Error Page

OAuth callbacks fail for many reasons (user denied, state mismatch, provider error, network timeout). Always check `error` and `error_description` query params in the callback before attempting code exchange. Redirect to `/login?error=oauth_denied` (or similar) rather than crashing. The frontend OAuthCallback component must handle this.

### Anti-Pattern 5: Allowing Unlink When No Other Auth Method Exists

If a user signed up via Google (no password set), and you allow unlinking Google, they have no way to log in. Backend must check: does the user have `passwordHash` set OR at least one other connected account? If neither would remain after the unlink, return 409 Conflict.

### Anti-Pattern 6: Passing DB to Feed/Video Routes

The feed and video routes do not need database access. Only auth and user routes need the DB. Keep the `VideoStore` interface as the only dependency for feed/video routes. Do not contaminate the clean video-serving layer with DB concerns.

---

## Part 13: Key Dependencies

| Package | Version | Notes |
|---------|---------|-------|
| @fastify/jwt | ^9.x | v9+ supports Fastify 5. HIGH confidence — official README. |
| @fastify/oauth2 | ^8.x | v8.x appears to target Fastify 5 (v8.2.0 current on npm). MEDIUM confidence — peer deps not confirmed from official source. Verify before install. |
| @fastify/cookie | ^11.x | Required by @fastify/oauth2 v7.2+. Register before oauth2. |
| drizzle-orm | ^0.43.x | PostgreSQL support, TypeScript-first, active 2025 development. |
| drizzle-kit | ^0.30.x | Migration generation. Match major version to drizzle-orm. |
| postgres | ^3.x | postgres.js — fastest JS PostgreSQL driver, ESM native, used with drizzle-orm/postgres-js adapter. |
| argon2 | ^0.43.x | Ships TypeScript types. Argon2id variant. Winner of Password Hashing Competition. Preferred over bcrypt for new projects in 2025. |
| wouter | ^3.x | Minimal router (1.4KB). React 19 compatible. No file-system routing. |

---

## Part 14: Environment Variables

New variables needed in v1.1:

```bash
DATABASE_URL=postgresql://user:password@localhost:5432/goonster
JWT_SECRET=<64-byte random hex>
COOKIE_SECRET=<32-byte random hex — used by @fastify/cookie for signing>
JWT_REFRESH_EXPIRES_IN=7d
JWT_ACCESS_EXPIRES_IN=15m

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# TikTok OAuth (sandbox first)
TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_CALLBACK_URL=http://localhost:3000/auth/tiktok/callback

# Instagram (Meta App)
INSTAGRAM_APP_ID=...
INSTAGRAM_APP_SECRET=...
INSTAGRAM_CALLBACK_URL=http://localhost:3000/auth/instagram/callback
```

Use zod to validate all env vars at `buildApp()` startup — fail fast with a clear error rather than crashing mid-request when a variable is missing.

---

## Sources

- https://github.com/fastify/fastify-jwt — @fastify/jwt v9+ supports Fastify 5 (HIGH confidence — official README)
- https://github.com/fastify/fastify-oauth2 — @fastify/oauth2 cookie-based PKCE, provider presets, v7.2+ cookie requirement (HIGH confidence — official README)
- https://developers.tiktok.com/doc/login-kit-web/ — TikTok Login Kit Web OAuth2 flow, PKCE, sandbox mode (MEDIUM confidence)
- https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/ — Instagram Basic Display API deprecated Dec 2024 (HIGH confidence — official Meta announcement)
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/ — Instagram API with Instagram Login replacement (MEDIUM confidence)
- https://orm.drizzle.team/docs/get-started/postgresql-new — Drizzle ORM PostgreSQL setup (HIGH confidence — official docs)
- https://gist.github.com/productdevbook/7c9ce3bbeb96b3fabc3c7c2aa2abc717 — Drizzle ORM PostgreSQL best practices 2025 (MEDIUM confidence)
- https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/ — Argon2id recommendation 2025-2026 (MEDIUM confidence)
- https://mihai-andrei.com/blog/refresh-token-reuse-interval-and-reuse-detection/ — Refresh token rotation + reuse detection pattern (MEDIUM confidence)
- https://medium.com/@brian_njuguna/jwt-authentication-and-refresh-token-implementation-with-nodejs-express-postgres-and-drizzle-orm-d6709ca755e1 — JWT + Drizzle implementation reference (MEDIUM confidence)

---

*Architecture research for: Goonster v1.1 — User Authentication & Connected Accounts*
*Researched: 2026-04-02*
