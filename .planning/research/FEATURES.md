# Feature Landscape: User Authentication, OAuth & Profile

**Domain:** User authentication, OAuth connected accounts, profile page
**Milestone:** v1.1 — layered onto existing short-form video player
**Researched:** 2026-04-02
**Confidence:** HIGH (email/password auth, Google OAuth, session patterns) / MEDIUM (TikTok/Instagram OAuth) / LOW (Instagram personal account flows)

---

## Table Stakes

Features users expect when an app has accounts. Missing any of these makes the product feel unfinished or untrustworthy.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| Email + password registration | Foundational; users who don't want OAuth must have a fallback | LOW | PostgreSQL users table, Argon2id hashing | Collect email, display name, password. No username field needed at this stage. |
| Email + password login | Pairs with registration; table stakes for any auth system | LOW | users table, session/token management | Return session cookie on success. |
| Secure password hashing | Non-negotiable for user trust and legal liability | LOW | argon2 npm package | Use Argon2id (2025 OWASP recommendation) over bcrypt. Negligible complexity difference. |
| Session persistence across page reloads | Users expect to stay logged in without re-entering credentials | LOW | @fastify/secure-session or DB-backed session | httpOnly, Secure, SameSite=Lax cookies. |
| Logout | Users must be able to end their session | LOW | Session invalidation on server | Clear server-side session on logout, not just client cookie. |
| Auth-gated feed | The existing video feed must require login | LOW | ProtectedRoute wrapper in React | Redirect unauthenticated users to /login; preserve intended URL for post-login redirect. |
| Post-login redirect to intended page | If user hits a protected route then logs in, return them to where they came from | LOW | React Router state param or localStorage | Standard pattern; feels broken when absent. |
| CSRF protection on state-mutating endpoints | Required when using cookie-based sessions | LOW | @fastify/csrf-protection | SameSite=Lax provides partial CSRF mitigation; explicit CSRF token for non-GET requests if SameSite=None is needed. |
| Google OAuth login | Google is universal; users strongly prefer "Continue with Google" over form filling | MEDIUM | @fastify/oauth2 or manual PKCE flow, users + oauth_accounts tables | PKCE + state param required. Google requires client_secret even with PKCE for Web Application types. |
| Connected accounts UI | Users who link OAuth providers need to see what's connected | LOW | oauth_accounts table, profile page | Show provider name + connected account email/handle, with Unlink button. |
| Basic profile page | Where the user sees and manages their account | LOW | Auth session, connected accounts data | Display name, email (read-only), connected accounts list. No avatar upload needed at this stage. |

---

## Differentiators

Features that go beyond what's strictly expected, adding real value for this specific product.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| TikTok OAuth connect | Connects the user's TikTok identity — foundational for future content aggregation | HIGH | TikTok developer app (staging works for dev; production requires app review) | App review requires a live, non-personal app with demo video. 1-14 day approval. In v1.1, only store the token — don't pull content yet. |
| Instagram OAuth connect | Connects Instagram identity for future Reels aggregation | HIGH | Meta developer app, Instagram API with Instagram Login (Basic Display API is dead as of Dec 2024) | Personal accounts NOT supported post-Dec 2024. Professional (Business/Creator) accounts only. This is a known blocker for personal-use aggregation — flag for product decision. |
| Display name editable on profile | Users can set how their name appears to friends | LOW | PATCH /api/users/me, users table display_name column | Simple text input with save button. Critical for "who shared this" future feature. |
| OAuth account conflict resolution | If user signs up with email then tries to link the same Google account someone else already connected, show a clear error | MEDIUM | Unique constraint on (provider, provider_user_id) in oauth_accounts | Prevents silent account merge bugs. |
| Graceful OAuth error handling | TikTok and Instagram OAuth flows can fail for many reasons (denied, app not approved, token expired); show clear, human-readable errors | LOW | Error state in OAuth callback handler | Most apps show a generic 500; doing this well is rare and builds trust. |

---

## Anti-Features

Features to explicitly not build in this milestone.

| Anti-Feature | Why It Gets Requested | Why to Avoid | What to Do Instead |
|--------------|----------------------|--------------|-------------------|
| Email verification flow | "You should verify emails" — true for production scale | Adds a full async flow (send email, expiring token, verify page) that's not blocking any v1.1 feature. The feed is still static files — no user-generated content risk yet. | Add a `email_verified` boolean column to the DB now (default false), but skip sending verification emails. Build the flow in a later milestone when the stakes justify it. |
| Password reset / forgot password | Users will ask for it | Requires email delivery infrastructure (SMTP / transactional email service). Zero-dependency email sending is not trivial to do well. | Mark `password_reset_token` column as future. Deferred until email infrastructure is in place. |
| Two-factor authentication (2FA/TOTP) | Security-conscious users want it | Real implementation complexity; TOTP requires secure QR code generation, recovery codes, and a smooth UX. Adds significant scope for a feature the v1.1 target user (developer/friend group) doesn't need yet. | Defer. Schema should not preclude adding it later (users table: `totp_secret nullable`). |
| Avatar / profile photo upload | Makes profiles feel complete | Requires file storage infrastructure (S3 or disk with size limits, image resizing, security validation). Scope explosion for no v1.1 product value. | Show initials-based avatar derived from display name. Use Google profile photo if connected. |
| Public profile pages | Social products have these | v1.1 has no social graph. Public profiles with no friends/content to show are meaningless. | Profile page is private/authenticated only. |
| Username (slug) for profiles | Users expect it from social apps | Adds uniqueness validation, URL routing, character restriction logic, and future conflict management. Not needed until profiles are public or shareable. | Use UUID or numeric ID for user-scoped URLs internally. |
| Role-based access control (RBAC) | "We'll need admin eventually" | Premature. All v1.1 users are equal. Adding roles now adds boilerplate with no immediate payoff. | Add a `role` column (default: 'user') to users table, but implement no access control logic on top of it. |
| Social login as the only option | Some apps drop email/password to simplify | Locks out users whose Google/TikTok accounts get banned or suspended; creates platform dependency. | Email/password is always the fallback. OAuth is additive, not exclusive. |
| Refresh token rotation visible to frontend | "Best practice for JWTs" | If using httpOnly cookie sessions (recommended), the frontend never touches tokens. Rotation complexity belongs server-side only. | Let @fastify/secure-session or @fastify/session handle session lifecycle server-side. |

---

## Feature Dependencies

```
[Auth Gate on Feed]
    └──requires──> [Session Management]
                       └──requires──> [Login / Registration endpoints]
                                          └──requires──> [PostgreSQL users table]
                                          └──requires──> [Argon2id hashing]

[Google OAuth Connect]
    └──requires──> [oauth_accounts table]
    └──requires──> [OAuth callback endpoint in Fastify]
    └──requires──> [PKCE + state param generation]
    └──requires──> [Session (user must be logged in to link, OR auto-register on first OAuth login)]

[TikTok OAuth Connect]
    └──requires──> [oauth_accounts table]
    └──requires──> [TikTok developer app (staging for dev, app review for production)]
    └──requires──> [OAuth callback endpoint]
    NOTE: Staging sandbox works for development without app review.
          Production use requires 1-14 day TikTok app review.
          App must NOT be for personal use — TikTok policy blocks this.

[Instagram OAuth Connect]
    └──requires──> [oauth_accounts table]
    └──requires──> [Meta developer app]
    └──requires──> [User has Professional (Business/Creator) Instagram account]
    BLOCKER: Instagram Basic Display API was killed Dec 4, 2024.
             Personal Instagram accounts can no longer connect to third-party apps.
             Only Business/Creator professional accounts work.
             This directly conflicts with Goonster's target user (personal friends).
             Product decision needed before building this.

[Profile Page]
    └──requires──> [Auth session (logged-in user only)]
    └──requires──> [Connected accounts read endpoint]
    └──can display──> [Google profile photo if oauth_accounts has google token]
    └──optional──> [Display name edit endpoint]

[Unlink Provider]
    └──requires──> [At least one other auth method remains (prevent lockout)]
    └──requires──> [DELETE /api/users/me/accounts/:provider]
```

---

## MVP Recommendation for v1.1

### Build in v1.1

1. **Email/password registration + login** — users table, Argon2id, session cookie
2. **Server-side session management** — @fastify/secure-session (stateless encrypted cookie) or @fastify/session with PostgreSQL store
3. **Auth-gated feed** — ProtectedRoute wrapper in React, 401 → redirect to /login with return URL
4. **Logout** — server-side session invalidation
5. **Google OAuth login/signup + connect** — PKCE flow, oauth_accounts table, auto-register new users
6. **TikTok OAuth connect (staging only)** — implement the full flow in dev/staging; production approval needed separately
7. **Instagram OAuth connect (flag blocker)** — implement the redirect flow, but document that personal account limitation may block the core use case
8. **Basic profile page** — display name, email, connected accounts list with unlink
9. **Display name edit** — PATCH /api/users/me

### Defer out of v1.1

- Email verification (add column, skip sending)
- Password reset (schema placeholder, no email infra)
- Avatar upload (initials fallback; use Google photo if available)
- 2FA/TOTP
- RBAC beyond storing a `role` field

---

## Platform OAuth Complexity: Reality Check

### Google OAuth
**Confidence: HIGH**
- Well-documented, stable, PKCE supported, OpenID Connect standard
- client_secret required even with PKCE (Google-specific behavior per RFC 7636 deviation)
- Redirect URI must be HTTPS (exception: localhost in development)
- Scopes needed for login: `openid email profile`
- Token contains: sub (stable user ID), email, name, picture — all you need for identity

### TikTok OAuth
**Confidence: MEDIUM**
- v2 OAuth API (RFC 6749 compliant) available for web apps
- access_token expires in 24 hours; refresh token available
- `user.info.basic` scope added by default on Login Kit
- Development/sandbox works without app review
- **Production requires app review**: submit demo video showing full end-to-end flow; apps for "personal use" are explicitly rejected by TikTok policy
- Timeline: 1-14 days (unofficial), manual review, no guarantees
- For v1.1: implement the full flow in staging — it works. Ship production TikTok connect in v1.2 post-review.

### Instagram OAuth
**Confidence: MEDIUM (with HIGH confidence the blocker is real)**
- Instagram Basic Display API: **dead since December 4, 2024** — no exceptions, no appeals
- Replacement: Instagram API with Instagram Login (requires Professional account)
- "Professional account" = Business or Creator type — NOT a regular personal Instagram account
- The people Goonster targets (friends sharing personal videos) use personal accounts
- **This is a product-level blocker**, not a technical one
- Technical implementation (OAuth redirect flow) is straightforward — Meta's OAuth is standard
- Recommend: implement the OAuth scaffold, display a clear "Professional account required" message on the connect screen, flag for product decision about whether this feature has value

---

## Database Schema Implications

These tables are required to implement all v1.1 features above.

```sql
-- Core user identity
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    password_hash TEXT,              -- nullable: users who only use OAuth have no password
    email_verified BOOLEAN NOT NULL DEFAULT false,  -- reserved for future email verification
    role        TEXT NOT NULL DEFAULT 'user',       -- reserved for future RBAC
    totp_secret TEXT,                               -- reserved for future 2FA
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- OAuth provider connections (one row per provider per user)
CREATE TABLE oauth_accounts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider        TEXT NOT NULL,           -- 'google' | 'tiktok' | 'instagram'
    provider_user_id TEXT NOT NULL,          -- stable ID from the provider
    access_token    TEXT,                    -- encrypted at rest
    refresh_token   TEXT,                    -- encrypted at rest
    token_expires_at TIMESTAMPTZ,
    raw_profile     JSONB,                   -- store full provider profile for future use
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)       -- prevents duplicate connections
);

-- Server-side sessions (if using DB-backed sessions over stateless cookies)
-- Only needed if NOT using @fastify/secure-session stateless cookies
CREATE TABLE sessions (
    id          TEXT PRIMARY KEY,            -- random session token
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    data        JSONB,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Schema notes:**
- `password_hash` is nullable to support OAuth-only users (no password set)
- `oauth_accounts.access_token` and `refresh_token` must be encrypted at rest — store encrypted with a server-side key, not plaintext
- `UNIQUE(provider, provider_user_id)` prevents the same TikTok/Google/Instagram account from being linked to two different Goonster users
- `raw_profile JSONB` lets you store the full provider response without schema migrations later (user's name, profile picture URL, etc.)

---

## Sources

- TikTok Login Kit for Web: https://developers.tiktok.com/doc/login-kit-web/
- TikTok App Review Guidelines: https://developers.tiktok.com/doc/app-review-guidelines
- TikTok Scopes Overview: https://developers.tiktok.com/doc/scopes-overview
- Instagram Basic Display API deprecation notice: https://developers.facebook.com/blog/post/2024/09/04/update-on-instagram-basic-display-api/
- Instagram Platform Overview (2025): https://developers.facebook.com/docs/instagram-platform/overview/
- Meta Instagram OAuth Authorize: https://developers.facebook.com/docs/instagram-platform/reference/oauth-authorize/
- Google OAuth 2.0 for Web: https://developers.google.com/identity/protocols/oauth2
- Google OAuth Best Practices: https://developers.google.com/identity/protocols/oauth2/resources/best-practices
- PKCE on Google (client_secret still required for Web Application type): https://ktaka.blog.ccmp.jp/2025/07/oogle-oauth2-and-pkce-understanding.html
- Password hashing comparison 2025 (Argon2id recommendation): https://guptadeepak.com/the-complete-guide-to-password-hashing-argon2-vs-bcrypt-vs-scrypt-vs-pbkdf2-2026/
- Fastify secure session (stateless encrypted cookie): https://github.com/fastify/fastify-secure-session
- Fastify session plugin: https://github.com/fastify/session
- Fastify CSRF protection: https://github.com/fastify/csrf-protection
- Auth0: User Account Linking patterns: https://auth0.com/docs/manage-users/user-accounts/user-account-linking
- Login & Signup UX best practices 2025: https://www.authgear.com/post/login-signup-ux-guide
- Protected routes in React Router: https://ui.dev/react-router-protected-routes-authentication

---

*Feature research for: v1.1 user authentication, OAuth connected accounts, profile page (Goonster)*
*Researched: 2026-04-02*
