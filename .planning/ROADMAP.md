# Roadmap: Goonster

## Milestones

- ✅ **v1.0 Static Video Player** — Phases 1-3 (shipped 2026-04-02)
- 🚧 **v1.1 User Authentication & Connected Accounts** — Phases 4-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 Static Video Player (Phases 1-3) — SHIPPED 2026-04-02</summary>

- [x] Phase 1: Backend Foundation (2/2 plans) — completed 2026-04-01
- [x] Phase 2: Video Player Core (3/3 plans) — completed 2026-04-02
- [x] Phase 3: Feed & Navigation (3/3 plans) — completed 2026-04-02

See: `.planning/milestones/v1.0-ROADMAP.md` for full phase details.

</details>

### 🚧 v1.1 User Authentication & Connected Accounts (In Progress)

**Milestone Goal:** Add user authentication (email/password + OAuth) with connected accounts architecture for TikTok, Google, and Instagram, gating the existing feed behind login.

- [ ] **Phase 4: Database Foundation & Auth Core** - PostgreSQL schema, CORS fix, email/password auth, sessions, auth-gated feed, client-side routing
- [ ] **Phase 5: Google OAuth & Profile Page** - Google sign-in/connect, extensible OAuth framework, profile page with connected accounts, display name editing
- [ ] **Phase 6: TikTok OAuth & Instagram Scaffold** - TikTok OAuth connect (staging/sandbox), Instagram OAuth scaffold with Professional-account messaging
- [ ] **Phase 7: Email Delivery & Profile Completion** - Transactional email for verification + password reset, avatar management, account deletion

## Phase Details

### Phase 4: Database Foundation & Auth Core
**Goal**: Users can create accounts, log in, and access an auth-gated video feed
**Depends on**: Phase 3 (v1.0 complete)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can register a new account with email and password
  2. User can log in and have their session persist across browser refresh (httpOnly cookie)
  3. User can log out and the session is destroyed server-side
  4. Unauthenticated user visiting the feed is redirected to /login; authenticated user is shown the feed
  5. Client-side routes /login, /register, /feed, and /profile exist and render the correct page
**Plans**: 4 plans
Plans:
- [x] 04-01-PLAN.md — PostgreSQL + Drizzle ORM + better-auth backend infrastructure, Wave 0 test stubs
- [x] 04-02-PLAN.md — CORS credentials fix, auth guards on feed/video, Vite proxy, frontend auth client, shared types
- [x] 04-03-PLAN.md — Auth UI components, login/register/profile pages, React Router setup, ProtectedRoute, LogoutButton, 401 handler
- [ ] 04-04-PLAN.md — Backend auth integration tests, end-to-end verification checkpoint
**UI hint**: yes

### Phase 5: Google OAuth & Profile Page
**Goal**: Users can sign in with Google and manage their connected accounts on a profile page
**Depends on**: Phase 4
**Requirements**: OAUTH-01, OAUTH-02, OAUTH-05, PROF-01, PROF-02
**Success Criteria** (what must be TRUE):
  1. User can sign in or register using Google (full OIDC redirect flow)
  2. Logged-in user can connect their Google account from the profile page
  3. Logged-in user can disconnect Google from the profile page (with lockout guard preventing last-auth-method removal)
  4. User can view their profile page showing name, avatar, and connected accounts list
  5. User can edit their display name from the profile page
**Plans**: TBD
**UI hint**: yes

### Phase 6: TikTok OAuth & Instagram Scaffold
**Goal**: Users can connect a TikTok account (sandbox) and see the Instagram connect option with clear availability messaging
**Depends on**: Phase 5
**Requirements**: OAUTH-03, OAUTH-04
**Success Criteria** (what must be TRUE):
  1. User can initiate TikTok OAuth and complete the sandbox/staging connect flow end-to-end
  2. User sees TikTok listed as a connected account on their profile after connecting
  3. User sees an Instagram connect option on their profile page that displays "Professional account required" messaging
**Plans**: TBD
**UI hint**: yes

### Phase 7: Email Delivery & Profile Completion
**Goal**: Users receive transactional emails and can fully manage their profile including avatar and account deletion
**Depends on**: Phase 4
**Requirements**: AUTH-05, AUTH-06, AUTH-07, INFRA-04, PROF-03, PROF-04, PROF-05
**Success Criteria** (what must be TRUE):
  1. User receives an email verification link after registration and the link confirms their account
  2. User can request a password reset and receive a reset link by email
  3. User can set a new password by following the reset link
  4. User can upload or change their avatar from the profile page
  5. User can change their password from profile settings
  6. User can delete their own account and all associated data is removed
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Backend Foundation | v1.0 | 2/2 | Complete | 2026-04-01 |
| 2. Video Player Core | v1.0 | 3/3 | Complete | 2026-04-02 |
| 3. Feed & Navigation | v1.0 | 3/3 | Complete | 2026-04-02 |
| 4. Database Foundation & Auth Core | v1.1 | 3/4 | In Progress|  |
| 5. Google OAuth & Profile Page | v1.1 | 0/? | Not started | - |
| 6. TikTok OAuth & Instagram Scaffold | v1.1 | 0/? | Not started | - |
| 7. Email Delivery & Profile Completion | v1.1 | 0/? | Not started | - |
