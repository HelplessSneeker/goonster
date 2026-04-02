# Phase 3: Feed & Navigation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-02
**Phase:** 03-feed-navigation
**Areas discussed:** Swipe transition feel, Preloading strategy, Buffering indicator, End-of-feed state

---

## Swipe Transition Feel

| Option | Description | Selected |
|--------|-------------|----------|
| TikTok-style snap | Fast snap with slight momentum — finger release immediately commits. No bounce or overscroll. | ✓ |
| Reels-style with momentum | Allows partial drag, peek at next video. Release past threshold commits, otherwise springs back. | |

**User's choice:** TikTok-style snap
**Notes:** Decisive snap preferred, no rubber-band effect

| Option | Description | Selected |
|--------|-------------|----------|
| Mousewheel works | Scroll wheel advances one video per click. Desktop testing and laptop usability. | ✓ |
| Touch-only | Only touch gestures navigate. Simpler but limits testing. | |

**User's choice:** Mousewheel works
**Notes:** None

---

## Preloading Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| 1 video ahead | Simple, low memory. Sufficient for static files. | |
| 2 videos ahead | Smoother for consecutive fast swipes. ~3-4 videos in DOM. | ✓ |

**User's choice:** 2 videos ahead
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Remember mute state | Global mute toggle persists across swipes. TikTok/Reels behavior. | ✓ |
| Always start muted | Each new video starts muted regardless. | |

**User's choice:** Remember mute state
**Notes:** None

---

## Buffering Indicator

| Option | Description | Selected |
|--------|-------------|----------|
| Centered spinner | Simple white spinner centered on black bg. No text label. | ✓ |
| Blurred first frame + spinner | Blurred poster frame with spinner overlay. Requires thumbnail. | |

**User's choice:** Centered spinner
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Same spinner overlay | Consistent spinner for both initial load and mid-playback stalls. | ✓ |
| Subtler indicator for stalls | Smaller indicator for mid-playback stalls. | |

**User's choice:** Same spinner overlay
**Notes:** None

---

## End-of-Feed State

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal text only | Clean black screen with "You've seen everything". No buttons or illustrations. | ✓ |
| Text + swipe back hint | "You've seen everything" plus hint text/arrow for swiping back. | |

**User's choice:** Minimal text only
**Notes:** None

| Option | Description | Selected |
|--------|-------------|----------|
| Dead end — blocks further swiping | End-of-feed is final stop. User can only swipe back down. | ✓ |
| Wrap around to first video | Swiping past end wraps to first video. Infinite loop. | |

**User's choice:** Dead end
**Notes:** Matches FEED-06 requirement: "no further swipes advance"

---

## Claude's Discretion

- Swiper.js configuration details (speed, resistance, threshold)
- Spinner animation style and size
- Zustand store shape for feed state
- TanStack Query useInfiniteQuery configuration
- Video element management in Swiper slides
- Intersection Observer for play/pause
- Component decomposition

## Deferred Ideas

None — discussion stayed within phase scope
