# Phase 2: Video Player Core - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md -- this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 02-video-player-core
**Areas discussed:** Control overlay, Tap & pause feel, Non-standard video handling, Frontend scaffold

---

## Control overlay

### Mute button position

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom-right corner | TikTok-style, near thumb rest | Yes |
| Top-right corner | Instagram Reels-style, out of the way | |
| Bottom-left corner | Avoids future right-side social buttons | |

**User's choice:** Bottom-right corner
**Notes:** None

### Control visibility

| Option | Description | Selected |
|--------|-------------|----------|
| Always visible | Controls always on screen, TikTok approach | Yes |
| Auto-hide after 3s | Fade out after inactivity | |
| Progress always, mute auto-hides | Mixed approach | |

**User's choice:** Always visible
**Notes:** None

### Progress bar position

| Option | Description | Selected |
|--------|-------------|----------|
| Very bottom edge | Thin line at absolute bottom, TikTok/Reels style | Yes |
| Below mute button | More visible UI element | |
| Top edge | Instagram Stories-style | |

**User's choice:** Very bottom edge
**Notes:** None

---

## Tap & pause feel

### Pause visual feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Large centered play icon | Big semi-transparent play triangle, TikTok style | Yes |
| Dim overlay + icon | Screen dims with play icon, YouTube style | |
| No visual change | Video just freezes | |

**User's choice:** Large centered play icon
**Notes:** None

### Tap zone behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Mute button is exclusive | Mute icon only toggles audio, rest of video toggles pause | Yes |
| Mute button also pauses | Any tap pauses, mute via long-press | |

**User's choice:** Mute button is exclusive
**Notes:** None

### Pause icon persistence

| Option | Description | Selected |
|--------|-------------|----------|
| Stay until resumed | Play icon stays visible while paused | |
| Brief flash then fade | Icon appears ~0.5s then fades, screen stays clean | Yes |

**User's choice:** Brief flash then fade
**Notes:** User preferred clean screen while paused over persistent state indicator

---

## Non-standard video handling

### Aspect ratio handling

| Option | Description | Selected |
|--------|-------------|----------|
| Always cover/crop | object-fit: cover, non-9:16 gets cropped | Yes |
| Contain with blur bg | object-fit: contain with blurred background fill | |
| Contain with black bg | object-fit: contain with black letterboxing | |

**User's choice:** Always cover/crop
**Notes:** None

---

## Frontend scaffold

### Dev workflow

| Option | Description | Selected |
|--------|-------------|----------|
| Vite proxy | Vite proxies API calls to Fastify, single browser tab | Yes |
| CORS + separate ports | Frontend on :5173 calls backend on :3000 directly | |

**User's choice:** Vite proxy
**Notes:** None

### State management

| Option | Description | Selected |
|--------|-------------|----------|
| Local React state only | useState/useRef, no global store this phase | Yes |
| Zustand from the start | Set up Zustand now for Phase 3 readiness | |
| You decide | Claude picks | |

**User's choice:** Local React state only
**Notes:** None

---

## Claude's Discretion

- Component file organization
- Tailwind CSS configuration
- React + Vite + Tailwind scaffold details
- Intersection Observer approach
- Progress bar visual styling
- Mute button icon style and size
- Play icon appearance details
- Testing setup

## Deferred Ideas

None -- discussion stayed within phase scope
