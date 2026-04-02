# Phase 4: Database Foundation & Auth Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 04-database-foundation-auth-core
**Areas discussed:** Auth screens design, Auth flow UX, Password policy, Session & expiry

---

## Auth Screens Design

### Layout Style

| Option | Description | Selected |
|--------|-------------|----------|
| Centered card | Clean centered form card on branded background — standard mobile-first auth pattern | ✓ |
| Full-screen form | Form fields take up full mobile screen, no card, stacked inputs | |
| Bottom sheet | Auth form slides up from bottom like a mobile sheet/drawer | |

**User's choice:** Centered card
**Notes:** Recommended option — simple, familiar, works on all viewports

### Visual Tone

| Option | Description | Selected |
|--------|-------------|----------|
| Dark & minimal | Dark background with clean white/light card, matches dark video player | ✓ |
| Light & clean | White/light background with subtle card shadow | |
| Gradient accent | Dark base with subtle gradient accent (purple-to-blue) | |

**User's choice:** Dark & minimal
**Notes:** Creates continuity from auth screens to the dark video player feed

### Login/Register Toggle

| Option | Description | Selected |
|--------|-------------|----------|
| Link toggle | "Don't have an account? Register" text link below form | ✓ |
| Tab toggle | Tabs at top of card switching forms in-place | |
| Separate pages | Fully separate /login and /register pages | |

**User's choice:** Link toggle
**Notes:** Standard pattern, navigates between /login and /register URLs

### Registration Fields

| Option | Description | Selected |
|--------|-------------|----------|
| Email + password only | Minimal friction, display name set later (Phase 5 PROF-02) | ✓ |
| Email + password + display name | Capture name upfront, slightly more friction | |
| Email + password + confirm password | Password confirmation for safety | |

**User's choice:** Email + password only
**Notes:** Display name editing is in Phase 5 scope

### Input Styling

| Option | Description | Selected |
|--------|-------------|----------|
| Floating labels | Labels inside input that float above when focused/filled | ✓ |
| Stacked labels | Labels above each input field | |
| You decide | Let Claude pick | |

**User's choice:** Floating labels
**Notes:** Modern, compact, works well on mobile with dark theme

---

## Auth Flow UX

### Error Display

| Option | Description | Selected |
|--------|-------------|----------|
| Inline below field | Error text appears directly below the relevant input | ✓ |
| Toast notification | Error pops up as toast/banner | |
| Summary above form | All errors listed in box above form | |

**User's choice:** Inline below field
**Notes:** Most usable on mobile — user sees exactly what to fix

### Post-Login Destination

| Option | Description | Selected |
|--------|-------------|----------|
| Video feed (/feed) | Straight to the main experience | ✓ |
| Redirect to original page | Return to page user was trying to access | |
| Profile page (/profile) | Land on profile to complete setup | |

**User's choice:** Video feed (/feed)
**Notes:** This is what users came for

### Loading State

| Option | Description | Selected |
|--------|-------------|----------|
| Button spinner | Submit button shows spinner and becomes disabled | ✓ |
| Full overlay | Translucent overlay on entire card with centered spinner | |
| You decide | Let Claude pick simplest approach | |

**User's choice:** Button spinner
**Notes:** Simple, clear, prevents double-submit

### Auth Guard Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Instant redirect | Immediately redirect to /login, no flash of feed content | ✓ |
| Redirect with message | Redirect with "Please log in to continue" message | |
| Landing page first | Brief landing/splash screen with "Log in to watch" CTA | |

**User's choice:** Instant redirect
**Notes:** Clean and secure standard auth gate pattern

---

## Password Policy

### Strength Requirements

| Option | Description | Selected |
|--------|-------------|----------|
| Moderate (8+ chars) | No complexity rules, follows NIST 800-63B | ✓ |
| Minimal (6+ chars) | Lowest friction, weaker security | |
| Strict (8+ mixed) | Must include uppercase, lowercase, number | |
| You decide | Let Claude pick based on best practices | |

**User's choice:** Moderate (8+ characters, no complexity rules)
**Notes:** NIST 800-63B guidance — complexity rules don't meaningfully improve security

### Requirements Communication

| Option | Description | Selected |
|--------|-------------|----------|
| Hint text below field | "8+ characters" as subtle persistent hint | ✓ |
| Strength meter | Live weak/medium/strong bar | |
| On error only | No upfront hint, show error after submit | |

**User's choice:** Hint text below field
**Notes:** No surprises on submit

---

## Session & Expiry

### Session Duration

| Option | Description | Selected |
|--------|-------------|----------|
| 30 days | Standard for social/media apps | ✓ |
| 7 days | Shorter, re-login weekly | |
| Session only | Expires when browser closes | |
| You decide | Let Claude pick sensible default | |

**User's choice:** 30 days
**Notes:** Good balance for a casual video app users visit frequently

### Expiry Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Silent redirect | Quietly redirect to /login on 401, no message | ✓ |
| "Session expired" message | Show brief toast/message on login page | |
| Modal prompt | Pop up modal explaining session expired | |

**User's choice:** Silent redirect
**Notes:** Simplest to build, fine for a video app

---

## Claude's Discretion

- Database schema design, session store, password hashing, router selection, CORS config, auth middleware pattern, route guard pattern

## Deferred Ideas

None — discussion stayed within phase scope
