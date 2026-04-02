# Phase 03: feed-navigation - Research

**Researched:** 2026-04-02
**Domain:** Swiper.js React vertical swipe feed, Zustand global state, TanStack Query infinite pagination, HTML5 video preloading and buffering detection
**Confidence:** HIGH (Swiper React API verified, TanStack Query v5 API verified, Zustand 5 verified, video events from MDN)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** TikTok-style snap — fast snap with no momentum or rubber-band effect. Finger release immediately commits to next/previous video (~200-300ms transition)
- **D-02:** No overscroll or bounce at feed edges
- **D-03:** Mousewheel/trackpad scrolling works on desktop — scroll wheel advances one video per click. Makes desktop testing easy and the app usable on laptop browsers
- **D-04:** Preload 2 videos ahead of the current position. Previous video stays loaded in DOM for instant back-swipe. ~3-4 video elements in DOM at once
- **D-05:** Mute state persists across swipes — if user unmuted, next video plays with sound too. Global mute toggle via Zustand store (TikTok/Reels behavior)
- **D-06:** Centered white spinner on black background when video is not yet ready. No text label. Disappears when video starts playing
- **D-07:** Same spinner overlay for both initial load and mid-playback stalls — consistent behavior, no special stall indicator
- **D-08:** Minimal text only — clean black screen with centered white text: "You've seen everything". No buttons, no illustrations, no action prompts
- **D-09:** Dead end — end-of-feed slide blocks further swiping up. User can only swipe back down. Matches FEED-06: "no further swipes advance"

### Claude's Discretion
- Swiper.js configuration details (speed, resistance, threshold values)
- Spinner animation style and size (CSS or SVG)
- Zustand store shape for feed state (current index, video list, mute state)
- TanStack Query `useInfiniteQuery` configuration (page size, stale time, refetch)
- How to manage multiple `<video>` elements (Swiper slides with lazy loading vs manual DOM management)
- Intersection Observer usage for play/pause as slides enter/exit viewport
- Component decomposition (Feed container, Slide wrapper, etc.)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| FEED-01 | User can swipe up to advance to the next video | Swiper.js `direction="vertical"` + `slidesPerView={1}` handles this natively |
| FEED-02 | User can swipe down to return to the previous video | Same Swiper configuration — bidirectional by default |
| FEED-03 | Videos snap into place after swipe with smooth animation | Swiper snap is the default behavior; `speed` prop controls 200-300ms duration |
| FEED-04 | Next video is preloaded before user swipes to eliminate perceived gap | `<video preload="metadata">` on N+1/N+2 slides in DOM (D-04: keep 3-4 video elements in DOM) |
| FEED-05 | Loading/buffering state indicator displays when video is not yet ready | `waiting` event shows spinner; `canplay`/`playing` event hides it |
| FEED-06 | End-of-feed state displays "You've seen everything" when no more videos remain | Append a non-video sentinel slide; set `allowSlideNext={false}` on Swiper when at last real video |
</phase_requirements>

---

## Summary

Phase 3 adds the full swipe feed on top of the single-video player built in Phase 2. The dominant new dependencies are Swiper.js (not yet installed) and Zustand (not yet installed). TanStack Query is already installed and the backend cursor pagination is already implemented — the frontend just needs to upgrade from `useQuery` to `useInfiniteQuery`.

The architecture follows the pattern documented in ARCHITECTURE.md: a Swiper container renders 3-4 video slides in the DOM at any time, a Zustand store holds the active index and mute state, and Intersection Observer (or Swiper's `onSlideChange` event) drives the single-active-video invariant. The existing `VideoPlayer` component becomes a child inside each `SwiperSlide` wrapper with per-slide play/pause coordination added.

The key implementation challenges are: (1) lifting mute state from the per-video `useVideoPlayer` hook into Zustand without breaking the existing component, (2) correctly triggering the buffering spinner using `waiting`/`canplay` HTML media events, and (3) implementing the end-of-feed sentinel slide with `allowSlideNext` locked.

**Primary recommendation:** Install `swiper@^12` and `zustand@^5`. Upgrade `feedApi.ts` to `useInfiniteQuery`. Wrap each `VideoPlayer` in a `SwiperSlide`. Manage play/pause through `onSlideChange`. Keep 3-4 `<video>` elements in the DOM with `preload="metadata"` for adjacent slides.

---

## Standard Stack

### Core (new additions for this phase)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| swiper | 12.1.3 | Vertical swipe container with snap | Locked by CLAUDE.md and STACK.md. Current latest is 12.x (not 11.x as previously recorded — verified against npm registry 2026-04-02). React component in `swiper/react`. |
| zustand | 5.0.12 | Global feed + mute state | Locked by CLAUDE.md and STACK.md. Already decided, not yet installed. |

### Already Installed (confirm before planning install steps)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| @tanstack/react-query | ^5 | Infinite feed query | Installed, needs API upgrade to `useInfiniteQuery` |
| react | ^19 | UI | Installed |
| tailwindcss | ^4 | Styling spinner, end-of-feed text | Installed |

### Installation

```bash
cd packages/frontend
pnpm add swiper zustand
```

**Version verification (confirmed 2026-04-02):**
```
swiper: 12.1.3 (latest)
zustand: 5.0.12 (latest)
```

Note: STACK.md referenced `swiper@11.x` but npm registry shows `12.1.3` as `latest` as of this research date. The API is backward-compatible for this use case — same `swiper/react`, `swiper/modules`, same CSS import paths.

---

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   ├── VideoPlayer/           # existing — unchanged API, add isActive prop
│   ├── Feed/
│   │   ├── FeedContainer.tsx  # Swiper root, handles slide change, fetches more
│   │   ├── FeedSlide.tsx      # SwiperSlide wrapper with video + buffering overlay
│   │   ├── BufferingSpinner.tsx # Centered white spinner (CSS animation)
│   │   └── EndOfFeedSlide.tsx  # Sentinel slide: "You've seen everything"
│   └── ...
├── hooks/
│   ├── useVideoPlayer.ts      # existing — remove isMuted/toggleMute (moves to store)
│   ├── useVideoProgress.ts    # existing — unchanged
│   └── useFeed.ts             # NEW: useInfiniteQuery wrapper, flattens pages
├── store/
│   └── feedStore.ts           # NEW: Zustand store (activeIndex, mute, items list)
└── api/
    └── feedApi.ts             # upgrade: add cursor param to fetchFeed
```

### Pattern 1: Swiper Vertical Configuration

**What:** Configure Swiper as a full-screen, single-slide-per-view vertical carousel with mousewheel enabled and no bounce at edges.

**Key props:**
```tsx
// Source: https://swiperjs.com/react (verified 2026-04-02)
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'

<Swiper
  modules={[Mousewheel]}
  direction="vertical"
  slidesPerView={1}
  speed={250}               // D-01: ~200-300ms transition, no momentum
  resistance={false}        // D-02: no rubber-band at boundaries
  mousewheel={{ forceToAxis: true }}  // D-03: desktop scroll wheel support
  onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
  onSwiper={(swiper) => { swiperRef.current = swiper }}
  className="h-dvh w-full"
>
  {/* slides */}
</Swiper>
```

**CSS import note:** Only `swiper/css` is required (core styles). Do NOT import `swiper/css/bundle` — it pulls in all module styles including unused ones.

### Pattern 2: End-of-Feed Lock via allowSlideNext

**What:** Append a non-video sentinel slide as the last item. When the active index equals the last real video index, lock forward swiping via the Swiper instance API.

**Mechanism:** D-09 requires that the end-of-feed slide is a dead end. Swiper's `allowSlideNext` property on the instance (not a prop — set via `swiperRef.current.allowSlideNext = false`) prevents forward swipes programmatically after `onSlideChange` detects the sentinel.

```tsx
// Source: https://swiperjs.com/swiper-api (verified 2026-04-02)
const onSlideChange = (swiper: SwiperType) => {
  const newIndex = swiper.activeIndex
  setActiveIndex(newIndex)

  // Lock at end-of-feed sentinel
  if (newIndex === totalRealVideos) {
    swiper.allowSlideNext = false
  } else {
    swiper.allowSlideNext = true
  }
}
```

### Pattern 3: Buffering Spinner via Video Media Events

**What:** Show a spinner overlay when the video is not ready; hide it when playback is possible.

**Events to use (source: MDN, HIGH confidence):**
- `waiting` — fires when playback stops due to insufficient data. Show spinner.
- `canplay` — fires when enough data is loaded to begin playback. Hide spinner.
- `playing` — fires when playback actually starts after being paused/buffering. Hide spinner.

```tsx
// Per-slide spinner state managed locally in FeedSlide
const [isBuffering, setIsBuffering] = useState(false)

useEffect(() => {
  const video = videoRef.current
  if (!video) return
  const onWaiting = () => setIsBuffering(true)
  const onCanPlay = () => setIsBuffering(false)
  const onPlaying = () => setIsBuffering(false)
  video.addEventListener('waiting', onWaiting)
  video.addEventListener('canplay', onCanPlay)
  video.addEventListener('playing', onPlaying)
  return () => {
    video.removeEventListener('waiting', onWaiting)
    video.removeEventListener('canplay', onCanPlay)
    video.removeEventListener('playing', onPlaying)
  }
}, [videoRef])
```

**D-07 compliance:** The same `isBuffering` state handles both initial load stalls and mid-playback stalls — no separate state needed.

### Pattern 4: Single Active Video Invariant via onSlideChange

**What:** Exactly one video plays at a time. When `onSlideChange` fires, pause the previously active video and play the newly active one.

**Why NOT Intersection Observer here:** Swiper owns the scroll; IO would trigger correctly, but it adds indirection. Using Swiper's `onSlideChange` is more direct and reliable for this use case. IO is appropriate for CSS scroll-snap implementations, not Swiper-managed containers.

```tsx
// FeedContainer.tsx — coordinate via refs array or store
const onSlideChange = (swiper: SwiperType) => {
  const prevIndex = activeIndexRef.current
  const nextIndex = swiper.activeIndex

  // Pause previous
  videoRefs.current[prevIndex]?.pause()
  videoRefs.current[prevIndex]?.load() // reset currentTime to 0 for re-entry

  // Play next (respects global mute state from store)
  const video = videoRefs.current[nextIndex]
  if (video) {
    video.muted = isMuted  // sync mute from store
    video.play().catch(() => {})
  }

  setActiveIndex(nextIndex)
  activeIndexRef.current = nextIndex
}
```

### Pattern 5: Zustand Feed Store

**What:** A single Zustand store holds the global mute state and active index. The existing `useVideoPlayer` hook's `isMuted`/`toggleMute` logic is removed and replaced by store reads.

```typescript
// Source: https://github.com/pmndrs/zustand (verified 2026-04-02)
// store/feedStore.ts
import { create } from 'zustand'

interface FeedStore {
  activeIndex: number
  isMuted: boolean
  setActiveIndex: (index: number) => void
  toggleMute: () => void
}

export const useFeedStore = create<FeedStore>((set) => ({
  activeIndex: 0,
  isMuted: true,   // starts muted (PLAY-02)
  setActiveIndex: (index) => set({ activeIndex: index }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))
```

### Pattern 6: useInfiniteQuery for Cursor Pagination

**What:** Replace the current `useQuery` in `App.tsx` with `useInfiniteQuery`. The backend already returns `nextCursor`; this is purely a frontend upgrade.

```typescript
// Source: https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery
// hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeed } from '../api/feedApi'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam ?? null, limit: 10 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  })
}
```

**feedApi.ts update needed:** Current signature is `fetchFeed(limit: number)`. Needs to accept `{ cursor: string | null, limit: number }`.

### Pattern 7: Preloading via preload="metadata"

**What:** For the N+1 and N+2 slides in the DOM, set `preload="metadata"` on their `<video>` elements. This causes the browser to fetch the first 2-5% of the file (enough to start playback quickly) without downloading the full file.

**Why metadata, not auto:** `preload="auto"` on background slides would trigger full downloads for multiple videos simultaneously — excessive bandwidth. `preload="metadata"` pre-buffers enough data for near-instant playback after a swipe while conserving bandwidth. The active slide uses `autoPlay` which overrides preload.

**D-04 implementation:** Swiper keeps 3-4 slide DOM nodes active by default (the current, neighbors). Setting `preload="metadata"` on non-active slides is sufficient; the browser handles the actual prefetch. No explicit `<link rel="preload">` or `createObjectURL` needed.

```tsx
// FeedSlide.tsx
<video
  ref={videoRef}
  src={resolveVideoUrl(video.filename)}
  preload={isActive ? 'auto' : 'metadata'}
  muted={isActive ? isMuted : true}
  playsInline
  loop
  className="w-full h-full object-cover"
/>
```

### Anti-Patterns to Avoid

- **Scroll event listeners on the window/document:** Swiper owns the touch handling. Adding separate scroll listeners causes double-firing and fight with Swiper's gesture system.
- **Calling `video.play()` inside a React render cycle:** Always call in `useEffect` or event handler callbacks. Calling `.play()` during render triggers React strict-mode double invocation issues.
- **Multiple Intersection Observers per slide:** IO is appropriate for CSS scroll-snap feeds. In a Swiper-managed feed, use `onSlideChange` for play/pause coordination. Using both creates race conditions.
- **Forgetting `playsInline` on background slides:** iOS Safari will try to go fullscreen on any video that starts playing without `playsInline`. Apply it to all video elements in the feed, not just the active one.
- **Mounting all videos at app init:** Only 3-4 video elements should exist in the DOM at once. Swiper's default behavior destroys off-screen slides unless `virtualSlides` or neighbor caching is configured. Confirm Swiper default `slidesOffsetBefore`/`slidesOffsetAfter` are not unmounting neighbors.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Touch swipe gesture detection | Custom touch start/end handlers | Swiper.js | Swiper handles momentum, threshold, direction locking, overscroll prevention, mousewheel, iOS Safari edge cases |
| Scroll snap on mobile | CSS `scroll-snap-type: y mandatory` | Swiper.js | CSS scroll-snap has known iOS Safari momentum timing bugs; Swiper tests these on real devices |
| Feed cursor pagination | Manual `useState` cursor tracking | `useInfiniteQuery` | Handles stale data, background refetch, page caching, and deduplication; cursor state is trivial, page management is not |
| Global mute state | Prop-drilling `isMuted` through 3+ component levels | Zustand store | State needed in VideoPlayer (muted attr), FeedSlide (sync on slide change), and MuteButton (toggle UI) |
| CSS spinner animation | `requestAnimationFrame` spinner | Tailwind `animate-spin` + SVG or border-based spinner | Tailwind already handles the `@keyframes` and `animation` CSS; one class |

**Key insight:** The video buffering detection (`waiting`/`canplay` events) and the end-of-feed lock (`allowSlideNext`) are both native browser/Swiper APIs — there is nothing to hand-roll here.

---

## Common Pitfalls

### Pitfall 1: Swiper Instance vs React Props for allowSlideNext

**What goes wrong:** Setting `allowSlideNext={false}` as a React prop on `<Swiper>` disables swiping for the entire lifetime of the component, not just when at the end.

**Why it happens:** React props are evaluated at mount time; the Swiper instance is mutable at runtime.

**How to avoid:** Access the Swiper instance via the `onSwiper` callback and mutate `swiper.allowSlideNext` imperatively inside `onSlideChange`:
```tsx
const swiperRef = useRef<SwiperType>()
<Swiper onSwiper={(s) => { swiperRef.current = s }} ... />
// in onSlideChange:
swiperRef.current.allowSlideNext = isAtEnd ? false : true
```

**Warning signs:** End-of-feed slide works but user can never swipe forward from any slide.

### Pitfall 2: Mute State Desync Between DOM and Zustand

**What goes wrong:** The video element's `.muted` property falls out of sync with the Zustand `isMuted` state after a slide change.

**Why it happens:** When Swiper activates a new slide, the new `<video>` element is freshly mounted (or remounted). Its `muted` attribute defaults to `true` (from `autoPlay muted` in the JSX) regardless of what Zustand says.

**How to avoid:** In `onSlideChange`, after calling `.play()`, explicitly sync the video's `muted` property from the Zustand store:
```tsx
const { isMuted } = useFeedStore.getState()
video.muted = isMuted
```
Use `getState()` (not the hook) in event callbacks to avoid stale closure issues.

**Warning signs:** User unmutes, swipes to next video, sound is gone again.

### Pitfall 3: preload="auto" on Background Slides Causing Excessive Data Usage

**What goes wrong:** Setting `preload="auto"` on all slides triggers the browser to download full video files for every slide in the DOM.

**Why it happens:** `preload="auto"` tells the browser it can download the whole file proactively.

**How to avoid:** Use `preload="metadata"` for non-active slides (D-04). The browser fetches only the first 2-5% of the file — enough to start playing quickly after a swipe — without pulling the full binary.

**Warning signs:** Network tab shows multiple large video downloads in parallel at page load.

### Pitfall 4: Swiper Not Filling Full Viewport Height

**What goes wrong:** Swiper container doesn't fill the full mobile viewport; the browser address bar causes content to shift or clip.

**Why it happens:** `100vh` doesn't account for mobile browser chrome. The existing codebase uses `100dvh` (dynamic viewport height) via `fullscreen-container` Tailwind class. Swiper needs the same treatment.

**How to avoid:** Apply `h-dvh` (or the existing `fullscreen-container` class) to both the Swiper wrapper div and the `<Swiper>` element itself:
```tsx
<div className="fullscreen-container bg-black">
  <Swiper className="h-full w-full" ... />
</div>
```

**Warning signs:** Slides clip at bottom on iOS Safari, especially when URL bar is visible.

### Pitfall 5: useInfiniteQuery pages Structure

**What goes wrong:** Code tries to access `data.items` directly but `useInfiniteQuery` returns `data.pages[]` array of pages.

**Why it happens:** `useInfiniteQuery` data shape is `{ pages: FeedResponse[], pageParams: any[] }`, not a flat `FeedResponse`.

**How to avoid:** Flatten pages in the hook:
```typescript
const allItems = data?.pages.flatMap((page) => page.data.items) ?? []
```

**Warning signs:** TypeScript error `Property 'items' does not exist on type 'InfiniteData<...>'`.

### Pitfall 6: Spinner Staying Visible After Video Stall Resolves

**What goes wrong:** The spinner appears on `waiting` but doesn't disappear after the video resumes.

**Why it happens:** Only listening to `canplay` is not sufficient. The `canplay` event fires when the browser *thinks* it can play, but `playing` is the authoritative "playback has resumed" event.

**How to avoid:** Listen to both `canplay` and `playing` to hide the spinner (as shown in Pattern 3 above).

---

## Code Examples

### FeedContainer.tsx Skeleton

```tsx
// Source: Swiper React docs (https://swiperjs.com/react), Zustand docs, TanStack Query v5 docs
import { useRef } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'
import { useFeedStore } from '../../store/feedStore'
import { useFeed } from '../../hooks/useFeed'
import FeedSlide from './FeedSlide'
import EndOfFeedSlide from './EndOfFeedSlide'

export default function FeedContainer() {
  const swiperRef = useRef<SwiperType>()
  const { setActiveIndex, isMuted } = useFeedStore()
  const { data, fetchNextPage, hasNextPage } = useFeed()

  const allVideos = data?.pages.flatMap((p) => p.data.items) ?? []

  const onSlideChange = (swiper: SwiperType) => {
    const idx = swiper.activeIndex
    setActiveIndex(idx)

    // Lock at end-of-feed sentinel
    if (idx >= allVideos.length) {
      swiper.allowSlideNext = false
    }

    // Fetch more when approaching end
    if (hasNextPage && idx >= allVideos.length - 3) {
      fetchNextPage()
    }
  }

  return (
    <div className="fullscreen-container bg-black">
      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        speed={250}
        resistance={false}
        mousewheel={{ forceToAxis: true }}
        onSwiper={(s) => { swiperRef.current = s }}
        onSlideChange={onSlideChange}
        className="h-full w-full"
      >
        {allVideos.map((video, index) => (
          <SwiperSlide key={video.id}>
            <FeedSlide video={video} slideIndex={index} />
          </SwiperSlide>
        ))}
        <SwiperSlide key="end-of-feed">
          <EndOfFeedSlide />
        </SwiperSlide>
      </Swiper>
    </div>
  )
}
```

### Buffering Spinner (CSS-based)

```tsx
// BufferingSpinner.tsx — D-06: centered white spinner, no label
export default function BufferingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
    </div>
  )
}
```

### EndOfFeedSlide

```tsx
// D-08: minimal — black screen, centered white text, no buttons
export default function EndOfFeedSlide() {
  return (
    <div className="fullscreen-container bg-black flex items-center justify-center">
      <span className="text-white text-base font-medium tracking-wide">
        You've seen everything
      </span>
    </div>
  )
}
```

### VideoPlayer isActive Prop Addition

The existing `VideoPlayer` accepts a `video: VideoMeta` prop. For Phase 3 it needs an `isActive: boolean` prop so `FeedSlide` can pass play/pause control:

```tsx
// VideoPlayer.tsx — minimal change to existing component
interface VideoPlayerProps {
  video: VideoMeta
  isActive?: boolean   // NEW: added for feed integration
}
```

Play/pause coordination happens in `FeedSlide` (or `FeedContainer`) rather than inside `VideoPlayer`, keeping the player component dumb.

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Swiper 11.x (STACK.md) | Swiper 12.x (`latest` on npm) | 2025 | API is backward-compatible for this use case — same import paths |
| `useQuery` with limit=1 (current App.tsx) | `useInfiniteQuery` with cursor param | Phase 3 | Enables paginated feed; `data.pages[]` shape instead of flat response |
| Per-component `isMuted` state in `useVideoPlayer` | Global Zustand `isMuted` in `feedStore` | Phase 3 | Mute persists across swipes (D-05) |

**Note on Swiper virtual slides:** Swiper's `Virtual` module was considered for this phase. Decision: do NOT use `Virtual` for this feed. Virtual slides unmount non-active slides from the DOM, which would destroy `<video>` elements and require re-downloading on back-swipe. D-04 requires the previous video to stay loaded — this is only possible with non-virtual (real) slides staying in the DOM. Swiper's default behavior keeps a small window of slides rendered; this is sufficient.

---

## Open Questions

1. **VideoPlayer mute refactor scope**
   - What we know: `useVideoPlayer` hook manages `isMuted` locally. Phase 3 moves it to Zustand.
   - What's unclear: Whether `toggleMute` in `MuteButton` needs to call `useFeedStore().toggleMute` directly or still call a hook that proxies to the store. This affects whether existing `VideoPlayer`/`MuteButton` tests need updating.
   - Recommendation: `MuteButton`'s `onToggle` prop remains unchanged; the parent passes `useFeedStore().toggleMute` as the handler. No change to `MuteButton` component or its tests.

2. **Swiper type import for swiperRef**
   - What we know: `import type { Swiper as SwiperType } from 'swiper'` is the correct import for TypeScript typing of the instance.
   - What's unclear: Whether the types ship in the main `swiper` package or require `@types/swiper`.
   - Recommendation: Swiper ships its own TypeScript types — no `@types/swiper` package needed. Verify `packages/frontend/node_modules/swiper/types/` after install.

3. **iOS Safari video autoplay interaction with slide activation**
   - What we know: iOS requires a user gesture to call `.play()` on unmuted video. The feed starts muted (PLAY-02), so `.play()` on slide change is permitted without gesture.
   - What's unclear: Whether iOS Safari will allow `.play()` calls triggered by the Swiper touch gesture handler (not a direct tap on the video). Touch gestures on Swiper should count as user interaction, but this needs real-device verification.
   - Recommendation: Flag for manual mobile testing after implementation. Plan test on real iOS Safari device.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | pnpm install | ✓ | (assumed — used throughout project) | — |
| pnpm | Package install | ✓ | (assumed — project uses pnpm workspace) | npm |
| swiper | FeedContainer | ✗ (not installed) | — | None — required |
| zustand | feedStore | ✗ (not installed) | — | None — required |
| Vitest | Test suite | ✓ | ^4 (package.json) | — |
| jsdom | Test environment | ✓ | ^29 (package.json) | — |

**Missing dependencies with no fallback:**
- `swiper@^12` — must be installed before any feed component work
- `zustand@^5` — must be installed before store work

**Install command (Wave 0 prerequisite):**
```bash
cd /path/to/packages/frontend
pnpm add swiper zustand
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.x |
| Config file | `packages/frontend/vitest.config.ts` |
| Quick run command | `cd packages/frontend && pnpm test` |
| Full suite command | `cd packages/frontend && pnpm test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| FEED-01 | Swiper renders with direction="vertical" | unit | `pnpm test -- --reporter=verbose FeedContainer` | ❌ Wave 0 |
| FEED-02 | Swiper renders bidirectional by default (no allowSlidePrev=false at init) | unit | `pnpm test -- --reporter=verbose FeedContainer` | ❌ Wave 0 |
| FEED-03 | Swiper has speed prop ≤ 300 and resistance=false | unit | `pnpm test -- --reporter=verbose FeedContainer` | ❌ Wave 0 |
| FEED-04 | Non-active slides have preload="metadata" attribute | unit | `pnpm test -- --reporter=verbose FeedSlide` | ❌ Wave 0 |
| FEED-05 | BufferingSpinner renders when waiting event fires; hides on canplay | unit | `pnpm test -- --reporter=verbose FeedSlide` | ❌ Wave 0 |
| FEED-06 | EndOfFeedSlide renders "You've seen everything" text | unit | `pnpm test -- --reporter=verbose EndOfFeedSlide` | ❌ Wave 0 |
| FEED-06 | allowSlideNext=false after reaching sentinel | unit (Swiper mock) | `pnpm test -- --reporter=verbose FeedContainer` | ❌ Wave 0 |
| D-05 | Mute state persists across slide change | unit | `pnpm test -- --reporter=verbose feedStore` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `cd packages/frontend && pnpm test`
- **Per wave merge:** `cd packages/frontend && pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/FeedContainer.test.tsx` — covers FEED-01, FEED-02, FEED-03, FEED-06 (allowSlideNext)
- [ ] `tests/FeedSlide.test.tsx` — covers FEED-04, FEED-05
- [ ] `tests/EndOfFeedSlide.test.tsx` — covers FEED-06 (text content)
- [ ] `tests/feedStore.test.ts` — covers D-05 (mute persistence)
- [ ] `tests/useFeed.test.ts` — covers useInfiniteQuery page flattening

**Note on Swiper mocking:** Swiper uses DOM APIs that JSDOM doesn't fully implement (touch events, ResizeObserver). Standard approach is to mock `swiper/react` in tests:
```typescript
vi.mock('swiper/react', () => ({
  Swiper: ({ children, onSlideChange, onSwiper }: any) => {
    // minimal mock
    return <div data-testid="swiper">{children}</div>
  },
  SwiperSlide: ({ children }: any) => <div>{children}</div>,
}))
```

---

## Project Constraints (from CLAUDE.md)

All directives that constrain this phase's implementation:

| Constraint | Source | Implication for Phase 3 |
|-----------|--------|-------------------------|
| Tech stack: Node/TypeScript | CLAUDE.md §Constraints | TypeScript throughout — Zustand store must be typed |
| Mobile-first | CLAUDE.md §Constraints | Swiper height must use `h-dvh` not `h-screen`; `playsInline` on all video elements |
| Static content only (m1) | CLAUDE.md §Constraints | No external API calls; `fetchFeed` hits local backend only |
| Future mobile (Capacitor/React Native) | CLAUDE.md §Constraints | No DOM-specific APIs outside React lifecycle; keep video control in `useEffect` not render |
| `playsInline` is non-negotiable on iOS | CLAUDE.md §Stack Patterns | Every `<video>` in every `SwiperSlide` must have `playsInline` |
| Use Intersection Observer for play/pause (CLAUSE.md §Stack Patterns) | CLAUDE.md §Stack Patterns | Note: CLAUDE.md recommends IO, but D-04/D-05 + Swiper-managed slides make `onSlideChange` more reliable. Recommend `onSlideChange` with IO as secondary verification if needed. |
| Abstract URL resolution behind `resolveVideoUrl(id)` | CLAUDE.md §Stack Patterns | `FeedSlide` must use `resolveVideoUrl(video.filename)` — no inline `/video/` construction |
| Only one video plays at a time (MOBL-04) | REQUIREMENTS.md | `onSlideChange` must pause previous video before playing next |

---

## Sources

### Primary (HIGH confidence)
- [Swiper React docs](https://swiperjs.com/react) — `swiper/react` import pattern, modules, CSS imports, `onSlideChange`/`onSwiper` events, Virtual slides API — verified 2026-04-02
- [Swiper API reference](https://swiperjs.com/swiper-api) — `direction`, `speed`, `resistance`, `allowSlideNext`, `mousewheel` parameters — verified 2026-04-02
- [Swiper MousewheelOptions](https://swiperjs.com/types/interfaces/types_modules_mousewheel.MousewheelOptions) — `forceToAxis` parameter — verified via npm dist-tags 2026-04-02
- [TanStack Query v5 useInfiniteQuery](https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery) — `initialPageParam`, `getNextPageParam`, `fetchNextPage`, `data.pages` shape
- [Zustand GitHub](https://github.com/pmndrs/zustand) — `create<State>()` TypeScript pattern, v5.0.12
- [MDN HTMLMediaElement: waiting event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/waiting_event) — buffering detection
- [MDN HTMLMediaElement: canplay event](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/canplay_event) — buffering resolution detection

### Secondary (MEDIUM confidence)
- npm registry (`npm view swiper version`) — Swiper 12.1.3 latest as of 2026-04-02
- npm registry (`npm view zustand version`) — Zustand 5.0.12 latest as of 2026-04-02
- [LogRocket: TikTok autoplay hook with IO](https://blog.logrocket.com/build-custom-tiktok-autoplay-react-hook-intersection-observer/) — IO pattern for CSS scroll-snap feeds (not the chosen approach here, but validates the problem domain)

### Tertiary (LOW confidence)
- Various GitHub Swiper issues re: iOS Safari performance — patterns to avoid but not verified against latest version

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Swiper 12.x and Zustand 5.x verified against npm registry; TanStack Query v5 API verified from official docs
- Architecture: HIGH — Swiper `onSlideChange` + `allowSlideNext` are official Swiper APIs; `waiting`/`canplay` are W3C-specified HTML media events
- Pitfalls: HIGH for browser/Swiper API pitfalls (documented from official specs); MEDIUM for iOS Safari swipe-as-gesture autoplay (needs real-device verification)

**Research date:** 2026-04-02
**Valid until:** 2026-05-02 (stable libraries; Swiper and TanStack Query versions are unlikely to break within 30 days)
