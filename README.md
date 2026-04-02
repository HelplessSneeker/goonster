# Goonster

A mobile-first short-form video player that aggregates content shared by friends from TikTok, Instagram Reels, and YouTube Shorts into a single, friend-curated feed. Instead of an algorithm deciding what you watch, your feed is built from what your friends actually share.

**Core value:** A vertical-swipe video feed that plays content your friends chose to share — no algorithm, just people you trust.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS 4, TanStack Query 5, Swiper.js 11 |
| State | Zustand 5 |
| Backend | Node.js 22, Fastify 5, TypeScript |
| Validation | Zod 3 |
| Testing | Vitest 4, Testing Library |
| Tooling | pnpm (monorepo), tsx, ESLint, Prettier |

---

## Prerequisites

- Node.js >= 22 LTS
- pnpm >= 9

---

## Getting Started

```bash
git clone <repo-url>
cd goonster
pnpm install
```

---

## Development

**Backend** (API server on :3000):
```bash
pnpm dev:backend
```

**Frontend** (Vite dev server on :5173):
```bash
cd packages/frontend && pnpm dev
```

**Tests:**
```bash
pnpm test
```

**Type check (all packages):**
```bash
pnpm typecheck
```

---

## Project Structure

```
packages/
  backend/    — Fastify API server, static video file serving
  frontend/   — React SPA, vertical swipe video player
  shared/     — Shared TypeScript types and utilities
```

---

## Status

In active development (Milestone 1 — static content player).

The current milestone serves video files from disk with no external API calls or upload functionality. The architecture is designed to accommodate a cloud CDN backend in a future milestone without changes to the frontend components.
