# Domain Pitfalls

**Domain:** Mobile-first short-form vertical video player web app
**Researched:** 2026-04-02 (v1.1 auth section added); 2026-04-01 (v1.0 video player section)
**Confidence:** HIGH for video player pitfalls (iOS/Android constraints verified against WebKit official docs and MDN); MEDIUM–HIGH for auth/OAuth/PostgreSQL pitfalls (verified against official platform docs, OWASP, and multiple sources)

---

# Part 1: v1.1 — Authentication, OAuth, and PostgreSQL Pitfalls

These pitfalls are specific to adding user auth (email/password + OAuth), connected accounts (Google, TikTok, Instagram), and PostgreSQL to an existing Fastify 5 + React 19 application that currently has no auth or database.

---

## Critical Pitfalls

### Pitfall A1: Fastify Plugin Encapsulation Breaks Auth Decorators Across Routes

**What goes wrong:**
Registering `@fastify/jwt` or `@fastify/session` inside a nested plugin scope (e.g., inside a route group plugin) makes those decorators invisible to routes registered in sibling or parent scopes. Routes outside that scope call `request.jwtVerify()` and get a runtime error saying the method doesn't exist. This is not a JWT configuration bug — it's Fastify's encapsulation model working as designed.

**Why it happens:**
Fastify's plugin system is strictly scoped. Decorators, hooks, and plugins registered in a child context are not available in parent or sibling contexts. Developers new to Fastify assume plugins work like Express middleware — registered once, available everywhere. They register auth inside a route file, then wonder why the decorator is missing on other routes.

**Consequences:**
- Runtime crashes when any unprotected-but-decorated route is hit
- Inconsistent auth coverage — some routes protected, others silently unprotected
- Can masquerade as a JWT secret or token problem (the wrong error message)

**Prevention:**
Register all auth plugins (JWT, session, cookie) at the root Fastify instance level, **or** wrap them with `fastify-plugin` (the `fp()` wrapper) to opt out of encapsulation. The `fastify-plugin` wrapper tells Fastify to export the plugin's decorators to the parent context.

```typescript
// Wrong: registered inside a scoped plugin, not available outside
fastify.register(async (scopedInstance) => {
  scopedInstance.register(fastifyJwt, { secret: '...' }); // scoped only
  scopedInstance.get('/protected', ...);
});

// Correct: registered at root, or with fp() wrapper
import fp from 'fastify-plugin';
export default fp(async (fastify) => {
  fastify.register(fastifyJwt, { secret: process.env.JWT_SECRET });
  fastify.decorate('authenticate', async (request, reply) => {
    await request.jwtVerify();
  });
});
```

**Detection:**
`TypeError: request.jwtVerify is not a function` on routes outside the auth plugin's scope.

**Phase to address:** Phase 1 (Auth infrastructure / plugin registration)

---

### Pitfall A2: `decorateRequest` with a Reference Type Shares State Across All Requests

**What goes wrong:**
Attaching an object to a Fastify request decorator using `fastify.decorateRequest('user', {})` creates a **shared reference** — the same object instance is mutated by every concurrent request. Request A's user data bleeds into Request B. In an auth context, this means User A could see User B's identity. Fastify emits a deprecation warning about this, but the code still runs, so it's easy to miss in development under low concurrency.

**Why it happens:**
Developers follow Node.js/Express patterns where `req.user = ...` is safe per-request. In Fastify, `decorateRequest` with an object literal as the initial value registers one shared object, not a factory. The mutation happens in hooks, and since HTTP servers under load have many concurrent requests, the state collision appears as intermittent auth bugs that don't reproduce under single-user testing.

**Consequences:**
- Auth bypass: one user sees another user's session data
- Intermittent — only surfaces under concurrent load, invisible in sequential unit tests
- Data leakage between user sessions

**Prevention:**
Always initialize reference-type decorators with `null` (not `{}`), and assign the real value per-request inside an `onRequest` or `preHandler` hook:

```typescript
// Declare the decorator shape (null initial value — no shared reference)
fastify.decorateRequest('currentUser', null);

// Populate per-request in a hook
fastify.addHook('preHandler', async (request) => {
  if (request.headers.authorization) {
    request.currentUser = await resolveUser(request);
  }
});
```

**Detection:**
Fastify logs `[FSTDEP006] FastifyDeprecation: You are decorating Request/Reply with a reference type. This reference is shared amongst all requests.` — treat this as a blocking error, not a warning.

**Phase to address:** Phase 1 (Auth infrastructure)

---

### Pitfall A3: Instagram Basic Display API is Gone — Wrong OAuth Flow Used

**What goes wrong:**
Instagram's Basic Display API reached end-of-life on December 4, 2024. All requests return errors. Developers who research "Instagram OAuth Node.js" find articles from 2021–2023 describing the Basic Display API flow (`/oauth/authorize` with `scope=user_profile,user_media`) and implement a dead integration. The OAuth redirect succeeds (Instagram's auth server still accepts the request) but token exchange fails or returns an error.

**Why it happens:**
Most Node.js OAuth tutorials and many third-party libraries (passport-instagram, etc.) were written for the now-deprecated Basic Display API. Meta's migration path is not obvious from search results, and the new "Instagram Login" API (launched mid-2024) only supports Business and Creator accounts — not personal accounts.

**Consequences:**
- Complete integration failure post-December 2024
- Personal Instagram accounts cannot be connected at all — only Business/Creator accounts
- OAuth redirect may partially succeed, creating a confusing debugging experience

**Prevention:**
Use the new **Instagram API with Instagram Login** (`instagram_business_basic` scope). Accept that personal Instagram accounts are not connectable. The new flow requires a Meta developer app with the `instagram_business_basic` scope approved. Implement this as "connect your Instagram Business or Creator account."

Key scope changes (old scopes deprecated January 27, 2025):
- Old: `user_profile`, `user_media` → Dead
- New: `instagram_business_basic`, `instagram_business_content_publish` → Active

**Detection:**
OAuth callback returns error JSON from Meta's token endpoint; or token exchange succeeds but all Graph API calls return permission errors.

**Phase to address:** Phase 2 (OAuth provider implementations) — must verify against current Meta docs before implementing, not from search results or tutorials.

---

### Pitfall A4: TikTok OAuth Uses Non-Standard Parameters That Break Generic OAuth Libraries

**What goes wrong:**
TikTok's OAuth implementation deviates from RFC 6749 in a critical way: it uses `client_key` instead of `client_id` as the parameter name in both the authorization request and the token exchange request. Generic OAuth libraries (passport, grant, simple-oauth2) that follow the standard will send `client_id`, which TikTok ignores or rejects. The authorization step may succeed (browser redirect works), but token exchange silently fails or returns `invalid_client`.

Additionally, TikTok does not allow `localhost` as a redirect URI, making local development without a tunnel impossible.

**Why it happens:**
TikTok built its OAuth system before widespread standardization and never updated the parameter names. Most OAuth client libraries hard-code `client_id` per the RFC. Developers assume TikTok uses standard OAuth and only discover the deviation when token exchange fails.

**Consequences:**
- Token exchange fails entirely with a generic error
- Must proxy or manually construct token exchange requests
- Local development requires a public tunnel (ngrok, Cloudflare Tunnel, etc.) for every test

**Prevention:**
Do not use a generic OAuth library for TikTok. Build the TikTok OAuth flow manually or use a TikTok-specific adapter:

```typescript
// TikTok token exchange — must use client_key, not client_id
const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_key: process.env.TIKTOK_CLIENT_KEY,   // NOT client_id
    client_secret: process.env.TIKTOK_CLIENT_SECRET,
    code,
    grant_type: 'authorization_code',
    redirect_uri: REDIRECT_URI,
  }),
});
```

For local development: set up a permanent ngrok or Cloudflare Tunnel subdomain and register it as the redirect URI in the TikTok developer console.

**Detection:**
Token endpoint returns `{ error: "invalid_client" }` or empty response when `client_id` is sent instead of `client_key`.

**Phase to address:** Phase 2 (TikTok OAuth implementation)

---

### Pitfall A5: Auto-Linking OAuth Accounts by Email Creates Account Takeover Vulnerability

**What goes wrong:**
When a user signs in with Google (email: user@gmail.com) and you have an existing email/password account with the same address, auto-linking them appears helpful but is a security vulnerability. An attacker who controls any OAuth provider that supplies the target email as a claim (verified or not) can take over the victim's account. The nOAuth vulnerability (Azure AD, 2023) and Google domain-reuse attacks both exploited this pattern.

**Why it happens:**
Email appears to be a natural primary key for user identity. Auto-linking "same email = same person" feels like good UX. OAuth tokens do include an email claim, so developers treat it as reliable. The flaw is that OAuth email claims vary in verification guarantees across providers, and email addresses can be recycled (domain expiry, provider account deletion and recreation).

**Consequences:**
- Complete account takeover — attacker controls the victim's connected accounts
- Exploitable through any OAuth provider that allows email registration without strict verification
- Difficult to detect after the fact — looks like a normal login

**Prevention:**
Never auto-link accounts by email. Require **explicit user confirmation** to link a new OAuth identity to an existing account: user must be actively logged in and initiate the link from their profile page. Use the provider's **immutable user ID** (Google: `sub` claim; TikTok: `open_id`; Meta: `id`) as the foreign key in the `connected_accounts` table, never the email. Store email as display data only, not as an identity key.

Database schema principle:
```sql
-- Correct: provider + provider_user_id as the unique identity key
CREATE TABLE connected_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  provider VARCHAR(50) NOT NULL,         -- 'google', 'tiktok', 'instagram'
  provider_user_id VARCHAR(255) NOT NULL, -- immutable ID from provider
  access_token TEXT,
  refresh_token TEXT,
  UNIQUE(provider, provider_user_id)     -- not UNIQUE(provider, email)
);
```

**Detection:**
Review whether the account linking code path checks `email` match vs `provider + provider_user_id` match. If email is in the lookup query for linking, the vulnerability exists.

**Phase to address:** Phase 1 (Database schema design) + Phase 2 (OAuth callback handlers)

---

### Pitfall A6: Using `drizzle-kit push` in Production Destroys Schema History

**What goes wrong:**
`drizzle-kit push` applies schema changes directly to the database without generating migration files. In development this is convenient. Developers who use it to "just get the schema in" during early production setup lose the migration history needed to apply incremental changes to future database instances (CI, staging, production replicas). When a new environment needs to be provisioned, there is no migration trail — only the Drizzle schema file, which cannot tell you the sequence of changes that got the DB to its current state.

**Why it happens:**
`drizzle-kit push` is fast and the docs don't prominently warn against production use in the "getting started" flow. Developers use it while the project is young ("it's just dev anyway"), then forget to switch to `generate`/`migrate` before the first real deployment.

**Consequences:**
- Cannot replay schema history on a fresh database
- CI/CD pipelines that run `drizzle-kit migrate` fail because the `migrations/` directory is empty
- Rollback becomes impossible — no down migrations
- First time this breaks is usually in a staging deploy before launch

**Prevention:**
Use `drizzle-kit push` only on a local development database. For all other environments (staging, production, CI), use the generate + migrate workflow from day one:

```bash
# Add new table/column: generate a migration file first
npx drizzle-kit generate

# Apply the migration to the target database
npx drizzle-kit migrate

# NEVER in staging/production:
# npx drizzle-kit push  <-- destroys migration history
```

Commit the `drizzle/migrations/` directory to git. Treat migration files as append-only — never modify historical migrations.

**Detection:**
Check whether `drizzle/migrations/` directory exists and contains `.sql` files. If it's empty and the schema exists in the DB, `push` was used.

**Phase to address:** Phase 1 (Database setup)

---

### Pitfall A7: Storing JWT Access Tokens in localStorage Enables XSS Session Theft

**What goes wrong:**
Storing the JWT in `localStorage` is the most common React SPA auth pattern shown in tutorials because it's simple. Any XSS vulnerability — including one from a compromised npm package or an unsanitized user input — gives an attacker `localStorage.getItem('token')` and full access to the user's session with no expiry constraint. For a social app with OAuth tokens and connected platform accounts, this is a high-severity breach.

**Why it happens:**
`localStorage` is simple to implement, survives page refreshes, and all tutorials for "React JWT auth" default to it. The XSS risk is abstract until it materializes.

**Consequences:**
- Session token theft via any XSS vector
- Connected platform OAuth tokens (Google, TikTok, Instagram) potentially exposed
- No way to revoke a stolen token short of rotating all secrets

**Prevention:**
Store the access token in memory (React state or Zustand store) — not `localStorage`. Store the refresh token in an `httpOnly`, `SameSite=Lax`, `Secure` cookie. The access token is lost on page refresh (by design), and the refresh token cookie silently renews it. This is the defense-in-depth pattern recommended by OWASP.

On the Fastify backend, use `@fastify/cookie` with `@fastify/session` or manually set the refresh token cookie with proper flags:

```typescript
reply.setCookie('refresh_token', token, {
  httpOnly: true,    // inaccessible to JavaScript
  secure: true,      // HTTPS only in production
  sameSite: 'lax',   // CSRF protection
  path: '/auth',     // only sent to refresh endpoint
  maxAge: 60 * 60 * 24 * 30, // 30 days
});
```

**Detection:**
Search for `localStorage.setItem` and `localStorage.getItem` in the auth flow code.

**Phase to address:** Phase 1 (Auth token strategy) + Phase 3 (Frontend auth implementation)

---

## Moderate Pitfalls

### Pitfall B1: OAuth State Parameter Not Validated — CSRF on Login Flow

**What goes wrong:**
The OAuth authorization request includes a `state` parameter designed to prevent CSRF attacks on the callback. If the server does not generate a random `state` value, store it in the session before the redirect, and verify it on callback, an attacker can craft a malicious callback URL and force a victim's browser to link the attacker's OAuth identity to the victim's account.

**Prevention:**
Generate a cryptographically random `state` value for every OAuth initiation. Store it server-side (in the session or a short-lived DB record). On callback, reject any request where the returned `state` does not match the stored value.

```typescript
import crypto from 'node:crypto';

// On /auth/:provider/start
const state = crypto.randomBytes(32).toString('hex');
request.session.oauthState = state;
const authUrl = `${provider.authUrl}?...&state=${state}`;

// On /auth/:provider/callback
if (request.query.state !== request.session.oauthState) {
  return reply.code(403).send({ error: 'Invalid state — possible CSRF' });
}
```

**Phase to address:** Phase 2 (OAuth callback handlers)

---

### Pitfall B2: Not Implementing PKCE for the SPA's OAuth Initiation Flow

**What goes wrong:**
OAuth 2.1 (and current best practices) require PKCE (Proof Key for Code Exchange) for all public clients — including SPAs. Without PKCE, if the authorization code is intercepted (via referrer headers, browser history, or open redirect), it can be exchanged for tokens without the original client. For a mobile-first web app that may later be wrapped as a native app, PKCE is non-negotiable.

**Prevention:**
Generate a `code_verifier` (random string) and `code_challenge` (SHA-256 of verifier) at auth initiation. Include `code_challenge` and `code_challenge_method=S256` in the authorization request. Send `code_verifier` during token exchange. Google supports PKCE natively; TikTok supports it; Meta/Instagram supports it.

**Phase to address:** Phase 2 (OAuth flow implementation)

---

### Pitfall B3: PostgreSQL Connection Pool Not Registered in Fastify Startup Sequence

**What goes wrong:**
Registering the database plugin after route plugins causes routes to attempt database access before the pool is ready. In Fastify's async plugin registration sequence, if a route handler calls `fastify.pg.query(...)` and the plugin hasn't fully registered yet, it throws `TypeError: Cannot read properties of undefined`. This is a timing/ordering problem, not a config problem.

**Prevention:**
Register the database plugin before all route plugins. Use `await fastify.register(dbPlugin)` or rely on Fastify's built-in plugin ordering guarantee (plugins registered first are ready first). Use `fastify-plugin` wrapper on the DB plugin so the `fastify.db` decorator is available at the root level.

```typescript
// Correct order in server.ts
await fastify.register(databasePlugin);  // must be first
await fastify.register(authPlugin);      // depends on db
await fastify.register(userRoutes);      // depends on auth + db
```

**Detection:**
`TypeError: Cannot read properties of undefined (reading 'query')` at startup or on first request.

**Phase to address:** Phase 1 (Server bootstrap / plugin registration order)

---

### Pitfall B4: Running Database Migrations at App Startup Without a Lock Causes Race Conditions

**What goes wrong:**
Calling `migrate(db, { migrationsFolder: './drizzle' })` inside `server.ts` before `fastify.listen()` seems clean but creates a race condition in any multi-instance deployment (Docker replicas, PM2 clusters, rolling deploys). Two instances start simultaneously, both run `migrate()`, and the second migration run fails because the first already applied the changes — or worse, both try to apply the same migration and corrupt the `drizzle_migrations` table.

**Why it happens:**
The Drizzle docs show `migrate()` in startup examples, which is correct for single-instance development but wrong for production multi-instance deployments.

**Prevention:**
Run migrations as a separate one-off step in CI/CD before deploying new app instances. Do not run migrations in `server.ts`. Use a dedicated `npm run migrate` script that runs once per deployment:

```typescript
// scripts/migrate.ts — run as a pre-deploy step, not inside the server
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
const db = drizzle(pool);
await migrate(db, { migrationsFolder: './drizzle' });
process.exit(0);
```

For v1.1 single-instance dev, startup migration is acceptable. Document the switch required before horizontal scaling.

**Phase to address:** Phase 1 (Database setup) — acceptable at dev but flag for production

---

### Pitfall B5: OAuth Token Refresh Not Implemented — Silent Failures After Token Expiry

**What goes wrong:**
Google access tokens expire in 1 hour. TikTok access tokens expire in 24 hours. Instagram access tokens need refreshing on a longer cycle but still expire. If the backend stores access tokens but never refreshes them, all API calls on behalf of connected accounts silently fail after expiry. Users see their connected accounts listed as active but operations fail with 401 errors from the upstream platform.

**Prevention:**
Store `expires_at` alongside every access token. Before making any platform API call, check expiry and refresh if needed. Implement a token refresh function per provider. For v1.1 (architectural OAuth, no content-pulling), this is a deferred concern — but the schema must have the `expires_at` and `refresh_token` columns from day one to avoid a data migration later.

```sql
-- Required columns in connected_accounts from day one
access_token TEXT,
refresh_token TEXT,
token_expires_at TIMESTAMPTZ,
```

**Phase to address:** Phase 1 (Schema design) — columns required now; refresh logic deferred to content-pulling milestone

---

### Pitfall B6: Auth-Gating the Existing Feed Without Handling the Auth State Loading Race

**What goes wrong:**
The existing feed app loads and immediately renders video content. When auth is added, the frontend needs to check auth state before rendering the feed. If this check is async (a `/auth/me` API call), there's a window between page load and auth resolution where the feed flickers — either showing content to unauthenticated users for a moment, or showing a blank screen before the auth check resolves. Mobile users on slow connections see this as a broken experience.

**Why it happens:**
The existing app has no auth concept. TanStack Query's `useQuery` for auth state is async by design. Developers add a `ProtectedRoute` wrapper but don't handle the loading state — they only handle `isAuthenticated: true` and `isAuthenticated: false`, forgetting `isLoading: true`.

**Prevention:**
Handle three auth states explicitly: `loading`, `authenticated`, and `unauthenticated`. During loading, show a neutral splash screen (not the feed and not the login page):

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery({ queryKey: ['auth/me'], ... });

  if (isLoading) return <SplashScreen />;        // not null, not feed
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}
```

Consider storing the auth state in an `httpOnly` session cookie so the server can redirect unauthenticated requests before they reach the SPA, eliminating the flicker entirely.

**Phase to address:** Phase 3 (Frontend auth integration)

---

### Pitfall B7: Retrofitting Auth Routes Without a Consistent Error Response Shape

**What goes wrong:**
The existing v1.0 Fastify routes return errors in whatever shape each route handler decided. When auth middleware is added (JWT verification failures, session expiry, 403 forbidden), auth errors are returned in a different shape from existing API errors. The React app must now handle two error formats — or worse, the auth error is interpreted as a data fetch error and shown to the user as "Failed to load videos" instead of "Please log in."

**Prevention:**
Define a standard error response envelope before adding auth, and ensure all existing routes and new auth routes use it:

```typescript
// Standard error shape — establish this in shared/types
interface ApiError {
  error: string;   // machine-readable code
  message: string; // human-readable
  statusCode: number;
}

// In Fastify: set error handler in root instance
fastify.setErrorHandler((error, request, reply) => {
  reply.code(error.statusCode || 500).send({
    error: error.code || 'INTERNAL_ERROR',
    message: error.message,
    statusCode: error.statusCode || 500,
  });
});
```

**Phase to address:** Phase 1 (Auth infrastructure) — standardize before adding any auth routes

---

## Minor Pitfalls

### Pitfall C1: Weak bcrypt Cost Factor for Password Hashing

**What goes wrong:**
Using bcrypt with a cost factor below 12 makes brute-force attacks faster than necessary. Default examples in many Node.js tutorials use cost factor 10 (circa 2010 recommendation). OWASP's 2025 recommendation is cost factor 12 minimum; argon2id is preferred for new projects.

**Prevention:**
Use `argon2id` for new implementations (native Node.js crypto module in Node 22 supports `crypto.hash` but not argon2 — use the `argon2` npm package). If using bcrypt, use cost factor 12+.

```typescript
import argon2 from 'argon2';
const hash = await argon2.hash(password); // defaults to argon2id, secure params
const valid = await argon2.verify(hash, password);
```

**Phase to address:** Phase 1 (Email/password auth implementation)

---

### Pitfall C2: TikTok Sandbox Required for Testing Without App Review

**What goes wrong:**
TikTok's OAuth requires app review for production use. Without review, the app can only connect to a whitelist of up to 10 manually added test accounts. Developers discover this only after implementing the full OAuth flow and being unable to test with real accounts.

**Prevention:**
Create a TikTok developer sandbox before implementing the OAuth flow. Add test accounts to the sandbox whitelist. Plan for app review as a pre-launch gate — TikTok does not provide a timeline guarantee for review.

**Phase to address:** Phase 2 (TikTok OAuth) — sandbox setup must precede any TikTok OAuth coding

---

### Pitfall C3: Missing `expires_at` on Sessions Causes Stale Sessions to Never Expire

**What goes wrong:**
Creating sessions in the database without an `expires_at` column means sessions live forever. If a user's account is compromised and they rotate their password, old sessions remain valid. No session revocation mechanism exists.

**Prevention:**
Always store `expires_at` on sessions. Add a cron or database cleanup job (or `WHERE expires_at < NOW()` filter on every session lookup) to purge stale sessions.

**Phase to address:** Phase 1 (Session/auth schema)

---

### Pitfall C4: CORS Wildcard Carried Forward from v1.0 After Auth Is Added

**What goes wrong:**
The v1.0 PITFALLS section flagged that CORS wildcard (`*`) is acceptable for v1.0 static content but sets a bad precedent. Once auth cookies and JWT tokens are involved, `Access-Control-Allow-Origin: *` with `credentials: true` is blocked by browsers (the CORS spec forbids credentialed requests with wildcard origins). Developers who forget to update CORS config find that authenticated requests fail with CORS errors from day one of v1.1.

**Prevention:**
Replace the wildcard CORS config before adding any auth endpoint. Lock to explicit origins (dev: `http://localhost:5173`, production: your actual domain):

```typescript
fastify.register(cors, {
  origin: process.env.FRONTEND_URL,  // explicit, not '*'
  credentials: true,                  // required for cookies
});
```

**Phase to address:** Phase 1 (Auth infrastructure setup) — must precede any auth endpoint work

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Fastify server bootstrap | Auth plugin encapsulation (A1) | Register auth plugins at root with `fastify-plugin` |
| Database schema design | Missing `expires_at`/`refresh_token` columns (B5, C3) | Add all token lifecycle columns in initial migration |
| Email/password registration | Weak password hashing (C1) | Use `argon2id`; salt is automatic |
| Session management | Shared reference in `decorateRequest` (A2) | Initialize decorators with `null`; populate in hooks |
| Google OAuth | State parameter missing (B1), no PKCE (B2) | Implement both before testing any OAuth flow |
| TikTok OAuth | `client_key` parameter (A4), no localhost redirect (A4) | Manual token exchange; Cloudflare Tunnel for dev |
| Instagram OAuth | Wrong API entirely (A3) | Use Instagram Login API, not Basic Display API |
| Account linking | Email-based auto-link vulnerability (A5) | Link by `provider + provider_user_id` only |
| Migration workflow | `drizzle-kit push` in production (A6) | Use `generate` + `migrate` from day one |
| Frontend feed gating | Auth state loading flicker (B6) | Three-state auth guard: loading/auth/unauth |
| Token storage | localStorage XSS exposure (A7) | Access token in memory; refresh token in httpOnly cookie |
| Existing v1.0 CORS config | Wildcard CORS breaks credentialed requests (C4) | Update CORS config before first auth endpoint |
| Error handling | Inconsistent error shapes (B7) | Set global Fastify error handler before adding auth routes |

---

## Sources

- [Fastify Encapsulation Reference](https://fastify.dev/docs/latest/Reference/Encapsulation/) — HIGH confidence, official
- [Fastify Decorators Reference](https://fastify.dev/docs/latest/Reference/Decorators/) — HIGH confidence, official
- [FSTDEP006 decorateRequest reference type issue](https://github.com/fastify/fastify-request-context/issues/76) — HIGH confidence, official Fastify repo
- [Update on Instagram Basic Display API — Meta for Developers blog](https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/) — HIGH confidence, official
- [Instagram API with Instagram Login — Meta developer docs](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/) — HIGH confidence, official
- [TikTok OAuth User Access Token Management](https://developers.tiktok.com/doc/oauth-user-access-token-management) — HIGH confidence, official
- [TikTok Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web/) — HIGH confidence, official
- [TikTok Sandbox Mode introduction](https://developers.tiktok.com/blog/introducing-sandbox) — HIGH confidence, official
- [OAuth Vulnerabilities and Misconfigurations — Descope](https://www.descope.com/blog/post/5-oauth-misconfigurations) — MEDIUM confidence, verified against OWASP
- [Lessons in safe identity linking — WorkOS](https://workos.com/blog/lessons-in-safe-identity-linking) — MEDIUM confidence
- [Millions at Risk Due to Google's OAuth Flaw — Truffle Security](https://trufflesecurity.com/blog/millions-at-risk-due-to-google-s-oauth-flaw) — MEDIUM confidence
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — HIGH confidence, official
- [React Authentication: How to Store JWT in a Cookie — Medium/Chenkie](https://medium.com/@ryanchenkie_40935/react-authentication-how-to-store-jwt-in-a-cookie-346519310e81) — MEDIUM confidence
- [Drizzle ORM `push` documentation](https://orm.drizzle.team/docs/drizzle-kit-push) — HIGH confidence, official (notes dev-only use)
- [Drizzle ORM Migrations](https://orm.drizzle.team/docs/migrations) — HIGH confidence, official
- [What is PKCE and Why Your OAuth Implementation Needs It — OneUptime](https://oneuptime.com/blog/post/2025-12-16-what-is-pkce-and-why-you-need-it/view) — MEDIUM confidence
- [Password Hashing Guide 2025: Argon2 vs Bcrypt](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) — MEDIUM confidence

---

# Part 2: v1.0 — Video Player Pitfalls

*(Preserved from original research — 2026-04-01)*

---

## Critical Pitfalls

### Pitfall 1: Missing `playsinline` on iOS Safari

**What goes wrong:**
Every `<video>` element without the `playsinline` attribute forces fullscreen takeover on iPhone. The user's carefully designed inline feed becomes a jarring native fullscreen player, breaking the entire swipe-feed UX. There is no CSS workaround — it is enforced by iOS at the OS level.

**Why it happens:**
Developers test on desktop or Android Chrome first. The attribute is iOS-specific and has no effect on other platforms, so desktop/Android testing never surfaces the problem.

**How to avoid:**
Add `playsinline` to every `<video>` element, unconditionally. Also keep the legacy `webkit-playsinline` attribute for older iOS versions (pre-iOS 10). Do this on day one of implementation.

```html
<video playsinline webkit-playsinline muted autoplay loop src="..."></video>
```

**Warning signs:**
- Videos snap to fullscreen immediately on iPhone
- The native iOS media player chrome (scrub bar, AirPlay button) appears over your UI
- Testing on desktop Chrome shows nothing wrong

**Phase to address:** Phase 1 (Player foundation) — must be in the initial video element template

---

### Pitfall 2: Autoplay Without `muted` Fails Silently

**What goes wrong:**
Attempting to call `video.play()` on an unmuted video without a prior user gesture returns a rejected Promise on every major mobile browser. The failure is silent by default — no error in the console unless you explicitly catch the rejection. The video simply never plays, and the feed appears broken.

**Why it happens:**
The autoplay policy is well documented but its silent failure mode is not obvious. Developers see the `play()` call made successfully, don't add `.catch()`, and don't realize the promise was rejected.

**How to avoid:**
Always start muted. Always handle the `play()` promise:

```typescript
video.muted = true;
const playPromise = video.play();
if (playPromise !== undefined) {
  playPromise.catch((err) => {
    // Autoplay blocked — show unmute/play prompt to user
    console.warn('Autoplay blocked:', err);
  });
}
```

Provide a visible unmute button once the user has interacted with the feed. Never attempt to autoplay unmuted without tracing back to a direct user gesture (`touchend`, `click`, `doubleclick`, or `keydown`).

**Warning signs:**
- Feed loads but no video plays
- No errors in console (because the rejection was uncaught)
- Works on desktop but not on mobile

**Phase to address:** Phase 1 (Player foundation)

---

### Pitfall 3: CSS Scroll Snap `scroll-snap-type: y mandatory` Flick-to-End on iOS Safari

**What goes wrong:**
On iOS Safari (WebKit), a fast swipe flick scrolls all the way to the end or beginning of the list, skipping every intermediate snap point. This is a fundamental behavioral difference from Chrome (Blink): WebKit doesn't cap momentum scrolling at the next snap point — it lets the gesture carry through all of them. A feed with 50 videos becomes unnavigable.

**Why it happens:**
Developers prototype with `scroll-snap-type: y mandatory` on desktop Chrome, which correctly snaps one item at a time. WebKit's scroll momentum model differs. The bug is confirmed in multiple open issues (e.g., react-window#290, which dates to 2019 and remains a systemic WebKit behavior).

**How to avoid:**
Use `scroll-snap-stop: always` on each snap child. This forces WebKit to stop at every snap point regardless of scroll velocity. If `scroll-snap-stop: always` is insufficient for your implementation, fall back to a JavaScript-based swipe handler using touch events:

```typescript
// Detect direction, prevent default scroll, animate manually
container.addEventListener('touchstart', onTouchStart, { passive: false });
container.addEventListener('touchend', onTouchEnd, { passive: false });
```

Test with fast swipes on an actual iPhone, not the iOS Simulator (Simulator uses macOS scroll physics, not iOS).

**Warning signs:**
- Snap works perfectly in desktop Chrome but skips items on iPhone
- Simulator tests pass; device tests fail
- Users report "skipping" videos

**Phase to address:** Phase 1 (Swipe navigation)

---

### Pitfall 4: `100vh` Does Not Mean "Full Screen" on Mobile Browsers

**What goes wrong:**
`height: 100vh` on mobile browsers is calculated at the maximum possible viewport height — when the browser UI (address bar, bottom tab bar) is fully hidden. On page load, before any scrolling, the browser UI is visible, so `100vh` is taller than the actual visible area. Video slides overflow below the fold. The feed looks broken on first load.

**Why it happens:**
This is a browser vendor design decision. iOS Safari and Chrome for Android both exhibit this. Developers assume `100vh` = "what the user sees" but it means "maximum possible viewport size."

**How to avoid:**
Use `100dvh` (dynamic viewport height) which updates as browser chrome shows and hides. Fall back to `-webkit-fill-available` for older iOS:

```css
.video-slide {
  height: 100dvh; /* modern browsers */
  height: -webkit-fill-available; /* iOS fallback */
  min-height: -webkit-fill-available;
}
```

Or use a JavaScript CSS custom property approach:

```typescript
const setVh = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};
window.addEventListener('resize', setVh);
setVh();
// In CSS: height: calc(var(--vh, 1vh) * 100);
```

**Warning signs:**
- First video is partially hidden behind the browser address bar on page load
- Bottom of last visible element is cut off
- Problem disappears after first scroll

**Phase to address:** Phase 1 (Layout/CSS)

---

### Pitfall 5: Video Element Memory Leaks When Removing Elements from DOM

**What goes wrong:**
Removing a `<video>` element from the DOM does not release the media resources the browser has buffered. In a feed that creates and destroys video elements as the user scrolls, memory accumulates until the mobile browser tab crashes. On iOS, the OS will terminate the tab aggressively.

**Why it happens:**
Browsers hold references to decoded media buffers even after the element is removed from the DOM. The garbage collector cannot reclaim them until the `src` attribute is cleared and `load()` is called to reset the element. Developers assume DOM removal is sufficient cleanup.

**How to avoid:**
Implement an explicit cleanup function called before removing any video element:

```typescript
function destroyVideoElement(video: HTMLVideoElement): void {
  video.pause();
  video.removeAttribute('src');
  video.load(); // resets the media pipeline and releases buffers
}
```

Use a virtual window (only 3-5 video elements in DOM at any time) rather than mounting all videos upfront. Swap `src` on a fixed pool of elements instead of creating/destroying elements.

**Warning signs:**
- Tab crashes after scrolling through 20-30 videos
- Chrome DevTools memory profiler shows growing video buffer heap
- Problem worsens with longer viewing sessions

**Phase to address:** Phase 1 (Virtual list / feed management)

---

### Pitfall 6: Node.js Server Not Returning HTTP 206 Partial Content for Videos

**What goes wrong:**
When a Node/Express server serves video files with HTTP 200 (full content) instead of 206 (partial content / range requests), the browser cannot seek within the video, and some mobile browsers refuse to play the video at all. iOS Safari in particular requires range request support for video playback.

**Why it happens:**
Express's `express.static()` / `serve-static` does support range requests, but only when the `acceptRanges` option is not disabled. Custom file-serving handlers that stream the full file without handling the `Range` request header break seeking. Developers copy file-streaming code snippets that don't implement the range protocol.

**How to avoid:**
Use `express.static()` without disabling `acceptRanges`. If writing a custom handler, implement RFC 7233 range request handling:

```typescript
// Verify your server sends these headers on video responses:
// Accept-Ranges: bytes
// Content-Range: bytes 0-1023/2048
// Status: 206 Partial Content
```

Test seeking in the browser immediately after wiring up the file server. A seek that jumps in time and plays correctly confirms range requests are working.

**Warning signs:**
- Video plays from the beginning but seeking is broken
- Network tab in DevTools shows 200 responses instead of 206 for video requests
- iOS Safari won't play the video at all (blank video element)

**Phase to address:** Phase 1 (Backend file server)

---

### Pitfall 7: iOS Limits to One Simultaneously Playing Video

**What goes wrong:**
iOS enforces a hardware-level constraint: only one audio/video stream can play at a time. If you preload the next video by calling `.play()` on it while the current video is still playing, iOS will pause the current video. Attempting to play multiple videos for a crossfade transition or preview effect will always fail.

**Why it happens:**
This limitation is not prominently documented, and it differs from desktop behavior. Developers assume "preload" means "buffer silently in the background while current plays."

**How to avoid:**
Design the preload strategy around buffering (setting `src` and letting the browser prefetch) rather than playing. Only one video element should ever be in a non-paused, non-muted state at a time. Transition strategy: pause current → swap source or navigate to next element → play next.

For buffering-without-playing: set `video.preload = 'auto'` and assign `src`, but do not call `.play()`.

**Warning signs:**
- Current video pauses unexpectedly when approaching the next item
- Multiple video elements in the DOM — more than one has `paused === false`

**Phase to address:** Phase 1 (Feed preloading strategy)

---

### Pitfall 8: Intersection Observer + `play()` Race Condition

**What goes wrong:**
Using Intersection Observer to trigger `video.play()` when a slide enters the viewport creates a race condition. On mobile, rapid swipes can cause the Observer callback to fire for a video that is already partially off-screen by the time the async callback executes. The result: the wrong video plays, or two fire simultaneously, or play() is called after the element has been cleaned up.

**Why it happens:**
Intersection Observer callbacks are asynchronous and run after a microtask checkpoint. During fast gesture sequences on mobile, the scroll position can change significantly between when the intersection event occurs and when the callback fires.

**How to avoid:**
Gate the `play()` call with a re-check of the current intersection ratio at callback time:

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target as HTMLVideoElement;
    if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: 0.9 });
```

Also implement Page Visibility API to pause all videos when the tab is backgrounded — Intersection Observer alone does not handle tab switching.

**Warning signs:**
- Wrong video plays after fast swipe
- Two videos play simultaneously
- Video plays audio briefly then stops when scrolling quickly

**Phase to address:** Phase 1 (Autoplay / play-pause lifecycle)

---

## Technical Debt Patterns (v1.0)

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Render all video elements upfront (no virtualization) | Simpler code | Tab crashes on mobile after ~20 videos; unacceptable on mobile | Never for a feed — always virtualize |
| Use `preload="auto"` on every video | Next video loads fast | Massive bandwidth waste; mobile data costs; potential iOS limit triggers | Only for 1-2 adjacent videos |
| Skip `play()` promise rejection handling | Less code | Silent broken state on mobile with no debugging signal | Never — always catch the rejection |
| Use `100vh` for slide height | Works on desktop | Broken layout on every mobile browser on first load | Never for a mobile-first app |
| Serve video files with full 200 response (no range support) | Simpler server code | Seeking broken, iOS may not play at all | Never in production |
| Hardcode video format (e.g., MP4 only) | Simplest approach | Fine for controlled static files in m1; problematic if platform extraction added later | Acceptable for Milestone 1 static files |
| One global `<video>` element with `src` swapping | Avoids element proliferation | Requires careful cleanup, some browsers retain buffers | Acceptable pattern if cleanup is rigorous |

---

## Integration Gotchas (v1.0)

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Express static file server | Disabling or overriding `acceptRanges`, or building a custom handler without range support | Use `express.static()` with default options; verify 206 responses in DevTools Network tab |
| iOS Safari autoplay | Calling `play()` without `muted` attribute set first | Set `video.muted = true` before `play()`; always handle the returned Promise |
| CSS Scroll Snap on iOS | Relying on `scroll-snap-type: y mandatory` alone | Add `scroll-snap-stop: always` to snap children; test with fast flick on real device |
| Intersection Observer for autoplay | Not handling tab visibility separately | Combine with `document.addEventListener('visibilitychange', ...)` to pause on tab hide |
| Future native wrapper (Capacitor/RN) | Building Web APIs that don't translate — e.g., custom touch handlers that conflict with native gesture recognizers | Keep gesture handling in standard DOM events; avoid `preventDefault()` on scroll events where possible |

---

## Performance Traps (v1.0)

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Preloading all videos in both directions | High memory, bandwidth spike on load | Preload N+1 ahead, N-1 behind (directional window) | Immediately visible; breaks on first 5 video session |
| Not releasing video buffer memory on element removal | Tab crash after extended session | Call `video.removeAttribute('src'); video.load()` before removing | After ~20-30 video transitions on iOS |
| `preload="auto"` on every video in feed | Entire feed downloads on page load | Use `preload="none"` by default; switch to `preload="auto"` only for adjacent slides | Immediately — kills mobile data plans |
| Mounting a new `<video>` element per video rather than reusing a pool | DOM churn, GPU context switching | Use a fixed pool of 3-5 elements and swap `src` | After ~10 transitions on low-end Android |
| `object-fit: contain` on portrait videos | Black bars on sides, not full-bleed | Use `object-fit: cover` for full-bleed; accept crop for short-form content | Every video on every device — just looks wrong |

---

## Security Mistakes (v1.0)

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving arbitrary files from disk without path sanitization | Path traversal — attacker reads `/etc/passwd` via `../../` in URL | Whitelist allowed file extensions; use `path.resolve()` and verify the resolved path starts with the videos directory |
| No Content-Type validation on served files | Browsers may execute served content as script if MIME type is wrong | Always set `Content-Type: video/mp4` (or correct type); never derive MIME type from user-supplied filename |
| CORS wildcard `*` on video API in production | Acceptable for static public content in m1, but sets a bad precedent | Lock down CORS origins before adding any auth or user data endpoints in future milestones |
| Video files accessible at predictable URLs with no access control | Fine for m1 public content; breaks when personal/private videos are added | Design URL scheme (UUIDs, not sequential IDs) now so it doesn't require a rewrite when private content is added |

---

## UX Pitfalls (v1.0)

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visible mute/unmute control | Users don't know video has audio; feel ambushed when they unmute | Show a persistent mute toggle; animate briefly when muted state changes |
| No loading indicator between swipes | Feed feels broken during buffer wait | Show a spinner or skeleton on the video placeholder; remove on `canplay` event |
| Swipe threshold too sensitive | Accidental video skips when user tries to tap | Require minimum swipe distance (e.g., 50px) before treating as navigation intent |
| Video looping with no indication | User doesn't know they've looped | Show a subtle "replaying" indicator on loop restart using the `loop` event or monitoring `timeupdate` |
| No end-of-feed state | User swipes past last video into void | Show explicit "you've seen everything" state at feed end |
| Landscape mode not accounted for | Portrait-designed feed breaks when phone rotates | Lock orientation to portrait via `screen.orientation.lock('portrait')` in a PWA context, or handle gracefully |
| Controls/overlays intercept touch events | Tap-to-pause/play misses because overlay captures the touch | Use `pointer-events: none` on decorative overlays; only capture touch on intentional interactive elements |

---

## "Looks Done But Isn't" Checklist (v1.0)

- [ ] **Autoplay on mobile:** Test on a real iPhone in Safari — not the simulator, not desktop. The simulator uses macOS scroll physics and does not replicate iOS autoplay policy.
- [ ] **Range requests:** Open DevTools Network tab, load a video, click to seek — verify the server returns `206 Partial Content` with a `Content-Range` header.
- [ ] **Memory management:** Scroll through 30+ videos on a real device without refreshing. If the tab crashes or slows significantly, virtualization or cleanup is broken.
- [ ] **`playsinline`:** On iPhone, tap a video — verify it does not go fullscreen and the native iOS player chrome does not appear.
- [ ] **`100dvh` layout:** Load the app cold on iPhone. Verify the first video fills the screen exactly — no overflow below the browser bar, no gap at the top.
- [ ] **Flick scroll on iOS:** On iPhone, swipe aggressively. Verify navigation stops at exactly the next video, not the end of the list.
- [ ] **Page visibility:** Switch to another app and back. Verify the current video paused and resumes (or does not resume) as intended.
- [ ] **Single concurrent video on iOS:** Confirm only one video is playing at any given time by monitoring `paused` state on all elements in the DOM pool.
- [ ] **Path traversal:** Try `GET /videos/../package.json` — verify the server returns 404 or 403, not file contents.

---

## Recovery Strategies (v1.0)

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing `playsinline` discovered late | LOW | Add attribute to video element template; propagate to all instances — one-line fix but requires testing on real device |
| Memory leak causing crashes | MEDIUM | Add cleanup function (`removeAttribute('src'); load()`) to unmount lifecycle; reduce preload window size |
| Scroll snap flick bug | MEDIUM | Add `scroll-snap-stop: always`; if insufficient, replace CSS snap with JS swipe handler — 1-2 days |
| `100vh` layout breakage | LOW | Replace with `100dvh` + `-webkit-fill-available` fallback — 30-minute fix |
| No range request support on server | LOW | Verify `express.static()` defaults are not overridden; if custom handler, rewrite to handle `Range` header |
| Path traversal vulnerability | LOW | Add path sanitization middleware before any other server change |
| iOS single video limit causing pause bugs | HIGH | Requires redesigning preload strategy from play-to-preload to src-assignment-only — 1-3 days |

---

## Pitfall-to-Phase Mapping (v1.0)

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing `playsinline` | Phase 1: Video element foundation | Test on real iPhone; video stays inline |
| Autoplay without `muted` | Phase 1: Video element foundation | Feed autoplays on iPhone cold load with no prior user gesture |
| CSS scroll snap flick on iOS | Phase 1: Swipe navigation | Fast flick on iPhone stops at next item, not end of list |
| `100vh` viewport height | Phase 1: Layout/CSS | Cold load on iPhone; first slide exactly fills visible area |
| Video memory leaks | Phase 1: Virtual feed / DOM pool | 30-video scroll session on real device without crash or slowdown |
| Server range request support | Phase 1: Backend file server | Network tab shows 206 responses; seeking works |
| iOS single video limit | Phase 1: Preload strategy design | No unintentional video pauses; only one `paused === false` at any time |
| Intersection Observer race condition | Phase 1: Play/pause lifecycle | Fast swipes do not cause wrong video to play or two videos to play simultaneously |
| Path traversal | Phase 1: Backend security | `/../` in URL path returns 403/404 |
| `object-fit` for portrait video | Phase 1: Video display CSS | No black bars on portrait videos in fullscreen slot |
| End-of-feed state | Phase 1: Feed UX | Last video reached; explicit end state shown; no UX void |

---

## Sources (v1.0)

- [New `<video>` Policies for iOS — WebKit official blog](https://webkit.org/blog/6784/new-video-policies-for-ios/) — HIGH confidence, authoritative
- [Video playback best practices 2025 — Mux](https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025) — MEDIUM confidence
- [Fast playback with audio and video preload — web.dev](https://web.dev/articles/fast-playback-with-preload) — HIGH confidence, Google official
- [CSS scroll-snap-type — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type) — HIGH confidence
- [One flick scrolls forever on Safari with scroll snap — react-window issue #290](https://github.com/bvaughn/react-window/issues/290) — MEDIUM confidence, community-verified
- [100vh in Safari on iOS — bram.us](https://www.bram.us/2020/05/06/100vh-in-safari-on-ios/) — HIGH confidence, widely cited
- [Understanding Mobile Viewport Units: svh, lvh, dvh — Medium](https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a) — MEDIUM confidence
- [Remove HTML5 video and clear src to prevent leaks — GitHub Gist](https://gist.github.com/danro/5725870) — MEDIUM confidence
- [HTML5 video memory leak when replacing src — Chromium issue #969049](https://bugs.chromium.org/p/chromium/issues/detail?id=969049) — HIGH confidence, official bug tracker
- [Video Enters Fullscreen in Standalone PWA despite `playsinline` — videojs-record issue #714](https://github.com/collab-project/videojs-record/issues/714) — MEDIUM confidence, community
- [Apple device-specific HTML5 video considerations — Apple developer archive](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html) — HIGH confidence, official
- [WebKit bug 162366: Allow multiple playing videos](https://bugs.webkit.org/show_bug.cgi?id=162366) — HIGH confidence, official
- [HTTP 206 Partial Content in Node.js — CodeProject](https://www.codeproject.com/Articles/813480/HTTP-Partial-Content-In-Node-js) — MEDIUM confidence
- [Serving Video with HTTP Range Requests — smoores.dev](https://smoores.dev/post/http_range_requests/) — MEDIUM confidence
- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — MEDIUM confidence

---

*Last updated: 2026-04-02 — v1.1 auth/OAuth/PostgreSQL pitfalls added*
*Original v1.0 video player pitfalls: 2026-04-01*
