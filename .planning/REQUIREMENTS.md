# Requirements: Goonster

**Defined:** 2026-04-02
**Core Value:** A vertical-swipe video feed that plays content your friends chose to share — no algorithm, just people you trust.

## v1.1 Requirements

Requirements for User Authentication & Connected Accounts milestone. Each maps to roadmap phases.

### Authentication

- [ ] **AUTH-01**: User can register with email and password
- [ ] **AUTH-02**: User can log in with email and password
- [ ] **AUTH-03**: User can log out (session destroyed server-side)
- [ ] **AUTH-04**: User session persists across browser refresh (httpOnly cookie)
- [ ] **AUTH-05**: User receives email verification link after registration
- [ ] **AUTH-06**: User can request password reset via email link
- [ ] **AUTH-07**: User can set new password via reset link

### OAuth & Connected Accounts

- [ ] **OAUTH-01**: User can sign in with Google (full OIDC flow)
- [ ] **OAUTH-02**: User can connect/disconnect Google account on profile
- [ ] **OAUTH-03**: User can connect TikTok account (staging/sandbox flow)
- [ ] **OAUTH-04**: User can connect Instagram account (scaffold — Business/Creator only, surfaced in UI)
- [ ] **OAUTH-05**: OAuth framework supports adding new providers without architectural changes

### Profile

- [ ] **PROF-01**: User can view own profile page (name, avatar, connected accounts)
- [ ] **PROF-02**: User can edit display name
- [ ] **PROF-03**: User can set/change avatar
- [ ] **PROF-04**: User can change password from profile settings
- [ ] **PROF-05**: User can delete own account

### Infrastructure

- [ ] **INFRA-01**: PostgreSQL database with Drizzle ORM schema (users, sessions, accounts, tokens)
- [ ] **INFRA-02**: Video feed requires authentication to view
- [ ] **INFRA-03**: Client-side routing (login, register, profile, feed pages)
- [ ] **INFRA-04**: Transactional email delivery for verification and password reset
- [ ] **INFRA-05**: CORS configuration updated for credentialed requests

## Future Requirements

### Social

- **SOCL-01**: User can add friends
- **SOCL-02**: User can see friends' shared videos in feed
- **SOCL-03**: User can share a video to friends

### Content Ingestion

- **CING-01**: User can paste a TikTok/Reels/Shorts link to share
- **CING-02**: System extracts video from shared link
- **CING-03**: Connected accounts pull shared content automatically

## Out of Scope

| Feature | Reason |
|---------|--------|
| Instagram personal account OAuth | Instagram Basic Display API dead (Dec 2024); only Business/Creator accounts supported via Graph API |
| TikTok production app review | No SLA on review timeline; staging flow validates architecture |
| Video upload | Static files only for now |
| Algorithm/recommendation engine | Against core product vision |
| Push notifications | Notification fatigue; anti-pattern for product ethos |
| Two-factor authentication | Unnecessary complexity for v1.1; revisit when handling sensitive data |
| OAuth content pulling | OAuth connections are login/identity only in v1.1; content ingestion is future milestone |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 4 | Pending |
| INFRA-02 | Phase 4 | Pending |
| INFRA-03 | Phase 4 | Pending |
| INFRA-05 | Phase 4 | Pending |
| AUTH-01 | Phase 4 | Pending |
| AUTH-02 | Phase 4 | Pending |
| AUTH-03 | Phase 4 | Pending |
| AUTH-04 | Phase 4 | Pending |
| OAUTH-01 | Phase 5 | Pending |
| OAUTH-02 | Phase 5 | Pending |
| OAUTH-05 | Phase 5 | Pending |
| PROF-01 | Phase 5 | Pending |
| PROF-02 | Phase 5 | Pending |
| OAUTH-03 | Phase 6 | Pending |
| OAUTH-04 | Phase 6 | Pending |
| AUTH-05 | Phase 7 | Pending |
| AUTH-06 | Phase 7 | Pending |
| AUTH-07 | Phase 7 | Pending |
| INFRA-04 | Phase 7 | Pending |
| PROF-03 | Phase 7 | Pending |
| PROF-04 | Phase 7 | Pending |
| PROF-05 | Phase 7 | Pending |

**Coverage:**
- v1.1 requirements: 22 total (7 AUTH + 5 OAUTH + 5 PROF + 5 INFRA)
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-02*
*Last updated: 2026-04-02 after roadmap creation*
