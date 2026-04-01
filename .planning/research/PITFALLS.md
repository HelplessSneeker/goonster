# Pitfalls Research

**Domain:** Mobile-first short-form vertical video player web app
**Researched:** 2026-04-01
**Confidence:** HIGH (iOS/Android constraints verified against WebKit official docs and MDN; patterns verified across multiple sources)

---

## Critical Pitfalls

### Pitfall 1: Missing `playsinline` on iOS Safari

**What goes wrong:**
Every `<video>` element without the `playsinline` attribute forces fullscreen takeover on iPhone. The user's carefully designed inline feed becomes a jarring native fullscreen player, breaking the entire swipe-feed UX. There is no CSS workaround — it is enforced by iOS at the OS level.

**Why it happens:**
Developers test on desktop or Android Chrome first. The attribute is iOS-specific and has no effect on other platforms, so desktop/Android testing never surfaces the problem.

**How to avoid:**
Add `playsinline` to every `<video>` element, unconditionally. Also keep the legacy `webkit-playsinline` attribute for older iOS versions (pre-iOS 10). Do this on day one of implementation.

```html
<video playsinline webkit-playsinline muted autoplay loop src="..."></video>
```

**Warning signs:**
- Videos snap to fullscreen immediately on iPhone
- The native iOS media player chrome (scrub bar, AirPlay button) appears over your UI
- Testing on desktop Chrome shows nothing wrong

**Phase to address:** Phase 1 (Player foundation) — must be in the initial video element template

---

### Pitfall 2: Autoplay Without `muted` Fails Silently

**What goes wrong:**
Attempting to call `video.play()` on an unmuted video without a prior user gesture returns a rejected Promise on every major mobile browser. The failure is silent by default — no error in the console unless you explicitly catch the rejection. The video simply never plays, and the feed appears broken.

**Why it happens:**
The autoplay policy is well documented but its silent failure mode is not obvious. Developers see the `play()` call made successfully, don't add `.catch()`, and don't realize the promise was rejected.

**How to avoid:**
Always start muted. Always handle the `play()` promise:

```typescript
video.muted = true;
const playPromise = video.play();
if (playPromise !== undefined) {
  playPromise.catch((err) => {
    // Autoplay blocked — show unmute/play prompt to user
    console.warn('Autoplay blocked:', err);
  });
}
```

Provide a visible unmute button once the user has interacted with the feed. Never attempt to autoplay unmuted without tracing back to a direct user gesture (`touchend`, `click`, `doubleclick`, or `keydown`).

**Warning signs:**
- Feed loads but no video plays
- No errors in console (because the rejection was uncaught)
- Works on desktop but not on mobile

**Phase to address:** Phase 1 (Player foundation)

---

### Pitfall 3: CSS Scroll Snap `scroll-snap-type: y mandatory` Flick-to-End on iOS Safari

**What goes wrong:**
On iOS Safari (WebKit), a fast swipe flick scrolls all the way to the end or beginning of the list, skipping every intermediate snap point. This is a fundamental behavioral difference from Chrome (Blink): WebKit doesn't cap momentum scrolling at the next snap point — it lets the gesture carry through all of them. A feed with 50 videos becomes unnavigable.

**Why it happens:**
Developers prototype with `scroll-snap-type: y mandatory` on desktop Chrome, which correctly snaps one item at a time. WebKit's scroll momentum model differs. The bug is confirmed in multiple open issues (e.g., react-window#290, which dates to 2019 and remains a systemic WebKit behavior).

**How to avoid:**
Use `scroll-snap-stop: always` on each snap child. This forces WebKit to stop at every snap point regardless of scroll velocity. If `scroll-snap-stop: always` is insufficient for your implementation, fall back to a JavaScript-based swipe handler using touch events:

```typescript
// Detect direction, prevent default scroll, animate manually
container.addEventListener('touchstart', onTouchStart, { passive: false });
container.addEventListener('touchend', onTouchEnd, { passive: false });
```

Test with fast swipes on an actual iPhone, not the iOS Simulator (Simulator uses macOS scroll physics, not iOS).

**Warning signs:**
- Snap works perfectly in desktop Chrome but skips items on iPhone
- Simulator tests pass; device tests fail
- Users report "skipping" videos

**Phase to address:** Phase 1 (Swipe navigation)

---

### Pitfall 4: `100vh` Does Not Mean "Full Screen" on Mobile Browsers

**What goes wrong:**
`height: 100vh` on mobile browsers is calculated at the maximum possible viewport height — when the browser UI (address bar, bottom tab bar) is fully hidden. On page load, before any scrolling, the browser UI is visible, so `100vh` is taller than the actual visible area. Video slides overflow below the fold. The feed looks broken on first load.

**Why it happens:**
This is a browser vendor design decision. iOS Safari and Chrome for Android both exhibit this. Developers assume `100vh` = "what the user sees" but it means "maximum possible viewport size."

**How to avoid:**
Use `100dvh` (dynamic viewport height) which updates as browser chrome shows and hides. Fall back to `-webkit-fill-available` for older iOS:

```css
.video-slide {
  height: 100dvh; /* modern browsers */
  height: -webkit-fill-available; /* iOS fallback */
  min-height: -webkit-fill-available;
}
```

Or use a JavaScript CSS custom property approach:

```typescript
const setVh = () => {
  document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
};
window.addEventListener('resize', setVh);
setVh();
// In CSS: height: calc(var(--vh, 1vh) * 100);
```

**Warning signs:**
- First video is partially hidden behind the browser address bar on page load
- Bottom of last visible element is cut off
- Problem disappears after first scroll

**Phase to address:** Phase 1 (Layout/CSS)

---

### Pitfall 5: Video Element Memory Leaks When Removing Elements from DOM

**What goes wrong:**
Removing a `<video>` element from the DOM does not release the media resources the browser has buffered. In a feed that creates and destroys video elements as the user scrolls, memory accumulates until the mobile browser tab crashes. On iOS, the OS will terminate the tab aggressively.

**Why it happens:**
Browsers hold references to decoded media buffers even after the element is removed from the DOM. The garbage collector cannot reclaim them until the `src` attribute is cleared and `load()` is called to reset the element. Developers assume DOM removal is sufficient cleanup.

**How to avoid:**
Implement an explicit cleanup function called before removing any video element:

```typescript
function destroyVideoElement(video: HTMLVideoElement): void {
  video.pause();
  video.removeAttribute('src');
  video.load(); // resets the media pipeline and releases buffers
}
```

Use a virtual window (only 3-5 video elements in DOM at any time) rather than mounting all videos upfront. Swap `src` on a fixed pool of elements instead of creating/destroying elements.

**Warning signs:**
- Tab crashes after scrolling through 20-30 videos
- Chrome DevTools memory profiler shows growing video buffer heap
- Problem worsens with longer viewing sessions

**Phase to address:** Phase 1 (Virtual list / feed management)

---

### Pitfall 6: Node.js Server Not Returning HTTP 206 Partial Content for Videos

**What goes wrong:**
When a Node/Express server serves video files with HTTP 200 (full content) instead of 206 (partial content / range requests), the browser cannot seek within the video, and some mobile browsers refuse to play the video at all. iOS Safari in particular requires range request support for video playback.

**Why it happens:**
Express's `express.static()` / `serve-static` does support range requests, but only when the `acceptRanges` option is not disabled. Custom file-serving handlers that stream the full file without handling the `Range` request header break seeking. Developers copy file-streaming code snippets that don't implement the range protocol.

**How to avoid:**
Use `express.static()` without disabling `acceptRanges`. If writing a custom handler, implement RFC 7233 range request handling:

```typescript
// Verify your server sends these headers on video responses:
// Accept-Ranges: bytes
// Content-Range: bytes 0-1023/2048
// Status: 206 Partial Content
```

Test seeking in the browser immediately after wiring up the file server. A seek that jumps in time and plays correctly confirms range requests are working.

**Warning signs:**
- Video plays from the beginning but seeking is broken
- Network tab in DevTools shows 200 responses instead of 206 for video requests
- iOS Safari won't play the video at all (blank video element)

**Phase to address:** Phase 1 (Backend file server)

---

### Pitfall 7: iOS Limits to One Simultaneously Playing Video

**What goes wrong:**
iOS enforces a hardware-level constraint: only one audio/video stream can play at a time. If you preload the next video by calling `.play()` on it while the current video is still playing, iOS will pause the current video. Attempting to play multiple videos for a crossfade transition or preview effect will always fail.

**Why it happens:**
This limitation is not prominently documented, and it differs from desktop behavior. Developers assume "preload" means "buffer silently in the background while current plays."

**How to avoid:**
Design the preload strategy around buffering (setting `src` and letting the browser prefetch) rather than playing. Only one video element should ever be in a non-paused, non-muted state at a time. Transition strategy: pause current → swap source or navigate to next element → play next.

For buffering-without-playing: set `video.preload = 'auto'` and assign `src`, but do not call `.play()`.

**Warning signs:**
- Current video pauses unexpectedly when approaching the next item
- Multiple video elements in the DOM — more than one has `paused === false`

**Phase to address:** Phase 1 (Feed preloading strategy)

---

### Pitfall 8: Intersection Observer + `play()` Race Condition

**What goes wrong:**
Using Intersection Observer to trigger `video.play()` when a slide enters the viewport creates a race condition. On mobile, rapid swipes can cause the Observer callback to fire for a video that is already partially off-screen by the time the async callback executes. The result: the wrong video plays, or two fire simultaneously, or play() is called after the element has been cleaned up.

**Why it happens:**
Intersection Observer callbacks are asynchronous and run after a microtask checkpoint. During fast gesture sequences on mobile, the scroll position can change significantly between when the intersection event occurs and when the callback fires.

**How to avoid:**
Gate the `play()` call with a re-check of the current intersection ratio at callback time:

```typescript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target as HTMLVideoElement;
    if (entry.isIntersecting && entry.intersectionRatio >= 0.9) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  });
}, { threshold: 0.9 });
```

Also implement Page Visibility API to pause all videos when the tab is backgrounded — Intersection Observer alone does not handle tab switching.

**Warning signs:**
- Wrong video plays after fast swipe
- Two videos play simultaneously
- Video plays audio briefly then stops when scrolling quickly

**Phase to address:** Phase 1 (Autoplay / play-pause lifecycle)

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Render all video elements upfront (no virtualization) | Simpler code | Tab crashes on mobile after ~20 videos; unacceptable on mobile | Never for a feed — always virtualize |
| Use `preload="auto"` on every video | Next video loads fast | Massive bandwidth waste; mobile data costs; potential iOS limit triggers | Only for 1-2 adjacent videos |
| Skip `play()` promise rejection handling | Less code | Silent broken state on mobile with no debugging signal | Never — always catch the rejection |
| Use `100vh` for slide height | Works on desktop | Broken layout on every mobile browser on first load | Never for a mobile-first app |
| Serve video files with full 200 response (no range support) | Simpler server code | Seeking broken, iOS may not play at all | Never in production |
| Hardcode video format (e.g., MP4 only) | Simplest approach | Fine for controlled static files in m1; problematic if platform extraction added later | Acceptable for Milestone 1 static files |
| One global `<video>` element with `src` swapping | Avoids element proliferation | Requires careful cleanup, some browsers retain buffers | Acceptable pattern if cleanup is rigorous |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Express static file server | Disabling or overriding `acceptRanges`, or building a custom handler without range support | Use `express.static()` with default options; verify 206 responses in DevTools Network tab |
| iOS Safari autoplay | Calling `play()` without `muted` attribute set first | Set `video.muted = true` before `play()`; always handle the returned Promise |
| CSS Scroll Snap on iOS | Relying on `scroll-snap-type: y mandatory` alone | Add `scroll-snap-stop: always` to snap children; test with fast flick on real device |
| Intersection Observer for autoplay | Not handling tab visibility separately | Combine with `document.addEventListener('visibilitychange', ...)` to pause on tab hide |
| Future native wrapper (Capacitor/RN) | Building Web APIs that don't translate — e.g., custom touch handlers that conflict with native gesture recognizers | Keep gesture handling in standard DOM events; avoid `preventDefault()` on scroll events where possible |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Preloading all videos in both directions | High memory, bandwidth spike on load | Preload N+1 ahead, N-1 behind (directional window) | Immediately visible; breaks on first 5 video session |
| Not releasing video buffer memory on element removal | Tab crash after extended session | Call `video.removeAttribute('src'); video.load()` before removing | After ~20-30 video transitions on iOS |
| `preload="auto"` on every video in feed | Entire feed downloads on page load | Use `preload="none"` by default; switch to `preload="auto"` only for adjacent slides | Immediately — kills mobile data plans |
| Mounting a new `<video>` element per video rather than reusing a pool | DOM churn, GPU context switching | Use a fixed pool of 3-5 elements and swap `src` | After ~10 transitions on low-end Android |
| `object-fit: contain` on portrait videos | Black bars on sides, not full-bleed | Use `object-fit: cover` for full-bleed; accept crop for short-form content | Every video on every device — just looks wrong |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Serving arbitrary files from disk without path sanitization | Path traversal — attacker reads `/etc/passwd` via `../../` in URL | Whitelist allowed file extensions; use `path.resolve()` and verify the resolved path starts with the videos directory |
| No Content-Type validation on served files | Browsers may execute served content as script if MIME type is wrong | Always set `Content-Type: video/mp4` (or correct type); never derive MIME type from user-supplied filename |
| CORS wildcard `*` on video API in production | Acceptable for static public content in m1, but sets a bad precedent | Lock down CORS origins before adding any auth or user data endpoints in future milestones |
| Video files accessible at predictable URLs with no access control | Fine for m1 public content; breaks when personal/private videos are added | Design URL scheme (UUIDs, not sequential IDs) now so it doesn't require a rewrite when private content is added |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visible mute/unmute control | Users don't know video has audio; feel ambushed when they unmute | Show a persistent mute toggle; animate briefly when muted state changes |
| No loading indicator between swipes | Feed feels broken during buffer wait | Show a spinner or skeleton on the video placeholder; remove on `canplay` event |
| Swipe threshold too sensitive | Accidental video skips when user tries to tap | Require minimum swipe distance (e.g., 50px) before treating as navigation intent |
| Video looping with no indication | User doesn't know they've looped | Show a subtle "replaying" indicator on loop restart using the `loop` event or monitoring `timeupdate` |
| No end-of-feed state | User swipes past last video into void | Show explicit "you've seen everything" state at feed end |
| Landscape mode not accounted for | Portrait-designed feed breaks when phone rotates | Lock orientation to portrait via `screen.orientation.lock('portrait')` in a PWA context, or handle gracefully |
| Controls/overlays intercept touch events | Tap-to-pause/play misses because overlay captures the touch | Use `pointer-events: none` on decorative overlays; only capture touch on intentional interactive elements |

---

## "Looks Done But Isn't" Checklist

- [ ] **Autoplay on mobile:** Test on a real iPhone in Safari — not the simulator, not desktop. The simulator uses macOS scroll physics and does not replicate iOS autoplay policy.
- [ ] **Range requests:** Open DevTools Network tab, load a video, click to seek — verify the server returns `206 Partial Content` with a `Content-Range` header.
- [ ] **Memory management:** Scroll through 30+ videos on a real device without refreshing. If the tab crashes or slows significantly, virtualization or cleanup is broken.
- [ ] **`playsinline`:** On iPhone, tap a video — verify it does not go fullscreen and the native iOS player chrome does not appear.
- [ ] **`100dvh` layout:** Load the app cold on iPhone. Verify the first video fills the screen exactly — no overflow below the browser bar, no gap at the top.
- [ ] **Flick scroll on iOS:** On iPhone, swipe aggressively. Verify navigation stops at exactly the next video, not the end of the list.
- [ ] **Page visibility:** Switch to another app and back. Verify the current video paused and resumes (or does not resume) as intended.
- [ ] **Single concurrent video on iOS:** Confirm only one video is playing at any given time by monitoring `paused` state on all elements in the DOM pool.
- [ ] **Path traversal:** Try `GET /videos/../package.json` — verify the server returns 404 or 403, not file contents.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Missing `playsinline` discovered late | LOW | Add attribute to video element template; propagate to all instances — one-line fix but requires testing on real device |
| Memory leak causing crashes | MEDIUM | Add cleanup function (`removeAttribute('src'); load()`) to unmount lifecycle; reduce preload window size |
| Scroll snap flick bug | MEDIUM | Add `scroll-snap-stop: always`; if insufficient, replace CSS snap with JS swipe handler — 1-2 days |
| `100vh` layout breakage | LOW | Replace with `100dvh` + `-webkit-fill-available` fallback — 30-minute fix |
| No range request support on server | LOW | Verify `express.static()` defaults are not overridden; if custom handler, rewrite to handle `Range` header |
| Path traversal vulnerability | LOW | Add path sanitization middleware before any other server change |
| iOS single video limit causing pause bugs | HIGH | Requires redesigning preload strategy from play-to-preload to src-assignment-only — 1-3 days |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Missing `playsinline` | Phase 1: Video element foundation | Test on real iPhone; video stays inline |
| Autoplay without `muted` | Phase 1: Video element foundation | Feed autoplays on iPhone cold load with no prior user gesture |
| CSS scroll snap flick on iOS | Phase 1: Swipe navigation | Fast flick on iPhone stops at next item, not end of list |
| `100vh` viewport height | Phase 1: Layout/CSS | Cold load on iPhone; first slide exactly fills visible area |
| Video memory leaks | Phase 1: Virtual feed / DOM pool | 30-video scroll session on real device without crash or slowdown |
| Server range request support | Phase 1: Backend file server | Network tab shows 206 responses; seeking works |
| iOS single video limit | Phase 1: Preload strategy design | No unintentional video pauses; only one `paused === false` at any time |
| Intersection Observer race condition | Phase 1: Play/pause lifecycle | Fast swipes do not cause wrong video to play or two videos to play simultaneously |
| Path traversal | Phase 1: Backend security | `/../` in URL path returns 403/404 |
| `object-fit` for portrait video | Phase 1: Video display CSS | No black bars on portrait videos in fullscreen slot |
| End-of-feed state | Phase 1: Feed UX | Last video reached; explicit end state shown; no UX void |

---

## Sources

- [New `<video>` Policies for iOS — WebKit official blog](https://webkit.org/blog/6784/new-video-policies-for-ios/) — HIGH confidence, authoritative
- [Video playback best practices 2025 — Mux](https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025) — MEDIUM confidence
- [Fast playback with audio and video preload — web.dev](https://web.dev/articles/fast-playback-with-preload) — HIGH confidence, Google official
- [CSS scroll-snap-type — MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/scroll-snap-type) — HIGH confidence
- [One flick scrolls forever on Safari with scroll snap — react-window issue #290](https://github.com/bvaughn/react-window/issues/290) — MEDIUM confidence, community-verified
- [100vh in Safari on iOS — bram.us](https://www.bram.us/2020/05/06/100vh-in-safari-on-ios/) — HIGH confidence, widely cited
- [Understanding Mobile Viewport Units: svh, lvh, dvh — Medium](https://medium.com/@tharunbalaji110/understanding-mobile-viewport-units-a-complete-guide-to-svh-lvh-and-dvh-0c905d96e21a) — MEDIUM confidence
- [Remove HTML5 video and clear src to prevent leaks — GitHub Gist](https://gist.github.com/danro/5725870) — MEDIUM confidence
- [HTML5 video memory leak when replacing src — Chromium issue #969049](https://bugs.chromium.org/p/chromium/issues/detail?id=969049) — HIGH confidence, official bug tracker
- [Video Enters Fullscreen in Standalone PWA despite `playsinline` — videojs-record issue #714](https://github.com/collab-project/videojs-record/issues/714) — MEDIUM confidence, community
- [Apple device-specific HTML5 video considerations — Apple developer archive](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html) — HIGH confidence, official
- [WebKit bug 162366: Allow multiple playing videos](https://bugs.webkit.org/show_bug.cgi?id=162366) — HIGH confidence, official
- [HTTP 206 Partial Content in Node.js — CodeProject](https://www.codeproject.com/Articles/813480/HTTP-Partial-Content-In-Node-js) — MEDIUM confidence
- [Serving Video with HTTP Range Requests — smoores.dev](https://smoores.dev/post/http_range_requests/) — MEDIUM confidence
- [PWA iOS Limitations and Safari Support 2026 — MagicBell](https://www.magicbell.com/blog/pwa-ios-limitations-safari-support-complete-guide) — MEDIUM confidence

---

*Pitfalls research for: mobile-first short-form vertical video player (Goonster)*
*Researched: 2026-04-01*
