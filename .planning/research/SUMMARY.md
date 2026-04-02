# Project Research Summary

**Project:** Goonster
**Domain:** Mobile-first social short-form video player — v1.1 User Authentication & Connected Accounts
**Researched:** 2026-04-02 (v1.1 update); 2026-04-01 (v1.0 baseline preserved below)
**Confidence:** HIGH (auth stack, architecture, critical pitfalls) / MEDIUM (TikTok OAuth specifics, platform cooperation) / LOW (Instagram personal account path forward)

---

## Executive Summary

Goonster v1.1 adds user authentication, OAuth connected accounts (Google, TikTok, Instagram), and a profile page to the already-working v1.0 video feed. The research strongly recommends **better-auth 1.5.x** as a unified auth framework rather than assembling separate passport strategies, session plugins, and JWT libraries. Better-auth provides first-class Fastify 5 integration, a native Drizzle ORM adapter, and built-in support for all three target OAuth providers — replacing what would otherwise be 4-5 packages and 300-500 lines of manual plumbing. The database layer adds PostgreSQL 16 + Drizzle ORM 0.45.x + postgres.js 3.x, with the schema bootstrapped via `npx auth generate` and extended in Drizzle's TypeScript-native format. Sessions are database-backed (not stateless JWTs) because the social-app use case demands server-side invalidation for logout-all-devices.

The architecture extends the existing two-tier (React SPA + Fastify backend) system with a new database layer and auth layer, without disturbing the v1.0 video player core. The build order is strictly layered: database schema first, then auth core endpoints, then the frontend auth shell, then feed gating, then Google OAuth, then the profile page, then TikTok OAuth, then Instagram. Critically, the frontend must be able to attach auth tokens (Layer 3) before the backend starts rejecting unauthenticated feed requests (Layer 4) — inverting this order breaks all development simultaneously. The session strategy uses better-auth's database-backed sessions because stateless cookies cannot be invalidated server-side, which is unacceptable for a social app where "log out all devices" is a real user expectation.

The biggest risk in v1.1 is not technical complexity but platform cooperation. Instagram's Basic Display API was killed December 4, 2024, and the replacement only works for Professional (Business/Creator) accounts — Goonster's target users have personal accounts, making Instagram a product-level blocker requiring a decision before any Instagram code is written. TikTok's production OAuth requires app review (1-14 days, manual, personal-use apps are explicitly rejected by policy) and does not allow localhost redirect URIs. The full TikTok flow can be built and tested in sandbox mode for v1.1; production TikTok connect is a post-review gate. Google OAuth is the safe starting point: no app review, no parameter deviations, localhost works.

---

## Key Findings

### Recommended Stack

The v1.0 stack (React 19 + Vite 8 + Fastify 5 + Tailwind 4 + Zustand 5 + TanStack Query 5 + Swiper.js 11) is unchanged and already in production. V1.1 adds a focused set of new dependencies centered on better-auth.

**New v1.1 core technologies:**
- **better-auth 1.5.x** — Full-stack auth framework with official Fastify 5 integration and native Drizzle adapter; replaces passport + session + OAuth strategy libraries entirely with a single dependency
- **PostgreSQL 16 + drizzle-orm 0.45.x + postgres.js 3.x** — Relational database for users, sessions, connected accounts; Drizzle chosen over Prisma (no Rust binary, no code-generation step, types available immediately)
- **drizzle-kit 0.28.x** — Migration CLI; use `generate` + `migrate` workflow from day one, never `push` in any non-local environment
- **@fastify/cookie 11.x** — Cookie parsing required as a better-auth peer dependency; register before better-auth handler
- **wouter 3.x** — Minimal 1.4KB client-side router for 4 new routes; React Router v7 adds complexity that isn't justified for this scope

**Critical version constraint:** Do not upgrade to drizzle-orm v1.0.0-beta — better-auth's Drizzle adapter has a documented incompatibility (GitHub issue #6766). Stay on 0.45.x stable.

**Do not add:** `@fastify/passport`, `@fastify/jwt`, `@fastify/session`, `@fastify/secure-session` — better-auth replaces all of these. Do not add `better-auth-instagram` npm package — it wraps the now-dead Basic Display API.

### Expected Features

The v1.1 feature set is tightly scoped: auth infrastructure, Google OAuth (the safe first provider), profile page, and OAuth scaffolding for TikTok and Instagram. Everything else is explicitly deferred.

**Must have (table stakes for v1.1):**
- Email + password registration and login — foundational auth fallback; users cannot be left without a non-OAuth path
- Database-backed session management — better-auth handles this; httpOnly cookie for session token
- Auth-gated feed — ProtectedRoute wrapper with three states (loading/authenticated/unauthenticated); redirect to /login with return URL preserved
- Logout with server-side session invalidation — delete the DB row, not just the client cookie
- Google OAuth login/signup + account connect — PKCE flow, auto-register new users; fastest to implement and test
- Connected accounts UI on profile page — provider name, handle/email, Unlink button per provider
- Basic profile page — display name (editable), email (read-only), connected accounts list
- Display name editable — PATCH /api/users/me; needed for future "who shared this" attribution

**Should have (differentiators for v1.1):**
- TikTok OAuth connect (staging/sandbox only) — full flow works in dev; production approval is a separate gate
- Instagram OAuth scaffold with "Professional account required" messaging — implement redirect flow, document personal account blocker
- OAuth conflict resolution — unique constraint on (provider, provider_user_id) prevents duplicate connection bugs
- Graceful OAuth error handling — human-readable errors for all failure modes (denied, state mismatch, app not approved)

**Defer to v1.2+:**
- Email verification (add `email_verified` boolean column to schema now, skip sending verification emails)
- Password reset (schema placeholder `password_reset_token`, no email infrastructure yet)
- Avatar/profile photo upload (initials fallback; surface Google profile photo URL if connected)
- Two-factor authentication / TOTP
- RBAC (add `role TEXT DEFAULT 'user'` column, implement no access logic on top)
- Public profile pages (no social graph exists yet)
- TikTok production OAuth (pending app-review approval)
- Instagram personal account support (blocked by Meta API policy — product decision required)

### Architecture Approach

V1.1 extends the existing clean two-tier architecture with a database layer and auth layer. The critical principle is layer separation: feed/video routes receive no database access (they depend on `VideoStore` only); auth and user routes receive the `db` instance injected via plugin options, same pattern as `VideoStore`. Auth plugins register at the root Fastify instance level using `fastify-plugin` wrappers to prevent encapsulation scope bugs.

The session strategy is database-backed via better-auth — not stateless JWTs — because server-side session invalidation is required. The architecture file described a dual JWT + refresh token approach, but that was written before the STACK decision landed on better-auth. **Use better-auth's database sessions.**

**Major components:**
1. **Database layer** (`db/schema.ts`, `db/client.ts`, `migrations/`) — Drizzle schema for users, sessions, oauth_accounts; migrations committed to git and applied pre-deploy via CLI, never at app startup
2. **Auth core** (better-auth handler + `routes/auth.ts` shim) — email/password register/login, session lifecycle, OAuth start/callback for all providers; better-auth's catch-all route handles most of this
3. **User routes** (`routes/user.ts`) — GET /user/me, PUT /user/profile, DELETE /user/connections/:provider with lockout guard (409 if last auth method)
4. **Auth store** (`store/authStore.ts`) — Zustand store for `user | null`, `isLoading`; session restored on mount via better-auth's session check
5. **Router** (`Router.tsx` + wouter) — 5 routes: /login, /register, /auth/callback, / (protected feed), /profile (protected); ProtectedRoute handles loading/auth/unauth
6. **Modified feed + video routes** — Add better-auth `requireAuth` preHandler to existing routes; no DB access added

**Build order (dependency graph):**
- Layer 1: DB schema + client + userService
- Layer 2: Auth core (email/password + session endpoints)
- Layer 3: Frontend auth shell (authStore, Router, LoginPage, ProtectedRoute)
- Layer 4: Feed gating (add requireAuth to GET /feed and GET /video/:id)
- Layer 5: Google OAuth (start/callback, oauthService, OAuthCallback page)
- Layer 6: Profile page (GET/PUT /user/me, DELETE /user/connections/:provider, ProfilePage)
- Layer 7: TikTok + Instagram OAuth (depends on Layer 5 pattern)

### Critical Pitfalls

**V1.1 auth/database pitfalls (new):**

1. **Fastify plugin encapsulation breaks auth decorators** — Register better-auth and @fastify/cookie at the root Fastify instance with `fastify-plugin` wrapper. Auth plugins registered inside a scoped route group are invisible to sibling/parent routes. Detection: `TypeError: request.jwtVerify is not a function` on routes outside the auth scope. Phase 1.

2. **`decorateRequest` with a reference type shares state across requests** — Initialize any request decorator with `null` (not `{}`), populate per-request in a hook. Under concurrent load, a shared object means User A sees User B's session data. Fastify emits `FSTDEP006` deprecation warning — treat it as a blocking error. Phase 1.

3. **Auto-linking OAuth accounts by email creates account takeover vulnerability** — Never auto-link OAuth logins to existing accounts by matching email addresses. Use the provider's immutable user ID (`sub` for Google, `open_id` for TikTok) as the unique key in `connected_accounts`. The `nOAuth` vulnerability (Azure AD, 2023) exploited exactly this pattern. Phase 1 (schema design) + Phase 5 (OAuth callbacks).

4. **Instagram Basic Display API is dead — wrong OAuth flow** — Dead as of December 4, 2024. Every Node.js tutorial from before mid-2024 describes a broken integration. Use Instagram API with Instagram Login (`instagram_business_basic` scope). Personal accounts cannot be connected — this is a product-level blocker, not a technical one. Phase 7.

5. **TikTok uses `client_key` not `client_id`** — TikTok's OAuth deviates from RFC 6749. Generic OAuth libraries send `client_id` and TikTok silently fails token exchange. Build TikTok token exchange manually. Additionally, TikTok blocks localhost redirect URIs — a public tunnel is required for all local TikTok OAuth testing. Phase 7.

6. **`drizzle-kit push` destroys migration history** — Use `generate` + `migrate` from day one. `push` is dev-only convenience. Using it in staging/production means no migration history, no CI/CD replay, no rollback. Commit the `migrations/` directory to git. Phase 1.

7. **Wildcard CORS breaks credentialed requests** — The v1.0 CORS config uses `*`. With auth cookies and `credentials: true`, browsers block this per the CORS spec. Replace wildcard with explicit frontend origin before writing the first auth endpoint. Phase 1.

8. **Auth state loading race causes feed flicker** — The ProtectedRoute must handle three states: `loading`, `authenticated`, `unauthenticated`. Rendering null or the feed during loading causes a flash of wrong content on slow mobile connections. Show a neutral splash screen during load. Phase 3.

**V1.0 video player pitfalls (preserved):**

1. **Missing `playsinline` on iOS Safari** — Forces fullscreen takeover; add `playsinline` + `webkit-playsinline` to every `<video>` unconditionally.
2. **CSS scroll-snap flick-to-end on iOS** — Add `scroll-snap-stop: always` to every snap child; test on real iPhone, not Simulator.
3. **`100vh` breaks mobile layout** — Use `100dvh` + `-webkit-fill-available` fallback.
4. **Video element memory leaks** — Call `removeAttribute('src'); load()` before unmount; use a fixed DOM pool of 3-5 elements.
5. **iOS single concurrent video limit** — Preload by assigning `src` only, never calling `.play()` on non-active elements.
6. **HTTP 206 range requests required** — `@fastify/static` handles this by default; do not disable it.

---

## Implications for Roadmap

Research defines a clear 4-phase structure for v1.1. The 7-layer dependency graph from architecture research maps directly onto phases. The Instagram product decision is the only external blocker.

### Phase 1: Database Foundation & Auth Core

**Rationale:** Everything in v1.1 depends on the database schema and core auth endpoints. Schema design is the highest-stakes decision — mistakes require migrations. This phase must be complete and end-to-end testable (including the full login → feed flow) before anything else is built.

**Delivers:** Email/password registration + login + logout, database-backed sessions, auth-gated feed (frontend + backend), standardized API error responses, CORS updated for credentialed requests.

**Features addressed:** Email auth, session persistence, logout, auth-gated feed, post-login redirect.

**Pitfalls to avoid in this phase:** Plugin encapsulation (A1), decorateRequest shared reference (A2), drizzle-kit push (A6), wildcard CORS (C4), missing expires_at on sessions (C3), localStorage token storage (A7), inconsistent error shapes (B7), OAuth state parameter storage setup (B1).

**Research flag:** Standard patterns. Better-auth + Drizzle + Fastify is exactly the combination documented in official better-auth docs. Skip phase research.

---

### Phase 2: Google OAuth + Profile Page

**Rationale:** Google OAuth is the fastest provider to implement (standard OIDC, no app review, no parameter deviations, localhost works). The profile page depends on connected accounts, so it follows Google naturally. TikTok and Instagram are deferred to Phase 3 because they have external dependencies (sandbox setup, app review, platform instability) creating unpredictable timelines.

**Delivers:** Google login/signup + account linking, profile page with connected accounts list, display name editing, unlink provider with lockout guard.

**Features addressed:** Google OAuth, connected accounts UI, basic profile page, display name editable.

**Pitfalls to avoid:** OAuth state CSRF (B1), PKCE for SPA (B2), email-based auto-link account takeover (A5), auth loading flicker (B6), unlink lockout (architecture anti-pattern 5).

**Research flag:** Standard patterns. Google OAuth via better-auth is the most-documented OAuth flow in existence. Skip phase research.

---

### Phase 3: TikTok OAuth (Staging) + Instagram Scaffold

**Rationale:** TikTok OAuth has non-standard implementation requirements (client_key, no localhost) that need dedicated attention. The full flow can be built and tested in sandbox mode. Instagram comes in the same phase because the OAuth scaffold is identical in structure — the difference is only the product decision about surfacing it. Both providers depend on the OAuth framework established in Phase 2.

**Delivers:** TikTok OAuth start/callback working in sandbox mode, TikTok connect button on profile page, manual TikTok token exchange implementation. Instagram OAuth scaffold with explicit "Professional account required" messaging (or feature-flagged as coming soon pending product decision).

**Features addressed:** TikTok OAuth connect (staging), Instagram OAuth scaffold, graceful OAuth error handling.

**Pitfalls to avoid:** TikTok client_key parameter deviation (A4), TikTok localhost blocked (A4 — must set up tunnel before writing any code), Instagram wrong API (A3 — use Instagram Login API not Basic Display API), one-size-fits-all OAuth error page (architecture anti-pattern 4).

**Research flag:** Needs phase research for TikTok. Current developer portal requirements, sandbox setup process, and whether `@fastify/oauth2` v8 handles TikTok's parameter deviations need verification before implementation — research is MEDIUM confidence. Instagram research is LOW confidence on path forward.

---

### Phase 4: Polish, Error Handling & Production Readiness

**Rationale:** Auth systems reveal edge cases only under real usage. This phase hardens the auth flow: refresh token rotation, session expiry UX, OAuth failure states, and the TikTok production app review submission process. The Instagram product decision should be finalized here.

**Delivers:** Refresh token rotation with reuse detection, complete OAuth error handling across all providers, TikTok production app review submitted, Instagram personal account blocker decision documented in product, production CORS + cookie security configuration.

**Features addressed:** OAuth token refresh (deferred from Phase 3 schema work), graceful OAuth error handling, production security hardening.

**Pitfalls to avoid:** OAuth token refresh not implemented (B5 — schema has columns, implement refresh logic here), DB migration race conditions in production deployments (B4 — move migrations to pre-deploy step, not server startup).

**Research flag:** Instagram API path forward requires fresh research at this point — the landscape is LOW confidence and actively evolving. TikTok app review process needs research on current timeline and policy interpretation.

---

### Phase Ordering Rationale

- Email/password auth must precede OAuth: better-auth's OAuth flows create users in the same users table; registration/session infrastructure must exist before any OAuth callback can complete.
- Frontend token attachment (Layer 3) must precede backend feed gating (Layer 4): if the backend starts rejecting unauthenticated feed requests before the frontend can send a valid token, all development breaks simultaneously. This ordering is non-negotiable.
- Google OAuth before TikTok/Instagram: Google works on localhost with no app review and standard OAuth. The OAuth callback pattern learned on Google is reused for all subsequent providers. Always validate the pattern on the simplest case first.
- TikTok before Instagram: TikTok is a native better-auth provider with more documentation; Instagram is genericOAuth with an unstable post-2024 API situation.
- Profile page after Google OAuth: the profile page's primary value (connected accounts list) is empty until at least one OAuth provider works.
- Production hardening last: auth edge cases (token rotation, refresh failure UX, OAuth error states) are only worth investing in after the happy path is validated.

### Research Flags

**Needs phase research:**
- Phase 3 (TikTok OAuth): MEDIUM confidence on current TikTok developer portal setup, sandbox process, and whether the better-auth native TikTok provider handles the `client_key` deviation correctly or if a manual implementation is required. Verify against https://developers.tiktok.com/doc/login-kit-web/ before writing code.
- Phase 4 (Instagram): LOW confidence on path forward for personal accounts. Verify current Meta developer docs and assess whether the feature has product value before implementing.

**Standard patterns (skip research-phase):**
- Phase 1 (Database Foundation & Auth Core): better-auth + Drizzle + Fastify is the exact combination covered in official better-auth docs. No novel integration.
- Phase 2 (Google OAuth + Profile Page): Google OAuth is the most documented OAuth flow. Better-auth native provider with official Fastify integration.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Better-auth, Drizzle, postgres.js all have verified Fastify 5 compatibility. One known constraint: drizzle-orm must stay on 0.45.x (issue #6766). @fastify/oauth2 v8 Fastify 5 peer dep is MEDIUM — verify before install. |
| Features | HIGH | Email/password auth and Google OAuth: HIGH. TikTok OAuth flow in sandbox: MEDIUM. Instagram personal account path: LOW (blocker is HIGH confidence; solution is uncertain). |
| Architecture | HIGH | Plugin registration order, session strategy, build layer sequencing all sourced from official Fastify docs and better-auth integration guides. One discrepancy resolved: ARCHITECTURE.md described JWT dual-token approach; STACK.md recommends better-auth database sessions. Better-auth wins. |
| Pitfalls | HIGH | All critical pitfalls sourced from official docs: Fastify encapsulation (official reference), FSTDEP006 (official issue), Instagram EOL (official Meta announcement), TikTok client_key (official TikTok developer docs), OWASP for security patterns. |

**Overall confidence:** HIGH for Phases 1 and 2. MEDIUM for Phase 3 (TikTok sandbox flow). LOW confidence on Instagram personal account resolution — this is a product decision, not an engineering problem.

### Gaps to Address

- **Architecture vs Stack discrepancy on session strategy:** ARCHITECTURE.md describes a manual JWT (15-min access token) + opaque refresh token approach. STACK.md recommends better-auth with database sessions. These are mutually exclusive. **Resolution: use better-auth database sessions.** The JWT approach in ARCHITECTURE.md was written before the STACK decision finalized on better-auth. The `authStore.ts` pattern described in ARCHITECTURE.md (user, isLoading, setAuth, clearAuth) is still correct — it just reads from better-auth's session instead of storing a JWT.

- **@fastify/oauth2 v8 peer dependency:** Architecture research flagged this as MEDIUM confidence. If better-auth's native TikTok and Instagram providers handle OAuth internally (not via `@fastify/oauth2`), this is a non-issue. Verify whether better-auth requires `@fastify/oauth2` at all or manages OAuth flows internally.

- **TikTok app review policy on friend-aggregation apps:** TikTok explicitly rejects "personal use" apps in app review. Goonster is friend-aggregation — the product framing matters for whether TikTok production OAuth is achievable. This needs a product decision before production TikTok connect is planned.

- **Instagram product decision:** Personal Instagram accounts cannot be connected post-Dec 2024. Does Instagram connected account feature have product value if it only works for Business/Creator accounts? This gates all Phase 4 Instagram work.

---

## Sources

### Primary (HIGH confidence)
- https://better-auth.com/docs/integrations/fastify — Official better-auth Fastify integration
- https://better-auth.com/docs/adapters/drizzle — Drizzle adapter with schema generation
- https://better-auth.com/docs/authentication/tiktok — TikTok provider constraints
- https://fastify.dev/docs/latest/Reference/Encapsulation/ — Plugin encapsulation behavior
- https://fastify.dev/docs/latest/Reference/Decorators/ — FSTDEP006 decorator reference type issue
- https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/ — Instagram Basic Display API EOL confirmed Dec 2024
- https://developers.tiktok.com/doc/login-kit-web/ — TikTok OAuth v2, client_key parameter, no localhost
- https://github.com/better-auth/better-auth/issues/6766 — drizzle-orm v1 beta incompatibility
- https://orm.drizzle.team/docs/get-started/postgresql-new — Drizzle PostgreSQL setup
- https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html — CSRF prevention
- https://github.com/fastify/fastify-static — @fastify/static Range request support
- https://webkit.org/blog/6784/new-video-policies-for-ios/ — iOS video policy (v1.0)

### Secondary (MEDIUM confidence)
- https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/ — Instagram replacement API
- https://developers.tiktok.com/blog/introducing-sandbox — TikTok sandbox mode
- https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/ — Argon2id OWASP recommendation
- https://mihai-andrei.com/blog/refresh-token-reuse-interval-and-reuse-detection/ — Refresh token rotation pattern
- https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025 — Video playback best practices (v1.0)
- https://betterstack.com/community/guides/scaling-nodejs/fastify-express/ — Fastify vs Express performance

### Tertiary (LOW confidence, needs validation)
- Instagram personal account OAuth path forward — no official documentation covering Goonster's use case post-Dec 2024

---

## Appendix: V1.0 Research Summary (Preserved)

The v1.0 research (2026-04-01) established the player foundation. Key conclusions preserved for context:

- The video player has **zero dependencies on social features**. The player architecture (VideoStore interface, HTTP 206 streaming, Intersection Observer, iOS pitfalls) is complete and in production.
- **VideoStore interface** (`listVideos()`, `createReadStream()`, `getSize()`) is the single most important architectural decision — it abstracts disk vs. S3 and prevents scattered `fs` imports in route handlers.
- **All eight v1.0 critical pitfalls are iOS Safari issues** and must be addressed before any social features. They are in production as of v1.0.
- **Phase 3 (TikTok/Instagram content extraction) remains a future concern** — platform scraping legality, rate limits, and anti-scraping countermeasures require fresh research at implementation time.

For full v1.0 research detail, see the commit history for the original SUMMARY.md.

---

*Research completed: 2026-04-02 (v1.1 update)*
*Ready for roadmap: yes*
