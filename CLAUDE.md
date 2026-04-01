<!-- GSD:project-start source:PROJECT.md -->
## Project

**Goonster**

A mobile-first short-form video player that aggregates content shared by friends from TikTok, Instagram Reels, and YouTube Shorts into a single, friend-curated feed. Instead of an algorithm deciding what you watch, your feed is built from what your friends actually share.

**Core Value:** A vertical-swipe video feed that plays content your friends chose to share — no algorithm, just people you trust.

### Constraints

- **Tech stack (backend)**: Node/TypeScript — user preference
- **Mobile-first**: Web app must work excellently on mobile viewports; desktop is secondary
- **Static content only (m1)**: No upload, no extraction, no external API calls — serve files from disk
- **Future mobile**: Architecture choices should not preclude wrapping as native app later
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Technologies
| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| React | 19.2.x | Frontend UI | Largest ecosystem, best React Native upgrade path when going native. Concurrent rendering and Suspense handle video preloading cleanly. Unambiguous choice for web → native continuity. |
| Vite | 8.x | Build tool / dev server | CRA is dead. Vite is the de-facto successor — fast HMR, native ESM, first-class TypeScript, and direct `--host` flag for testing on mobile devices during development. Requires Node 20.19+. |
| TypeScript | 5.x | Type safety (frontend + backend) | User preference for Node backend; apply it frontend too for consistency. React 19 ships types out of the box, no extra @types/react needed beyond the @types/react-dom. |
| Fastify | 5.8.x | Node.js HTTP server | Built-in TypeScript support without `@types` gymnastics. 2–3x faster than Express in benchmarks (~48k req/s vs ~20k). First-class JSON schema validation. `@fastify/static` handles byte-range requests for video seeking. V4 is EOL June 2025; start on v5. |
| Tailwind CSS | 4.x | Styling | CSS-first config (no tailwind.config.js), 5x faster full builds. Mobile-first utility classes align perfectly with this project's viewport-optimized UI. Use it for the full-screen video layout, swipe overlays, and control elements. |
### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Zustand | 5.x | Client state (current video index, playback state, mute state) | Use for lightweight global UI state. The feed position, which video is active, and mute preference need to be accessible across components without prop drilling. Avoid Redux for this scope — overkill. |
| TanStack Query | 5.x | Server state / data fetching | Use for fetching the video list from the API. Provides caching, background refetch, and stale-while-revalidate so the feed doesn't re-fetch on every navigation. `useInfiniteQuery` is the right primitive for paginated feeds. |
| @fastify/static | 8.x | Static file serving | Fastify's official static file plugin. Handles HTTP Range headers natively, which is required for video seeking to work. Always use this rather than rolling your own stream handler. |
| @fastify/cors | 9.x | CORS headers | Needed when frontend (Vite dev: :5173) calls backend (Fastify: :3000). Configure strict origins in production. |
| Swiper.js | 11.x | Vertical swipe container | CSS scroll-snap alone has janky momentum on iOS Safari; Swiper provides battle-tested touch gesture handling, snap behavior, and a React component. Configure `direction: "vertical"`, `slidesPerView: 1`, and `mousewheel: true`. Alternative: pure CSS scroll-snap (simpler, but miss touch acceleration edge cases). |
| Vitest | 3.x | Unit / integration testing | Vite-native test runner. Same transform pipeline as your app, so video component tests work without JSDOM configuration pain. Pairs with `@testing-library/react`. |
| zod | 3.x | Runtime validation (backend) | Validate API inputs and environment config at startup. Fastify uses JSON Schema natively, but Zod + `zod-to-json-schema` bridges TypeScript types to Fastify's validation layer cleanly. |
### Development Tools
| Tool | Purpose | Notes |
|------|---------|-------|
| Node.js 22.x LTS | Runtime | Vite 8 requires ≥20.19; use 22 LTS for long-term stability. |
| pnpm | Package manager | Faster installs, strict node_modules, good monorepo support for when the project grows. Works identically with `npm` commands if you prefer. |
| ESLint 9.x | Linting | Flat config format (eslint.config.js). Use `@typescript-eslint/eslint-plugin` + `eslint-plugin-react-hooks`. |
| Prettier 3.x | Formatting | Consistent code style; configure `singleQuote: true`, `semi: false`. |
| tsx | TypeScript execution for backend dev | `tsx watch src/server.ts` for live-reload backend without compiling. Used in development only; compile with `tsc` for production. |
## Installation
# Frontend scaffold
# Frontend core
# Frontend styling
# Frontend dev
# Backend (separate directory or monorepo package)
# Backend dev
## Alternatives Considered
| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| React | Vue 3 | If team is Vue-native and native mobile path is not a priority. Vue's DX is excellent but Capacitor + React and React Native are both first-class; Vue Native is effectively abandoned. |
| React | Next.js | If you need SSR, SEO, or a file-based router from day one. Goonster v1 is a client-side SPA serving static video files — SSR adds complexity without benefit. Revisit at social-feed milestone. |
| Fastify | Express | Only if you need an existing massive Express ecosystem (dozens of third-party middleware) or have an existing codebase. For greenfield TypeScript, Fastify is strictly better. |
| Fastify | Hono | Hono is excellent and edge-runtime compatible. Choose it if you plan to deploy on Cloudflare Workers or Deno. For a Node/file-serving backend with no edge constraint, Fastify's plugin ecosystem is more mature. |
| Swiper.js | CSS scroll-snap only | Use pure CSS if you want zero JS for scrolling. Works fine on Chrome/Android; has known friction on iOS Safari with momentum and snap timing. Swiper solves this already. |
| Zustand | Jotai | Jotai is atom-based and marginally more granular. For a feed player, Zustand's flat store model is simpler and sufficient. |
| TanStack Query | SWR | Both are solid. TanStack Query v5 has better TypeScript generics and `useInfiniteQuery` which directly models paginated video feeds. SWR lacks a first-class infinite query primitive. |
| Tailwind CSS v4 | CSS Modules | CSS Modules are fine. Tailwind v4 is faster to iterate with and the mobile-first utilities (`sm:`, aspect-ratio, `h-dvh`) map directly to short-form video UI patterns. |
## What NOT to Use
| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Create React App | Unmaintained, removed from official React docs in 2023. Zero support for React 19. | `npm create vite@latest` |
| Express.js (greenfield) | Needs manual TypeScript setup, no built-in schema validation, half the throughput of Fastify. Technical debt from day one on a new TypeScript project. | Fastify 5 |
| Redux / Redux Toolkit | 5–10x more boilerplate than Zustand for the same result on a feed player with simple state shape. DevX cost not justified unless team size > 5 or business logic is extremely complex. | Zustand |
| Video.js | 500KB+ library designed for broadcast/VOD with skins, plugins, and ad systems. Complete overkill for a clean native `<video>` element in a controlled React component. Adds bundle weight with no benefit. | Native `<video>` + Intersection Observer |
| HLS.js (v1 scope) | Only needed for HLS adaptive bitrate streaming (.m3u8). v1 serves raw static files (mp4/webm). Don't add it until you need adaptive streaming or cloud CDN delivery. | Native `<video src="...">` |
| axios | Unnecessary for this app. TanStack Query uses `fetch` natively. Axios adds ~14KB for no benefit here. | `fetch` (via TanStack Query) |
| Material UI / Chakra UI | General-purpose component libraries designed for desktop-first, data-dense applications. Short-form video UIs need full-screen, touch-first components these libraries don't provide. | Tailwind CSS with custom components |
## Stack Patterns by Variant
- Use native `<video>` element with `autoplay`, `loop`, `muted`, `playsInline` attributes
- Use Intersection Observer API to trigger `play()` / `pause()` as videos enter/exit viewport (NOT on scroll events — IO is off main thread)
- Use Swiper.js vertical mode for the swipe container
- `playsInline` is non-negotiable on iOS — without it, Safari forces full-screen playback
- Use `@fastify/static` with `root` pointing to your video directory
- Ensure HTTP Range request support is enabled — it is by default in `@fastify/static`
- Add a `/videos` list endpoint returning JSON array of filenames + metadata
- Keep video metadata (duration, title, thumbnail) in a local JSON file for v1; no database needed
- Abstract the file URL resolution behind a single `resolveVideoUrl(id)` function from day one
- In v1 it returns a local path; in v2 it returns a signed S3/GCS URL
- This is the entire "future-proofing" needed — don't build more abstraction than this
- If choosing React Native: web components built in React map over with moderate rework; most business logic is reusable
- If choosing Capacitor: your Vite/React web app can be wrapped with minimal changes — the vertical swipe UI works as-is
- Defer this decision until the web player UX is validated
## Version Compatibility
| Package | Compatible With | Notes |
|---------|-----------------|-------|
| React 19.2.x | Vite 8.x | Fully supported. Use `react` + `react-dom` at same version. |
| React 19.2.x | Tailwind CSS 4.x | Supported. Known PostCSS conflict discussion exists but is resolved with `@tailwindcss/vite` plugin (skips PostCSS entirely). |
| React 19.2.x | TanStack Query 5.x | Fully supported. v5 uses React 18+ concurrent features. |
| Fastify 5.8.x | @fastify/static 8.x | Match major versions. Fastify 5 requires `@fastify/static` ≥7. Use 8.x for v5. |
| Fastify 5.8.x | @fastify/cors 9.x | Fastify 5 compatible. |
| Node 22.x | Fastify 5.8.x | Fully supported. Fastify 5 dropped support for Node < 20. |
| Vite 8.x | Node 22.x | Requires Node ≥20.19. Node 22 is fine. |
## Architecture Note: Monorepo vs Two Repos
## Sources
- https://fastify.dev/docs/latest/ — Fastify v5.8.x confirmed stable, TypeScript reference
- https://vite.dev/guide/ — Vite 8.0.2 confirmed, Node.js ≥20.19 requirement verified
- https://react.dev/blog/2025/10/01/react-19-2 — React 19.2.x confirmed stable (MEDIUM confidence — from search result snippet)
- https://tailwindcss.com/blog/tailwindcss-v4 — Tailwind v4.0 release Jan 2025 confirmed
- https://tanstack.com/query/v5/docs/framework/react/overview — TanStack Query v5 current docs
- https://betterstack.com/community/guides/scaling-nodejs/fastify-express/ — Fastify vs Express performance comparison (MEDIUM confidence — third-party benchmark)
- https://nextnative.dev/blog/capacitor-vs-react-native — Capacitor vs React Native comparison 2025 (MEDIUM confidence — vendor site)
- https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025 — Video playback best practices 2025 (MEDIUM confidence)
- https://github.com/reinaldosimoes/react-vertical-feed — Intersection Observer for TikTok-style feed (reference implementation)
- https://github.com/fastify/fastify-static — @fastify/static Range request support (HIGH confidence — official plugin)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
