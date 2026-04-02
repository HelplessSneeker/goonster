# Technology Stack

**Project:** Goonster
**Researched:** 2026-04-02
**Scope:** v1.1 additions — user auth, OAuth, PostgreSQL, session management, profile page

---

## Existing Stack (Do Not Re-research)

Already validated and in production:

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.2.x | Frontend UI |
| Vite | 8.x | Build tool / dev server |
| TypeScript | 5.x | Type safety everywhere |
| Fastify | 5.8.x | Node.js HTTP server |
| Tailwind CSS | 4.x | Styling |
| Zustand | 5.x | Client state |
| TanStack Query | 5.x | Server state / data fetching |
| @fastify/static | 8.x | Video file serving with Range support |
| @fastify/cors | 9.x | CORS headers |
| Swiper.js | 11.x | Vertical swipe container |
| Vitest | 3.x | Testing |
| zod | 3.x | Runtime validation |

---

## v1.1 Stack Additions

### Authentication Framework

**Recommendation: better-auth 1.x**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| better-auth | 1.5.x | Full-stack auth framework | Handles the entire auth lifecycle: email/password, OAuth, session management, account linking. Framework-agnostic TypeScript-first library. Built-in Fastify integration via catch-all route handler. Built-in Drizzle adapter — no manual session/user table wiring. Covers Google (native), TikTok (native), Instagram (via genericOAuth plugin). Replaces @fastify/passport + manual session code entirely. |

**Why not @fastify/passport:** Passport requires writing OAuth strategy boilerplate for each provider, manual session serialization, and hand-rolling session store integration. For 3 providers + email/password, better-auth eliminates ~300-500 lines of plumbing code.

**Why not NextAuth/Auth.js:** Auth.js is React/Next-centric. The Fastify adapter is community-maintained and second-class. better-auth has first-class Fastify support as an official integration.

**Why not rolling JWT manually with @fastify/jwt:** Building auth from scratch means writing account linking, OAuth callback flows, and token refresh logic manually. Not appropriate for a one-person project — use the framework.

**Fastify integration pattern:**
```typescript
// packages/api/src/plugins/auth.ts
import { auth } from '../lib/auth'
import { fromNodeHeaders } from 'better-auth/node'

fastify.route({
  method: ['GET', 'POST'],
  url: '/api/auth/*',
  handler: async (request, reply) => {
    const response = await auth.handler(
      new Request(`${request.protocol}://${request.hostname}${request.url}`, {
        method: request.method,
        headers: fromNodeHeaders(request.headers),
        body: request.body ? JSON.stringify(request.body) : undefined,
      })
    )
    reply.code(response.status)
    response.headers.forEach((value, key) => reply.header(key, value))
    return reply.send(await response.text())
  },
})
```

---

### Database

**Recommendation: PostgreSQL + Drizzle ORM + postgres.js driver**

| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| PostgreSQL | 16.x | Relational database for users, sessions, accounts | Project constraint. Well-suited for user/auth data with foreign keys and transactions. |
| drizzle-orm | 0.45.x | ORM / query builder | SQL-first TypeScript ORM. Schema defined in TypeScript — types auto-update when schema changes. No code generation step. ~7.4KB minified, tree-shakeable. Native better-auth adapter. `drizzle-kit` handles migrations. |
| postgres (postgres.js) | 3.x | PostgreSQL driver | Fastest JS PostgreSQL client. Used with drizzle-orm's `drizzle(sql, { schema })` constructor. better-auth's Drizzle adapter works with postgres.js out of the box. |
| drizzle-kit | 0.28.x | Migration CLI | `npx drizzle-kit generate` creates migration files from schema diffs. `npx drizzle-kit migrate` applies them. `npx auth generate` generates the better-auth schema tables to import into drizzle. |

**Why Drizzle over Prisma:** Drizzle is lighter, has no Rust binary dependency, and its schema-as-TypeScript model means the monorepo's shared types package can import DB types directly. Prisma requires running `prisma generate` before TypeScript resolves — a CI friction point.

**Why postgres.js over node-postgres (pg):** Faster, modern async API, no callback-style legacy. Drizzle's docs recommend it as the primary driver for standard Node deployments.

**Schema ownership:** Run `npx auth generate` once to scaffold the better-auth tables (user, session, account, verification). Extend those tables in your own drizzle schema files — do not modify the generated file directly.

---

### Session Management

**Recommendation: better-auth's built-in session layer (no separate session plugin)**

better-auth manages sessions internally as part of its database-backed session model. It stores sessions in the `session` table via the Drizzle adapter. You do not need `@fastify/session`, `@fastify/secure-session`, or `@fastify/jwt` for auth flows.

For non-auth routes that need to know "is this user logged in", use better-auth's `auth.api.getSession()` server-side helper:

```typescript
// Fastify preHandler hook for protected routes
async function requireAuth(request, reply) {
  const session = await auth.api.getSession({ headers: request.headers })
  if (!session) {
    return reply.code(401).send({ error: 'Unauthorized' })
  }
  request.user = session.user
}
```

**Why not JWT:** Session invalidation on logout is trivial with database sessions — just delete the row. JWT logout requires a denylist, which adds the same database lookup you were avoiding. For a social app where "log out all devices" will be a real user expectation, database sessions are strictly simpler.

**Why not @fastify/secure-session (stateless cookie):** Encrypted stateless cookies cannot be invalidated server-side. If a user's account is compromised or they request logout, the token remains valid until expiry. Not acceptable for a user auth context.

---

### Password Hashing

**Recommendation: argon2 0.44.x (built into better-auth)**

better-auth uses Argon2id internally for password hashing — you do not install it separately. This is the right call: Argon2id is the current OWASP recommendation for password hashing, resistant to GPU and ASIC attacks in a way bcrypt is not.

If you need to hash passwords outside better-auth (e.g., migration scripts), use `argon2` npm package directly.

**Do not install bcrypt for new code.** better-auth already made this decision correctly.

---

### OAuth Providers

#### Google (HIGH confidence)
- Native provider in better-auth — configure via `socialProviders.google`
- Standard OAuth2/OIDC, well-tested
- App registration at console.cloud.google.com, enable Google+ API
- No special constraints for localhost development

#### TikTok (MEDIUM confidence — developer portal gating applies)
- Native provider in better-auth — configure via `socialProviders.tiktok`
- Uses `clientKey` not `clientId` (TikTok naming convention)
- **Critical constraint: TikTok OAuth does not work on localhost.** Use ngrok or similar for local testing
- TikTok does not return email addresses — better-auth uses username as a workaround
- Sandbox mode required for development, production requires scope approval from TikTok
- Default scope: `user.info.profile`

#### Instagram (LOW confidence — API landscape unstable)
- Instagram Basic Display API reached EOL December 4, 2024 — cannot be used
- Current option: Instagram Graph API via Business Login (Business/Creator accounts only)
- Personal Instagram accounts can no longer connect to third-party apps via OAuth
- better-auth supports Instagram via the `genericOAuth` plugin — not a native provider
- Community package `better-auth-instagram` exists but wraps the deprecated Basic Display API
- **Recommendation: implement the OAuth redirect flow architecture, but treat Instagram as a known-broken provider until Meta's new business auth flow is clearer. Flag in UI with "Coming soon" or limit to business accounts only.**

| Provider | Status | better-auth Support | Notes |
|----------|--------|---------------------|-------|
| Google | Production-ready | Native | Standard OIDC — straightforward |
| TikTok | Development-limited | Native | localhost requires ngrok; sandbox for dev |
| Instagram | Blocked/Uncertain | genericOAuth plugin | Basic Display API is dead; only business accounts remain |

---

### Frontend: Auth State & Forms

| Library | Version | Purpose | Why |
|---------|---------|---------|-----|
| better-auth/client | (bundled with better-auth) | Auth state on frontend | better-auth ships a framework-agnostic client. Use `createAuthClient()` from `better-auth/react` for React hooks (`useSession`, `signIn.social()`, `signOut()`). No separate install. |
| TanStack Form | 1.x | Login / signup / profile forms | Already have TanStack Query — TanStack Form is the natural complement. Built-in Zod validation support. ~20KB gzipped. Avoids adding React Hook Form as a second form library. |
| @hookform/resolvers + react-hook-form | — | Do NOT add | Already have TanStack Form path. React Hook Form is redundant. |

**Note on TanStack Form:** If the project has zero form requirements today (all forms are minimal), defer TanStack Form and use uncontrolled HTML forms with Zod validation directly. Login forms are 2-3 inputs — the overhead of a form library may not pay off in v1.1. Evaluate at implementation time.

---

### Backend: Additional Fastify Plugins for Auth

| Plugin | Version | Purpose | Notes |
|--------|---------|---------|-------|
| @fastify/cookie | 11.x | Cookie parsing | Required by better-auth for session cookie. Already in better-auth's peer dependencies — install explicitly. |

**Do NOT add:**
- `@fastify/passport` — better-auth replaces it
- `@fastify/jwt` — better-auth handles tokens
- `@fastify/session` — better-auth's database sessions replace this
- `@fastify/secure-session` — same

---

### Environment Configuration

| Library | Version | Purpose | Notes |
|---------|---------|---------|-------|
| @fastify/env | 2.x | Validated env vars at startup | Already recommended for Fastify. Use it to validate `DATABASE_URL`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`. Fail fast on startup if any are missing. |

---

## Installation Commands (New Dependencies Only)

```bash
# Backend — auth + database
pnpm --filter api add better-auth drizzle-orm postgres
pnpm --filter api add @fastify/cookie
pnpm --filter api add -D drizzle-kit

# Frontend — auth client
pnpm --filter web add better-auth

# Optional: form library (evaluate at implementation time)
pnpm --filter web add @tanstack/react-form
```

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Auth framework | better-auth | @fastify/passport + @fastify/session | Passport requires writing strategy boilerplate for each OAuth provider + session store integration. better-auth is 1 library vs 4-5 packages doing the same thing. |
| Auth framework | better-auth | Auth.js / NextAuth | Auth.js is Next.js-centric. Fastify adapter is community-maintained, not official. better-auth's Fastify integration is official. |
| Auth framework | better-auth | Lucia | Lucia v4+ pivoted to being a "reference implementation" — it no longer ships as a ready-to-use auth library. Not appropriate for production. |
| ORM | Drizzle | Prisma | Prisma requires Rust binary + code generation before TypeScript resolves. In a monorepo, this creates CI ordering issues. Drizzle schema is pure TypeScript — types available immediately. |
| ORM | Drizzle | TypeORM | TypeORM relies on decorators and has a complex inheritance model. Harder to type-share across packages. Drizzle is lighter and more idiomatic in 2025. |
| PG driver | postgres.js | node-postgres (pg) | postgres.js is faster and has a cleaner async API. node-postgres has a legacy callback-style history and C++ native bindings that complicate binary deployments. |
| Sessions | better-auth built-in | @fastify/secure-session (stateless) | Stateless cookies cannot be server-side invalidated. "Log out all devices" becomes impossible. Database sessions are the right tradeoff for user auth. |
| Password hashing | argon2id (via better-auth) | bcrypt | Argon2id is OWASP's current recommendation, GPU/ASIC-resistant. bcrypt is acceptable but dated. better-auth already chooses Argon2id — no decision needed. |
| Instagram OAuth | genericOAuth + flag as unstable | Any library wrapping Basic Display API | Basic Display API reached EOL 2024-12-04. Any library built on it is broken. Instagram's replacement only works for business/creator accounts. |

---

## Version Compatibility (New Additions)

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| better-auth 1.5.x | Fastify 5.x | Official integration — uses `fromNodeHeaders` from `better-auth/node` |
| better-auth 1.5.x | drizzle-orm 0.45.x | drizzle adapter ships with better-auth. Caution: drizzle-orm v1.0.0-beta breaks the adapter (tracked in issue #6766). Stay on 0.45.x stable. |
| drizzle-orm 0.45.x | postgres.js 3.x | Fully supported — drizzle docs recommend this combination |
| drizzle-kit 0.28.x | drizzle-orm 0.45.x | Match drizzle-kit minor to drizzle-orm minor to avoid schema drift issues |
| @fastify/cookie 11.x | Fastify 5.x | Required for cookie parsing — better-auth peer dependency |

---

## What NOT to Add

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| @fastify/passport | better-auth renders it unnecessary — it's the pre-better-auth era approach to OAuth in Fastify | better-auth |
| passport-google-oauth / passport-github2 | Passport strategy libraries — obsolete with better-auth | built-in `socialProviders.google` in better-auth |
| @fastify/jwt | better-auth manages tokens. Adding @fastify/jwt alongside creates dual-auth confusion | better-auth session API |
| @fastify/session | better-auth handles database sessions. @fastify/session is redundant and uses in-memory store by default (memory leak in production) | better-auth database sessions |
| jsonwebtoken / jose | For auth use cases, better-auth handles this. For non-auth JWT use cases (e.g., signed video URLs), jose is fine — but don't bring it in yet | Only add if a non-auth use case appears |
| bcrypt / bcryptjs | OWASP now recommends Argon2id. better-auth already uses it. Don't add bcrypt alongside | argon2id via better-auth |
| better-auth-instagram (npm) | Wraps the deprecated Instagram Basic Display API — broken as of 2024-12-04 | genericOAuth plugin with current Instagram Graph API endpoints |
| drizzle-orm v1.0.0-beta | better-auth's Drizzle adapter has documented incompatibility with drizzle-orm v1.0 beta syntax (issue #6766) | drizzle-orm 0.45.x stable |
| Lucia | Pivoted away from being a usable auth library in v4 — now a reference only | better-auth |

---

## Sources

- [better-auth Fastify integration docs](https://better-auth.com/docs/integrations/fastify) — Official integration guide (HIGH confidence)
- [better-auth Drizzle adapter docs](https://better-auth.com/docs/adapters/drizzle) — Schema generation, provider config (HIGH confidence)
- [better-auth TikTok provider docs](https://better-auth.com/docs/authentication/tiktok) — TikTok constraints documented (HIGH confidence)
- [better-auth Other Social Providers](https://better-auth.com/docs/authentication/other-social-providers) — Instagram via genericOAuth (HIGH confidence)
- [drizzle-orm npm](https://www.npmjs.com/package/drizzle-orm) — Latest version 0.45.2 confirmed (HIGH confidence)
- [drizzle-orm PostgreSQL docs](https://orm.drizzle.team/docs/get-started-postgresql) — postgres.js recommended driver (HIGH confidence)
- [better-auth issue #6766](https://github.com/better-auth/better-auth/issues/6766) — drizzle-orm v1 beta incompatibility (HIGH confidence)
- [Instagram Basic Display API EOL announcement](https://docs.spotlightwp.com/article/884-preparing-for-the-end-of-instagram-basic-display-api-what-to-expect-and-how-to-adapt) — EOL confirmed Dec 4 2024 (HIGH confidence)
- [TikTok Login Kit for Web](https://developers.tiktok.com/doc/login-kit-web/) — OAuth v2 required, localhost blocked (HIGH confidence)
- [Argon2 OWASP guidance](https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/) — Argon2id recommendation (MEDIUM confidence — third-party)
- [@fastify/passport npm](https://www.npmjs.com/package/@fastify/passport) — Version 3.0.2, Fastify 5 compatible (MEDIUM confidence)
- [@fastify/secure-session GitHub package.json](https://github.com/fastify/fastify-secure-session/blob/main/package.json) — Version 8.3.0, Fastify 5 devDep confirmed (HIGH confidence)
- [fastify-better-auth npm](https://www.npmjs.com/package/fastify-better-auth) — Community Fastify plugin v1.2.0 (MEDIUM confidence — community, not needed if using official integration)

---

*Stack research for: Goonster v1.1 — User Authentication & Connected Accounts*
*Researched: 2026-04-02*
