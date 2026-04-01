# Architecture Research

**Domain:** Short-form vertical video player web app (friend-curated feed)
**Researched:** 2026-04-01
**Confidence:** HIGH (core patterns) / MEDIUM (prefetch strategies, mobile wrapping)

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Feed Shell  │  │ Video Player │  │  Prefetch Manager    │  │
│  │  (swipe UI)  │  │  (HTML5 +    │  │  (loads N+1, N+2     │  │
│  │              │  │   controls)  │  │   ahead of active)   │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┴──────────────────────┘              │
│                           │                                     │
│              Feed State Manager (active index,                  │
│              loaded items, scroll position)                     │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │ HTTP (REST + Range Requests)
┌───────────────────────────┼─────────────────────────────────────┐
│                      SERVER LAYER                               │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Feed API    │  │  Video API   │  │  Static File Server  │  │
│  │  /feed       │  │  /video/:id  │  │  (range-aware)       │  │
│  │  (metadata,  │  │  (stream     │  │                      │  │
│  │   ordering)  │  │   chunks)    │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┴──────────────────────┘              │
│                           │                                     │
│              Express Router + Middleware                        │
│                                                                 │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      STORAGE LAYER                              │
│                                                                 │
│  ┌──────────────────┐  ┌───────────────────────────────────┐   │
│  │  Video Files     │  │  Video Metadata                   │   │
│  │  (disk / M1)     │  │  (JSON / SQLite / M1)             │   │
│  │  (S3/GCS / M2+)  │  │  (PostgreSQL / M2+)               │   │
│  └──────────────────┘  └───────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| Feed Shell | Renders the scrollable container; handles swipe/scroll gesture detection; manages virtualized item recycling | CSS scroll-snap or gesture library; keeps only 3-5 DOM nodes active |
| Video Player | Wraps the HTML5 `<video>` element; enforces single-active-video invariant; exposes play/pause/loop controls | Native `<video>` or a thin wrapper (Vidstack); autoplay muted on entry |
| Prefetch Manager | Loads video metadata and begins buffering for N+1 and N+2 items ahead of the active index | `<link rel="preload">`, `<video preload="metadata">`, or explicit fetch + `createObjectURL` |
| Feed State Manager | Owns active index, loaded items list, and scroll position; dispatches to player and prefetch manager | React context + reducer, or Zustand/Jotai for M1 simplicity |
| Feed API | Returns ordered list of video metadata (id, url, thumbnail, duration, title); supports cursor pagination | Express route; cursor avoids offset instability on inserts |
| Video API | Streams video bytes in chunks via HTTP 206 Partial Content; required for seek and Safari support | Express route reading fs.createReadStream with byte-range headers |
| Static File Server | Serves video files from disk (M1) or proxies from object storage (M2+) | Express `static` middleware or direct range-request handler |

## Recommended Project Structure

```
goonster/
├── packages/
│   ├── server/                 # Node/TypeScript backend
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── feed.ts     # GET /feed — ordered metadata list
│   │   │   │   └── video.ts    # GET /video/:id — range-aware stream
│   │   │   ├── services/
│   │   │   │   ├── videoStore.ts  # Abstracts disk vs. S3 (storage interface)
│   │   │   │   └── feedService.ts # Ordering, pagination logic
│   │   │   ├── middleware/
│   │   │   │   └── rangeHeaders.ts  # HTTP 206 range request handling
│   │   │   └── index.ts        # Express app entry
│   │   └── videos/             # Static video files (M1 only)
│   │
│   └── client/                 # Frontend (framework TBD)
│       ├── src/
│       │   ├── components/
│       │   │   ├── FeedShell/      # Scroll container, snap, virtualization
│       │   │   ├── VideoPlayer/    # <video> wrapper, controls, events
│       │   │   └── FeedItem/       # Single feed slot (player + overlay)
│       │   ├── state/
│       │   │   └── feedStore.ts    # Active index, loaded list, prefetch queue
│       │   ├── hooks/
│       │   │   ├── usePrefetch.ts  # Prefetch N+1/N+2 logic
│       │   │   └── useVideoPlayer.ts  # Play/pause/loop controls
│       │   └── api/
│       │       └── feedApi.ts      # HTTP calls to /feed and /video/:id
│       └── public/
└── package.json                # Monorepo root (optional for M1, useful for M2+)
```

### Structure Rationale

- **packages/server/services/videoStore.ts:** The storage abstraction is the single most important seam. Isolating it behind an interface (readStream(id, range), listVideos()) means M1 uses disk and M2+ swaps to S3 without touching routes or the client.
- **packages/client/state/feedStore.ts:** All feed state lives here. Components are dumb. The store drives prefetch and player — not the other way around.
- **routes/ vs services/:** Routes handle HTTP concerns (headers, status codes). Services own business logic. Keeps range-request plumbing out of feed ordering logic.

## Architectural Patterns

### Pattern 1: Single Active Video Invariant

**What:** At any moment, exactly one video element is "active" (playing, unmuted if applicable). All others are paused or unloaded.
**When to use:** Always — this is not optional for a swipe feed. Multiple playing videos simultaneously drain battery, cause audio overlap, and break the UX contract.
**Trade-offs:** Requires coordination between scroll position and player state; slightly more complex than naive "autoplay all visible."

```typescript
// feedStore.ts — simplified
type FeedState = {
  activeIndex: number;
  items: VideoMeta[];
};

function setActiveIndex(state: FeedState, index: number): FeedState {
  // Only one index is ever "active" — player reads this, pauses all others
  return { ...state, activeIndex: index };
}
```

### Pattern 2: HTTP 206 Range Requests for Video Streaming

**What:** The server responds to `Range: bytes=X-Y` headers with a `206 Partial Content` response, streaming only the requested byte range. The client (browser) handles chunk sequencing automatically.
**When to use:** Always — Safari requires it. Without range support, seek is impossible and the browser must download the entire file before playing.
**Trade-offs:** Slightly more server implementation complexity; mandatory for correct cross-browser behavior.

```typescript
// video.ts route — range-request handler
app.get('/video/:id', (req, res) => {
  const videoPath = videoStore.resolvePath(req.params.id);
  const stat = fs.statSync(videoPath);
  const range = req.headers.range;

  if (!range) return res.status(400).send('Range header required');

  const [startStr, endStr] = range.replace(/bytes=/, '').split('-');
  const start = parseInt(startStr, 10);
  const end = endStr ? parseInt(endStr, 10) : Math.min(start + 1_000_000, stat.size - 1);
  const chunkSize = end - start + 1;

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${stat.size}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'video/mp4',
  });

  fs.createReadStream(videoPath, { start, end }).pipe(res);
});
```

### Pattern 3: Storage Abstraction Interface

**What:** A thin interface wrapping all video file I/O. M1 implements it with `fs`, M2+ implements it with S3/GCS SDK — routes and services never import `fs` directly.
**When to use:** From day one. Retrofitting this later requires touching every route.
**Trade-offs:** Small upfront overhead; pays off the moment cloud storage is introduced.

```typescript
// videoStore.ts
interface VideoStore {
  listVideos(): Promise<VideoMeta[]>;
  createReadStream(id: string, range: { start: number; end: number }): NodeJS.ReadableStream;
  getSize(id: string): Promise<number>;
}

class DiskVideoStore implements VideoStore { /* M1 */ }
class S3VideoStore implements VideoStore { /* M2+ */ }
```

### Pattern 4: Cursor-Based Feed Pagination

**What:** The `/feed` endpoint returns items plus an opaque `nextCursor` token. Client passes `cursor=<token>` on the next request. Server decodes cursor to determine offset.
**When to use:** From M1 even with static files. Offset pagination (`?page=2`) breaks when items are inserted or reordered. Cursor pagination is stable.
**Trade-offs:** Cursor pagination cannot jump to arbitrary pages — fine for a swipe feed where users scroll sequentially.

## Data Flow

### Feed Load Flow

```
App Mounts
    ↓
feedStore.init() → GET /feed?limit=10
    ↓
Server: feedService.getOrdered() → videoStore.listVideos()
    ↓
Response: [{ id, url, thumbnail, title, duration }, ...] + nextCursor
    ↓
feedStore: items = response.items, activeIndex = 0
    ↓
FeedShell renders item[0] as VideoPlayer (autoplay)
    ↓
Prefetch Manager: preload metadata for item[1] and item[2]
```

### Swipe/Scroll to Next Video Flow

```
User swipes up (scroll event / touch gesture)
    ↓
FeedShell: detect snap target = currentIndex + 1
    ↓
feedStore.setActiveIndex(currentIndex + 1)
    ↓
  [Branch A — Player]
  VideoPlayer for old index: pause(), reset currentTime
  VideoPlayer for new index: play()

  [Branch B — Prefetch]
  usePrefetch: new activeIndex → load metadata for N+1, N+2
  <video preload="metadata"> injected for next item

  [Branch C — More Data]
  If activeIndex > items.length - 3: fetch next page via nextCursor
  feedStore: append new items to list
```

### Video Byte Streaming Flow

```
VideoPlayer sets <video src="/video/:id">
    ↓
Browser: GET /video/:id  (Range: bytes=0-)
    ↓
Server: parse range header → calculate chunk end
    ↓
Server: fs.createReadStream(path, { start, end }).pipe(res)
    ↓
Response: HTTP 206, Content-Range, video bytes
    ↓
Browser: buffers chunk, begins playback
    ↓
Browser: issues next Range request as buffer depletes
    ↓ (repeats until video ends or user swipes)
```

### State Management

```
feedStore (single source of truth)
    ├── items[]         ← populated by Feed API calls
    ├── activeIndex     ← driven by FeedShell scroll events
    ├── nextCursor      ← used to fetch next page
    └── prefetchQueue[] ← managed by usePrefetch hook

FeedShell ←──── reads activeIndex, items
VideoPlayer ←── reads items[activeIndex], plays/pauses on activeIndex change
Prefetch ←───── reads activeIndex, preloads items[N+1], items[N+2]
FeedAPI ←─────── called when cursor needed, writes back to feedStore
```

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-100 users (M1) | Monolith is fine. Disk storage, single Node process, no CDN. Express static middleware serves files. |
| 100-10k users (M2) | Move video files to S3/GCS. Add CloudFront/Cloudflare CDN in front. Storage abstraction interface makes this a swap. |
| 10k-100k users (M3+) | Separate video streaming from API server. Consider transcoding to multiple resolutions. Add Redis for feed caching. |
| 100k+ users | CDN edge caching is the dominant concern, not the Node server. Horizontal scaling of API tier. HLS/DASH for ABR. |

### Scaling Priorities

1. **First bottleneck:** Video bytes served from the Node process. At low-medium load, a single Node instance handles this fine due to non-blocking I/O. Fix: put a CDN in front, or move to S3 direct URLs. The storage abstraction interface is what makes this migration cheap.
2. **Second bottleneck:** Feed API response time as video library grows. Fix: cache ordered feed list in memory or Redis. Feed ordering is deterministic so cache invalidation is simple.

## Anti-Patterns

### Anti-Pattern 1: Serving Video Without Range Request Support

**What people do:** Use `res.sendFile()` or `express.static()` without implementing HTTP 206 range responses.
**Why it's wrong:** Safari refuses to play video without range request support. Seek becomes impossible. The browser must download the entire file before playback starts. Users on mobile see a buffering spinner.
**Do this instead:** Implement a dedicated `/video/:id` route that parses `Range` headers and responds with `206 Partial Content`. This is 30 lines of code and is non-negotiable.

### Anti-Pattern 2: Playing Multiple Videos Simultaneously

**What people do:** Autoplay every video that enters the viewport, or fail to pause the previous video when the next becomes active.
**Why it's wrong:** Audio from multiple videos overlaps. Battery drains on mobile. On low-end devices, concurrent video decode causes frame drops.
**Do this instead:** Feed State Manager owns `activeIndex`. Only the component at `activeIndex` calls `video.play()`. All others call `video.pause()` when they are no longer active. This is enforced at the store level, not left to individual components.

### Anti-Pattern 3: Storing Video File Paths Directly in Component State

**What people do:** Hardcode `/videos/filename.mp4` URLs in the frontend, or store absolute server paths in API responses.
**Why it's wrong:** When storage moves from disk to S3, every URL reference in the frontend must be updated. If absolute paths leak, S3 migration requires a data migration.
**Do this instead:** API returns a video `id`. The client constructs `/video/:id` as the src. The server resolves `id → path` internally via the storage abstraction. The URL contract never changes.

### Anti-Pattern 4: Offset-Based Feed Pagination

**What people do:** Use `GET /feed?page=2&limit=10` with SQL `OFFSET`.
**Why it's wrong:** When new items are inserted (M2+ when friends add videos), the offset shifts and users see duplicates or skip items. OFFSET is also expensive on large tables.
**Do this instead:** Cursor-based pagination. The server encodes a stable cursor (last item ID + sort key) in the response. The client passes it back. Stable regardless of inserts.

### Anti-Pattern 5: No Storage Abstraction in M1

**What people do:** Scatter `fs.readFileSync` and `path.join(__dirname, 'videos', id)` across route handlers.
**Why it's wrong:** M2 requires migrating to S3. Every route that touches the filesystem must be found and rewritten. In a rush, some get missed.
**Do this instead:** Even in M1, all file I/O goes through a `VideoStore` interface. The disk implementation is trivial. The interface discipline is the value.

## Integration Points

### External Services (Future Milestones)

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| AWS S3 / GCS | Swap `DiskVideoStore` for `S3VideoStore` in the storage abstraction | Pre-signed URLs or Node proxy; CDN sits in front |
| CloudFront / Cloudflare | CDN origin points to S3 bucket; video URLs become CDN URLs | No app code change needed if storage abstraction returns URLs |
| Platform extractors (TikTok/Reels/YT) | Background worker: extract → transcode → store via VideoStore | Isolated from player; player just consumes stored files |
| Capacitor (native wrapper) | Web app stays identical; Capacitor wraps in WKWebView/WebView | Avoid `file://` video src on iOS; use HTTP server or Capacitor HTTP plugin |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend Feed State ↔ VideoPlayer | Unidirectional: store drives player, player emits events back (ended, error) | Player must not mutate store directly |
| Express Routes ↔ VideoStore | Direct method call through interface | Routes import the interface type, not the implementation |
| Frontend ↔ Backend | REST over HTTP; no WebSocket needed in M1 | M2+ social features (likes, comments) may introduce WebSocket |
| Prefetch Manager ↔ Feed API | Prefetch triggers next-page fetch when buffer is low; writes only to store | Decoupled from rendering cycle |

## Build Order Implications

Components have clear dependencies that dictate build order:

1. **Storage abstraction + disk implementation** — everything depends on this. Build the interface first, even if the disk implementation is trivial.
2. **Video streaming route (HTTP 206)** — prerequisite for any frontend work. Build and test with `curl` before writing any UI.
3. **Feed metadata API** — prerequisite for feed rendering. Returns ordered list of video metadata.
4. **VideoPlayer component** — isolated component; can be developed against a single hardcoded video URL while the feed API is built.
5. **FeedShell + Feed State** — integrates VideoPlayer with scroll/swipe; requires both the player and the feed API to be working.
6. **Prefetch Manager** — enhancement layer on top of working feed; build last after core swipe experience is validated.

## Sources

- [Scalable system design and architecture for a TikTok-like app — FastPix](https://www.fastpix.io/blog/scalable-system-design-and-architecture-for-a-tiktok-like-app)
- [Build a video streaming server with Node.js — LogRocket](https://blog.logrocket.com/build-video-streaming-server-node/)
- [Optimize Short Video App Performance — FastPix](https://www.fastpix.io/blog/strategies-to-optimize-performance-of-short-video-apps)
- [Node JS Video Streaming Server — Cloudinary](https://cloudinary.com/guides/live-streaming-video/node-js-video-streaming-server)
- [Fast playback with audio and video preload — web.dev](https://web.dev/articles/fast-playback-with-preload)
- [Capacitor vs React Native (2025) — NextNative](https://nextnative.dev/blog/capacitor-vs-react-native)
- [API Pagination Best Practices — Speakeasy](https://www.speakeasy.com/api-design/pagination)
- [Network-aware Prefetching for Short-Form Video Streaming — arXiv](https://arxiv.org/pdf/2209.02927)

---
*Architecture research for: Goonster — short-form vertical video player web app*
*Researched: 2026-04-01*
