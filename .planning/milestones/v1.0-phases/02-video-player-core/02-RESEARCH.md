# Phase 2: Video Player Core - Research

**Researched:** 2026-04-01
**Domain:** React 19 frontend scaffold + HTML5 video player with iOS Safari constraints
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Mute/unmute button positioned in the bottom-right corner of the video (TikTok-style, thumb-reachable)
- **D-02:** All overlay controls (mute button, progress bar) are always visible — no auto-hide behavior
- **D-03:** Thin progress bar at the very bottom edge of the video area (TikTok/Reels style)
- **D-04:** Tapping the video body toggles play/pause; tapping the mute button only toggles audio — exclusive tap zones, no overlap
- **D-05:** On pause, a large semi-transparent play icon appears centered, flashes briefly (~0.5s), then fades out. Video stays paused with a clean screen until tapped again to resume.
- **D-06:** All videos display with `object-fit: cover` regardless of aspect ratio — consistent immersive fill prioritized over showing all content.
- **D-07:** Vite dev server proxies `/feed` and `/video/*` requests to Fastify backend on :3000 — no CORS configuration needed during development
- **D-08:** Local React state only (useState/useRef) for playback state, mute, progress. No Zustand in this phase — add global store in Phase 3 when feed state matters.

### Claude's Discretion

- Component file organization within `/packages/frontend/src/`
- Tailwind CSS configuration and utility patterns
- React + Vite + Tailwind scaffold details (tsconfig, vite.config, etc.)
- Intersection Observer vs other approaches for play/pause triggering
- Progress bar color, thickness, and animation
- Mute button icon style and size
- Play icon appearance (size, opacity, fade animation timing)
- Testing setup (Vitest + Testing Library configuration)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PLAY-01 | Video plays fullscreen in vertical (9:16) format with `object-fit: cover` | `h-dvh w-full object-cover` Tailwind pattern; `-webkit-fill-available` fallback for Safari |
| PLAY-02 | First video autoplays muted on page load without user interaction | `autoPlay muted playsInline` attributes on `<video>`; browser autoplay policy requires muted |
| PLAY-03 | User can mute/unmute via a visible, persistent control on the video overlay | Absolute-positioned button over video; `video.muted` toggle via ref |
| PLAY-04 | User can tap the video body to toggle play/pause | onClick on video container with pointer-events exclusion zone for mute button |
| PLAY-05 | Video loops automatically when it reaches the end | `loop` attribute on `<video>`; verified as native behavior |
| PLAY-06 | Thin progress bar overlay shows elapsed time on the current video | `timeupdate` event + `video.currentTime / video.duration` → CSS width transform |
| MOBL-01 | App uses `100dvh` with `-webkit-fill-available` fallback for correct mobile viewport | CSS pattern: `min-height: 100dvh; min-height: -webkit-fill-available` |
| MOBL-02 | All `<video>` elements include `playsinline` attribute for iOS Safari compatibility | `playsInline` (camelCase in JSX); without it iOS Safari forces fullscreen player |
| MOBL-03 | Layout and controls optimized for mobile-first touch interaction | Touch event handling; button sizing ≥44px per Apple HIG; Tailwind `touch-manipulation` |
| MOBL-04 | Only one video plays at a time (respects iOS single-video hardware constraint) | Phase 2 has single video — constraint is trivially satisfied; architecture is designed to enforce it in Phase 3 |
</phase_requirements>

---

## Summary

Phase 2 creates the React/Vite/Tailwind frontend package from scratch and implements a single fullscreen video player component that works correctly on iOS Safari. The core technical challenges are: (1) iOS Safari's strict autoplay policy requiring `muted + playsInline`; (2) correct mobile viewport height using `100dvh` with `-webkit-fill-available` fallback; (3) exclusive tap zones so the mute button and video body don't interfere; and (4) the progress bar animation using `requestAnimationFrame` or `timeupdate` events.

The backend (Phase 1) is complete and serving video files at `/video/{filename}` with HTTP 206 range support. The frontend only needs to scaffold a new `packages/frontend` package, set up the Vite proxy to `:3000`, fetch one video from `GET /feed?limit=1`, and render the player. State is entirely local (`useState`/`useRef`) per D-08 — no global store this phase.

The iOS single-video constraint (MOBL-04) is trivially satisfied by Phase 2's single-video design. The architecture — where only the component at `activeIndex` calls `play()` — is the pattern that will enforce it in Phase 3.

**Primary recommendation:** Scaffold `packages/frontend` with Vite + React 19 + Tailwind 4 using the `@tailwindcss/vite` plugin (no PostCSS config). Use `<video autoPlay muted loop playsInline>` as the element baseline. Implement the Vite proxy for `/feed` and `/video` in `vite.config.ts`.

---

## Standard Stack

### Core (verified against npm registry 2026-04-01)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.4 | Frontend UI | Already decided; matches backend's shared types package |
| react-dom | 19.2.4 | DOM renderer | Always paired with React |
| Vite | 8.0.3 | Build tool / dev server | Already decided; `--host` flag for mobile device testing |
| TypeScript | 6.0.2 | Type safety | Backend uses 6.0.2; match for consistency |
| Tailwind CSS | 4.2.2 | Styling | Already decided; CSS-first, no tailwind.config.js |
| @tailwindcss/vite | 4.2.2 | Tailwind Vite integration | Replaces PostCSS pipeline; avoids PostCSS conflicts with React 19 |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tanstack/react-query | 5.96.1 | Fetch the feed metadata | `useQuery` for `GET /feed?limit=1`; handles loading/error state cleanly |
| Vitest | 4.1.2 | Unit testing | Already installed in backend; use same version; needs jsdom environment for DOM tests |
| @testing-library/react | 16.3.2 | Component testing | Standard companion to Vitest for React; `render`, `fireEvent`, `waitFor` |
| @testing-library/user-event | 14.6.1 | User interaction simulation | More realistic than `fireEvent` for tap/click tests |
| jsdom | 29.0.1 | DOM environment for tests | Vitest environment for component tests |
| @types/react-dom | 19.x | React DOM types | Required for TSX; React 19 ships its own `@types/react` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @tanstack/react-query | Plain fetch + useState | React Query provides loading/error/retry for free; worth it even for single fetch |
| requestAnimationFrame loop for progress | `timeupdate` event | rAF is smoother (60fps) but heavier; `timeupdate` fires ~4-250ms and is sufficient for a thin progress bar |
| CSS transition for progress bar | JS width update | CSS transition `width` on the bar element is the simplest correct approach |

### Installation

```bash
# From monorepo root
cd packages/frontend

pnpm add react@^19 react-dom@^19 @tanstack/react-query@^5

pnpm add -D vite@^8 @vitejs/plugin-react@^4 typescript@^6 @types/react-dom@^19
pnpm add -D tailwindcss@^4 @tailwindcss/vite@^4
pnpm add -D vitest@^4 jsdom@^29 @testing-library/react@^16 @testing-library/user-event@^14
```

**Version verification:** All versions above confirmed from npm registry on 2026-04-01.

---

## Architecture Patterns

### Recommended Project Structure

```
packages/frontend/
├── src/
│   ├── components/
│   │   └── VideoPlayer/
│   │       ├── VideoPlayer.tsx       # <video> + overlay controls
│   │       ├── ProgressBar.tsx       # thin bottom bar
│   │       ├── MuteButton.tsx        # bottom-right button
│   │       ├── PauseFlash.tsx        # centered flash icon (D-05)
│   │       └── index.ts
│   ├── hooks/
│   │   ├── useVideoPlayer.ts         # play/pause/mute state + refs
│   │   └── useVideoProgress.ts       # timeupdate → progress 0-1
│   ├── api/
│   │   └── feedApi.ts                # GET /feed typed fetch
│   ├── App.tsx                       # QueryClientProvider + main layout
│   ├── main.tsx                      # createRoot entry
│   └── index.css                     # @import "tailwindcss"; + viewport fix
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

### Pattern 1: Vite Proxy Configuration (D-07)

**What:** Vite dev server forwards `/feed` and `/video/*` to Fastify on :3000 — frontend code uses relative URLs, no CORS complexity.
**When to use:** Development only. The proxy config lives in `vite.config.ts` and is transparent to all component code.

```typescript
// vite.config.ts
// Source: https://vite.dev/config/server-options.html#server-proxy
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/feed': 'http://localhost:3000',
      '/video': 'http://localhost:3000',
    },
  },
})
```

### Pattern 2: iOS Safari Video Element Baseline

**What:** The minimum required set of `<video>` attributes for correct iOS Safari behavior. Missing any of these causes visible regressions.
**When to use:** Always — every `<video>` element in this project must carry all four attributes.

```tsx
// Source: https://webkit.org/blog/6784/new-video-policies-for-ios/
<video
  ref={videoRef}
  src={videoUrl}
  autoPlay           // triggers play on mount; requires muted
  muted              // required for autoplay to work in all browsers
  loop               // PLAY-05: seamless loop
  playsInline        // MOBL-02: prevents iOS Safari from going fullscreen
  className="w-full h-full object-cover"
/>
```

**Critical:** `playsInline` without this attribute, iOS Safari opens a native full-screen player and the overlay controls are invisible.

### Pattern 3: Mobile Viewport Height (MOBL-01)

**What:** `100vh` on iOS Safari includes the browser chrome, causing content to be hidden behind the address bar. `100dvh` is the correct modern fix. `-webkit-fill-available` is the legacy fallback for older iOS.
**When to use:** The top-level app container only.

```css
/* src/index.css — applied to html, body, and the root container */
/* Source: https://developer.mozilla.org/en-US/docs/Web/CSS/length/dvh */
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.fullscreen-container {
  height: 100dvh;              /* Modern: dynamic viewport height */
  min-height: -webkit-fill-available;  /* iOS Safari fallback */
  width: 100%;
  overflow: hidden;
}
```

With Tailwind 4, use `h-dvh` utility class. For the `-webkit-fill-available` fallback, add a CSS custom property or use the `@supports` approach since Tailwind 4 does not have a built-in utility for `-webkit-fill-available`.

### Pattern 4: Exclusive Tap Zones (D-04)

**What:** The video body's `onClick` triggers play/pause. The mute button must stop the click from propagating to the video body.
**When to use:** Required to satisfy D-04. Without this, tapping the mute button also toggles play/pause.

```tsx
// VideoPlayer.tsx
function VideoPlayer({ video }: { video: VideoMeta }) {
  const { videoRef, isPlaying, isMuted, togglePlay, toggleMute } = useVideoPlayer()

  return (
    <div className="relative h-dvh w-full" onClick={togglePlay}>
      <video ref={videoRef} ... />

      {/* Overlay controls — must stop propagation */}
      <div className="absolute inset-0 pointer-events-none">
        <MuteButton
          isMuted={isMuted}
          onToggle={(e) => { e.stopPropagation(); toggleMute() }}
          className="pointer-events-auto"
        />
        <ProgressBar videoRef={videoRef} />
        <PauseFlash isPlaying={isPlaying} />
      </div>
    </div>
  )
}
```

**Key detail:** The outer `div` catches all taps. Overlay children that should NOT trigger play/pause need `e.stopPropagation()` and `pointer-events-auto` on their own element with `pointer-events-none` on the parent overlay div.

### Pattern 5: Progress Bar with timeupdate

**What:** Subscribe to the video element's `timeupdate` event to drive a progress bar width. `timeupdate` fires 4-15 times per second — sufficient for a thin bar.

```tsx
// useVideoProgress.ts
export function useVideoProgress(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handler = () => {
      if (video.duration > 0) {
        setProgress(video.currentTime / video.duration)
      }
    }

    video.addEventListener('timeupdate', handler)
    return () => video.removeEventListener('timeupdate', handler)
  }, [videoRef])

  return progress
}
```

```tsx
// ProgressBar.tsx — Tailwind 4 inline style for dynamic width
<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/30">
  <div
    className="h-full bg-white transition-[width] duration-100 ease-linear"
    style={{ width: `${progress * 100}%` }}
  />
</div>
```

### Pattern 6: Pause Flash Animation (D-05)

**What:** On pause, a large play icon appears, holds briefly, then fades. Video stays paused — icon disappears after animation, not the video state.

```tsx
// PauseFlash.tsx
function PauseFlash({ isPlaying }: { isPlaying: boolean }) {
  const [showIcon, setShowIcon] = useState(false)
  const [visible, setVisible] = useState(false)
  const prevPlaying = useRef(isPlaying)

  useEffect(() => {
    // Only trigger when transitioning FROM playing TO paused
    if (prevPlaying.current && !isPlaying) {
      setShowIcon(true)
      setVisible(true)
      // After 0.5s, fade out
      const timer = setTimeout(() => setVisible(false), 500)
      // Remove from DOM after fade completes
      const cleanup = setTimeout(() => setShowIcon(false), 800)
      return () => { clearTimeout(timer); clearTimeout(cleanup) }
    }
    prevPlaying.current = isPlaying
  }, [isPlaying])

  if (!showIcon) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none"
      style={{ transition: 'opacity 300ms', opacity: visible ? 1 : 0 }}
    >
      <div className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center">
        {/* Play triangle — SVG or unicode */}
        <span className="text-white text-4xl ml-1">▶</span>
      </div>
    </div>
  )
}
```

### Pattern 7: useVideoPlayer Hook (D-08)

**What:** Encapsulates all local state for one video element. Phase 2 keeps this in a hook with `useState`/`useRef` — no global store.

```tsx
// useVideoPlayer.ts
export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true) // starts muted per PLAY-02

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {})
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = !video.muted
    setIsMuted(video.muted)
  }, [])

  // Sync state with video events (browser may pause for buffering, etc.)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    video.addEventListener('play', onPlay)
    video.addEventListener('pause', onPause)
    return () => {
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', onPause)
    }
  }, [])

  return { videoRef, isPlaying, isMuted, togglePlay, toggleMute }
}
```

### Pattern 8: Feed API Fetch with TanStack Query

**What:** Fetch one video from the backend using TanStack Query. The feed API is already built — frontend just calls it.

```tsx
// api/feedApi.ts
import type { VideoMeta } from '@goonster/shared'

interface FeedResponse {
  data: { items: VideoMeta[]; nextCursor: string | null }
  meta: { total: number }
}

export async function fetchFeed(limit = 1): Promise<FeedResponse> {
  const res = await fetch(`/feed?limit=${limit}`)
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  return res.json() as Promise<FeedResponse>
}
```

```tsx
// App.tsx
import { useQuery } from '@tanstack/react-query'

function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feed', 1],
    queryFn: () => fetchFeed(1),
  })

  if (isLoading) return <div className="h-dvh flex items-center justify-center text-white">Loading...</div>
  if (error) return <div className="h-dvh flex items-center justify-center text-white">Error loading video</div>

  const video = data?.data.items[0]
  if (!video) return null

  return <VideoPlayer video={video} />
}
```

### Anti-Patterns to Avoid

- **Omitting `playsInline`:** iOS Safari launches a native video player overlay. Overlay controls become invisible. Non-negotiable attribute.
- **Using `100vh` instead of `100dvh`:** On iOS Safari the address bar clips the bottom of the content. Use `h-dvh` (Tailwind 4) everywhere height matters.
- **Calling `video.play()` without catching the promise:** `play()` returns a Promise that rejects if autoplay is blocked. Always `.catch(() => {})` to avoid uncaught rejection errors.
- **Attaching `onClick` directly to `<video>`:** On iOS Safari, `onClick` on a `<video>` element is unreliable. Attach the click handler to a wrapping `<div>` positioned over the video instead.
- **Reading `video.muted` as React state without a ref:** `video.muted` is set imperatively on the DOM element; useState must be kept in sync by reading from `videoRef.current.muted` after setting.
- **Forgetting `e.stopPropagation()` on overlay buttons:** Without this, tapping the mute button also fires the play/pause handler on the container.
- **Using `video.src` directly from VideoMeta.id:** The backend serves files at `/video/{filename}`, not `/video/{id}`. Construct the URL from `VideoMeta.filename`.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video fetching + loading state | Manual fetch + useState loading flag | TanStack Query `useQuery` | Handles race conditions, retries, and stale state automatically |
| Mobile viewport height | Custom JS height calculation | `100dvh` + `-webkit-fill-available` CSS | This is a solved CSS problem; JS approaches have scroll-related jank |
| Video element event management | Custom EventEmitter or pub/sub | `video.addEventListener` + React `useEffect` cleanup | Native browser events are the correct abstraction |
| Tailwind configuration | Custom CSS utility generation | Tailwind 4 `@tailwindcss/vite` plugin | CSS-first config; adding tailwind.config.js is the old API and unnecessary in v4 |
| Touch gesture detection for tap | Custom `touchstart`/`touchend` tracking | `onClick` on wrapper div | Browsers fire `onClick` for taps; no touch tracking needed for simple tap-to-pause |

**Key insight:** This phase's complexity is entirely in HTML5 video API quirks and iOS Safari constraints — not in framework architecture. Every "custom" solution in this space has been debugged by the browser vendors already; use the native APIs.

---

## Common Pitfalls

### Pitfall 1: iOS Safari Autoplay Block

**What goes wrong:** Video doesn't play on first load; user has to tap the video to start it.
**Why it happens:** iOS Safari blocks autoplay unless the video is muted AND `playsInline` is set AND the `autoplay` attribute is present. Any one of these missing causes silent failure.
**How to avoid:** Use `<video autoPlay muted playsInline loop>` — all four attributes every time. React uses camelCase `autoPlay` and `playsInline`.
**Warning signs:** `play()` promise rejects with `NotAllowedError: The request is not allowed by the user agent or the platform in the current context.`

### Pitfall 2: Viewport Clipping on iOS Safari

**What goes wrong:** Bottom controls (mute button, progress bar) are hidden behind the iOS home indicator bar or clipped by the browser navigation bar.
**Why it happens:** `100vh` on older iOS Safari measures the viewport including the browser chrome, then the chrome resizes, and the layout doesn't update. `100dvh` dynamically tracks the actual available height.
**How to avoid:** Use `h-dvh` from Tailwind 4 on the root container. Add `min-height: -webkit-fill-available` as a CSS fallback for iOS 14 and older.
**Warning signs:** Controls visible in desktop browser but cut off on physical iPhone.

### Pitfall 3: onClick on `<video>` Unreliable on iOS Safari

**What goes wrong:** Tapping the video does nothing on iPhone; works on desktop.
**Why it happens:** iOS Safari does not reliably fire `onClick` on `<video>` elements when they are in inline playback mode.
**How to avoid:** Never attach `onClick` to `<video>`. Use a `<div>` overlay positioned absolutely over the video with `onClick`. The div's `pointer-events: auto` intercepts all taps.
**Warning signs:** Click handler fires in Chrome DevTools mobile emulator but not on real device.

### Pitfall 4: Muted State Sync

**What goes wrong:** Mute button shows "muted" but audio is actually playing, or vice versa.
**Why it happens:** `video.muted` is a DOM property, not a React state. If you toggle `video.muted` imperatively without updating `useState`, the component re-renders with stale state.
**How to avoid:** After setting `video.muted = !video.muted`, read back `video.muted` and update state with that value (not the negation of the previous state).
**Warning signs:** Mute button icon is out of sync after toggling multiple times quickly.

### Pitfall 5: Video URL Construction

**What goes wrong:** 404 on video requests; video never loads.
**Why it happens:** The backend serves files at `/video/{filename}` (using `@fastify/static` with `prefix: '/video/'`). `VideoMeta.id` is a UUID — not the filename. Using `id` as the URL component gives a 404.
**How to avoid:** Construct video URL as `/video/${video.filename}`, not `/video/${video.id}`.
**Warning signs:** Network tab shows 404 for video requests; the URL contains a UUID.

### Pitfall 6: Tailwind 4 Breaking Change — No tailwind.config.js

**What goes wrong:** `tailwind.config.js` pattern from Tailwind 3 throws errors or silently does nothing in Tailwind 4.
**Why it happens:** Tailwind CSS 4 uses CSS-first configuration. The JavaScript config file format is gone.
**How to avoid:** Configure Tailwind 4 via CSS `@theme` directives in `src/index.css`. Use `@tailwindcss/vite` plugin (not PostCSS plugin). Do not create `tailwind.config.js`.
**Warning signs:** Tailwind utilities work but custom colors/fonts are not applied.

### Pitfall 7: TypeScript Module Format Mismatch

**What goes wrong:** Frontend imports from `@goonster/shared` fail at build time.
**Why it happens:** The backend uses `"module": "Node16"` in `tsconfig.base.json`. The frontend needs `"module": "ESNext"` and `"moduleResolution": "Bundler"` since Vite handles module resolution, not Node.
**How to avoid:** Create a separate `packages/frontend/tsconfig.json` that does NOT extend `tsconfig.base.json` — or extends it and explicitly overrides `module` and `moduleResolution` for Bundler mode.
**Warning signs:** `Cannot find module` errors for workspace packages despite correct imports.

---

## Code Examples

### Tailwind 4 CSS Setup

```css
/* src/index.css */
/* Source: https://tailwindcss.com/docs/installation/vite */
@import "tailwindcss";

/* Mobile viewport fix for iOS Safari */
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
```

### Frontend tsconfig.json (Vite/Bundler mode)

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

Note: `"module": "ESNext"` and `"moduleResolution": "Bundler"` — NOT `"Node16"` from the base config. Vite handles module resolution; TypeScript just type-checks.

### Vitest Config for Frontend (jsdom environment)

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.tsx', 'tests/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
  },
})
```

```typescript
// tests/setup.ts
import '@testing-library/jest-dom'
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for full-screen mobile | `100dvh` | CSS Level 4, ~2022; broad support 2023 | Eliminates iOS Safari toolbar clipping without JS |
| `tailwind.config.js` | CSS `@theme {}` directives in CSS | Tailwind v4 (Jan 2025) | No JS config file; faster builds |
| `@tailwindcss/postcss` | `@tailwindcss/vite` | Tailwind v4 | Skips PostCSS pipeline entirely in Vite projects |
| `autoplay` attribute only | `autoplay + muted + playsInline` | iOS Safari policy hardened ~2017-2019 | All three required for reliable mobile autoplay |
| `React.FC` type annotation | Direct function return type | React 18+ best practices | `React.FC` removed implicit `children` prop; just type props directly |

**Deprecated/outdated:**
- `create-react-app`: Officially removed from React docs 2023. Use `npm create vite@latest`.
- Tailwind `tailwind.config.js`: Replaced by CSS `@theme` in v4. Don't use it.
- `react-scripts`: Removed. Don't use.

---

## Open Questions

1. **Video aspect ratio for fixture files**
   - What we know: Fixtures are `placeholder-01.mp4` through `placeholder-03.mp4` (3 seconds, ~6KB each) and `user-ai-generation-DEZEOYEYADlp-1080p.mp4`. The placeholder files are tiny and may be landscape or 1:1 aspect ratio.
   - What's unclear: Whether the placeholder videos are actually 9:16 vertical format. D-06 mandates `object-fit: cover` which will crop any non-9:16 content.
   - Recommendation: Use `object-fit: cover` as decided. The real user-ai-generation video should be tested on device to verify cover behavior.

2. **`@testing-library/jest-dom` matchers in Vitest 4**
   - What we know: `@testing-library/jest-dom` adds matchers like `toBeInTheDocument()`. Vitest 4 uses `globals: true` which exposes `expect`.
   - What's unclear: Whether `@testing-library/jest-dom` requires a separate type declaration or if it auto-augments with Vitest 4.
   - Recommendation: Add `"types": ["@testing-library/jest-dom"]` to `tsconfig.json` and import from `@testing-library/jest-dom/vitest` if available, or `@testing-library/jest-dom` directly in `setup.ts`.

3. **`autoPlay` attribute behavior when video src is set asynchronously**
   - What we know: `autoPlay` on the `<video>` element triggers play when src is available. If src is set after mount (via TanStack Query response), autoplay may not trigger.
   - What's unclear: Whether browsers fire autoplay when `src` changes on an already-mounted video element vs. only at initial render.
   - Recommendation: After src is set, call `videoRef.current?.play().catch(() => {})` explicitly in a `useEffect` to guarantee playback starts regardless of mount timing.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Vite dev server, pnpm | ✓ | v25.8.2 | — |
| pnpm | Package management | ✓ | 10.33.0 | — |
| Fastify backend | Vite proxy target at :3000 | ✓ (Phase 1 complete) | — | Start with `pnpm dev:backend` before frontend dev |
| Fixture video files | VideoPlayer rendering | ✓ | 4 files in fixtures/videos/ | — |
| Real iOS device | MOBL-01 through MOBL-04 verification | Unknown (not probeable) | — | Chrome DevTools mobile emulator for development; real device required for phase sign-off |

**Missing dependencies with no fallback:**
- Real iOS device: Required for final verification of MOBL-01 through MOBL-04. Cannot be automated. Phase sign-off requires testing on physical iPhone.

**Missing dependencies with fallback:**
- None.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `packages/frontend/vitest.config.ts` (Wave 0 — does not exist yet) |
| Quick run command | `pnpm --filter frontend test --run` |
| Full suite command | `pnpm --filter frontend test --run` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PLAY-01 | Video element has `object-fit: cover` and fills container | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| PLAY-02 | Video element has `autoPlay`, `muted`, `playsInline` attributes | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| PLAY-03 | Mute button renders and toggles `video.muted` | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| PLAY-04 | Tapping video container calls `video.pause()`/`video.play()` | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| PLAY-05 | Video element has `loop` attribute | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| PLAY-06 | Progress bar width reflects `currentTime / duration` | unit | `pnpm --filter frontend test --run tests/ProgressBar.test.tsx` | ❌ Wave 0 |
| MOBL-01 | Root container uses `h-dvh` (verified by class/style assertion) | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| MOBL-02 | `playsInline` attribute present on video element | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |
| MOBL-03 | Mute button has minimum touch target size ≥44px | unit | `pnpm --filter frontend test --run tests/MuteButton.test.tsx` | ❌ Wave 0 |
| MOBL-04 | Only one video element is rendered/playing | unit | `pnpm --filter frontend test --run tests/VideoPlayer.test.tsx` | ❌ Wave 0 |

**Note on JSDOM limitations:** `video.play()` and `video.pause()` do not actually play media in jsdom. Tests must use `vi.spyOn(videoRef.current, 'play')` and `vi.spyOn(videoRef.current, 'pause')` to assert calls rather than observing actual playback.

### Sampling Rate

- **Per task commit:** `pnpm --filter frontend test --run`
- **Per wave merge:** `pnpm --filter frontend test --run && pnpm typecheck`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/frontend/vitest.config.ts` — test environment config (jsdom)
- [ ] `packages/frontend/tests/setup.ts` — @testing-library/jest-dom setup
- [ ] `packages/frontend/tests/VideoPlayer.test.tsx` — covers PLAY-01 through PLAY-06, MOBL-01, MOBL-02, MOBL-04
- [ ] `packages/frontend/tests/ProgressBar.test.tsx` — covers PLAY-06
- [ ] `packages/frontend/tests/MuteButton.test.tsx` — covers MOBL-03
- [ ] Framework install: `pnpm add -D vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom`

---

## Project Constraints (from CLAUDE.md)

These constraints are authoritative and override any research recommendations that conflict.

| Directive | Source | Implication for Phase 2 |
|-----------|--------|------------------------|
| Tech stack: Node/TypeScript | CLAUDE.md | Frontend TypeScript; consistent with backend |
| Mobile-first | CLAUDE.md | All layout decisions start mobile; desktop is secondary |
| Static content only (m1) | CLAUDE.md | No video upload, no external API calls; serve from disk |
| Future native app | CLAUDE.md | React (not Vue/Angular); Capacitor-compatible patterns |
| No `autoplay` unmuted | CLAUDE.md (Out of Scope) | Universally blocked; `muted` is required |
| Use `<video>` native, not Video.js | CLAUDE.md (What NOT to Use) | Native `<video>` element with Intersection Observer |
| No HLS.js in v1 | CLAUDE.md (What NOT to Use) | Raw MP4 files served directly |
| `playsInline` is non-negotiable | CLAUDE.md (Stack Patterns) | Must be on every `<video>` element |
| Abstract file URL behind `resolveVideoUrl(id)` | CLAUDE.md (Stack Patterns) | Phase 2: use `VideoMeta.filename` to build URL; document the abstraction point |

---

## Sources

### Primary (HIGH confidence)

- Vite official docs — proxy configuration and `@tailwindcss/vite` plugin setup
- Tailwind CSS v4 docs — CSS-first config, `@theme`, `h-dvh` utility
- MDN Web Docs — `100dvh`, `-webkit-fill-available`, HTML5 video attributes
- WebKit blog — iOS video autoplay policy (https://webkit.org/blog/6784/new-video-policies-for-ios/)
- `.planning/research/STACK.md` — stack decisions (React 19.2.4, Vite 8.0.3, Tailwind 4.2.2, TanStack Query 5, Vitest 4)
- `.planning/research/ARCHITECTURE.md` — VideoPlayer component boundaries, single active video invariant
- `packages/backend/src/server.ts` — verified video served at `/video/{filename}` with prefix `/video/`
- `packages/shared/src/types/video.ts` — VideoMeta interface (`id`, `filename`, `title`, `duration`, `mimeType`, `size`)
- `packages/backend/src/routes/feed.ts` — Feed API response shape: `{ data: { items, nextCursor }, meta: { total } }`
- npm registry (2026-04-01) — package versions verified: react@19.2.4, vite@8.0.3, tailwindcss@4.2.2, @tanstack/react-query@5.96.1, vitest@4.1.2

### Secondary (MEDIUM confidence)

- CLAUDE.md `## Technology Stack` — comprehensive stack documentation with version compatibility table
- Backend `package.json` — TypeScript 6.0.2 confirmed as project TypeScript version

### Tertiary (LOW confidence)

- iOS Safari `onClick` on `<video>` unreliable — community-reported behavior pattern; not in official WebKit docs but widely confirmed

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all versions verified against npm registry 2026-04-01
- iOS Safari constraints: HIGH — documented in official WebKit blog and MDN
- Architecture: HIGH — patterns derived from existing codebase (Phase 1 complete) and project research files
- Pitfalls: MEDIUM — iOS-specific behavior confirmed by multiple community sources; jsdom video mock patterns are well-established

**Research date:** 2026-04-01
**Valid until:** 2026-05-01 (package versions may increment; iOS Safari behavior is stable)
