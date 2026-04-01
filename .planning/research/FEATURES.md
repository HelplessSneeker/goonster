# Feature Research

**Domain:** Short-form vertical video player / friend-curated aggregator
**Researched:** 2026-04-01
**Confidence:** HIGH (player UX) / MEDIUM (social/aggregation layer)

## Feature Landscape

### Table Stakes (Users Expect These)

Features that define the category. Missing any of these and the product feels broken or half-built.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Fullscreen vertical playback | TikTok/Reels established this as the default format — any other layout feels wrong | LOW | Use `playsinline` on iOS, 9:16 aspect ratio, `object-fit: cover` |
| Autoplay on load | First video must start immediately — waiting for a tap breaks the immersion | LOW | Must be muted by default; browsers block unmuted autoplay universally |
| Muted by default with visible unmute | Browser policy forces muted autoplay; unmute CTA is how users opt into sound | LOW | Prominent mute/unmute button on video overlay; remember state per-session |
| Swipe-to-next navigation | Vertical swipe is the core gesture vocabulary of the format; any other nav feels alien | MEDIUM | Requires touch gesture detection, snap scrolling, and preload of next video |
| Looping playback | Short videos are meant to loop; no loop = dead end that kills engagement | LOW | `loop` attribute on `<video>` element, or manual re-seek on `ended` event |
| Smooth snap-scroll between videos | Partial scroll and snap to next/previous is what separates this from a list of embeds | MEDIUM | CSS scroll-snap or custom gesture handler; must feel instant, not janky |
| Buffering/loading state indicator | Users need to see the video is loading, not broken | LOW | Spinner or skeleton overlay during `waiting` events |
| Video progress indicator | Thin bar at bottom showing elapsed time; short-form users glance at it constantly | LOW | Simple progress bar; full scrub control is NOT required for short-form |
| Basic play/pause on tap | Tap center to pause/play is expected behavior from every major platform | LOW | Single tap on video body toggles playback |

### Differentiators (Competitive Advantage)

These features align with the core value proposition — anti-algorithm, friend-curated — and are where Goonster competes.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Friend-curated feed (no algorithm) | Core identity: what you watch was chosen by people you trust, not optimized for engagement time | HIGH | Requires social graph, sharing mechanics, and curation layer; v1 defers this via static files |
| Cross-platform aggregation (TikTok + Reels + Shorts in one feed) | Eliminates platform-switching; one place for all short-form content friends share | HIGH | Requires video extraction per-platform; complex and fragile (TikTok rate-limits aggressively) |
| Finite/intentional feed | Visible end-of-feed state with clear count; users know when they've seen everything their friends shared | LOW | Counterintuitively rare; deeply aligned with anti-algorithm positioning |
| "Who shared this" attribution | Every video shows which friend submitted it; builds social context around content | MEDIUM | Requires user accounts and sharing graph; deferred past v1 |
| Minimal, non-distracting UI chrome | Keep overlay controls sparse; let the video breathe | LOW | No like counts, no trending badges, no recommendation carousels |
| Auto-advance with friend context | When auto-advancing, show "from [friend]" as each video loads | LOW | Low-effort once social graph exists; high perceived value |
| Session awareness / soft stopping cues | Optional: show "You've watched N videos" nudge; respects user autonomy without manipulation | LOW | Align with anti-algorithm ethos; not a dark-pattern auto-pause |

### Anti-Features (Commonly Requested, Often Problematic)

Features to explicitly avoid. Many will feel natural to add — resist.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Algorithmic recommendation | "Discover new content" is a real user need | Directly contradicts core value proposition; once added, it defines the product | Let friend network be the discovery mechanism |
| Like / reaction counts | Familiar engagement signal from every competitor | Introduces performance anxiety, optimizes for virality not quality, pollutes what friends share | "Saved" or private bookmark for personal use only |
| Trending / explore section | Adds content surface area beyond friend feed | Pulls in algorithmic or popularity-ranked content; undermines anti-algorithm identity | If needed: "Popular in your friend group" (social graph scoped only) |
| Unmuted autoplay | Feels more immersive | Universally blocked by browsers and violates user trust; causes immediate bounces | Muted autoplay + prominent, persistent unmute button |
| Infinite scroll without end state | Keeps session going, familiar pattern | Removes the intentional-viewing experience; becomes the thing the product opposes | Show end-of-feed state: "That's everything your friends shared" |
| Comment threads per video | Expected social feature | Adds moderation burden, creates engagement optimization pressure, scope explosion | Reaction or emoji-only response; or defer entirely |
| Push notifications for every share | Drives re-engagement | Notification fatigue; turns the app into an attention vampire | Digest: "Your friends shared 5 videos since you last checked" |
| Video upload / original content creation | Feels like natural extension | Pivots product from curation to creation; different product, different users | Stay pure: Goonster aggregates, platforms create |

## Feature Dependencies

```
[Video Player Core]
    ├──requires──> [Autoplay + Muted]
    ├──requires──> [Swipe Gesture Handler]
    │                   └──requires──> [Preload Next Video]
    ├──requires──> [Progress Bar]
    └──requires──> [Loop / Auto-advance]

[Friend-Curated Feed]
    └──requires──> [User Accounts + Auth]
                       └──requires──> [Social Graph (follow/friend)]
                                           └──requires──> [Share Submission UI]
                                                              └──requires──> [Video Extraction]
                                                                                 └──requires──> [Platform API / Scraper per platform]

[Video Extraction]
    ├──requires──> [TikTok extraction] (highest complexity, fragile)
    ├──requires──> [Instagram Reels extraction] (restrictive API, scraper needed)
    └──requires──> [YouTube Shorts extraction] (most stable: YouTube Data API v3 exists)

[Finite Feed / End-of-Feed State]
    └──requires──> [Known video count] (trivial with static files in v1)

[Who Shared This Attribution]
    └──requires──> [User Accounts + Auth]
    └──requires──> [Social Graph]
```

### Dependency Notes

- **Video Player Core has no dependencies on social features.** This is why v1 can ship with static files — the player is a self-contained unit.
- **Friend-curated feed requires auth before anything social works.** Auth is the unlock for the entire social layer.
- **Video extraction is the highest-risk dependency.** TikTok and Instagram aggressively rate-limit and block scraping; this work should be isolated and treated as an integration problem, not a product feature until stable.
- **YouTube Shorts is the safest extraction path** — YouTube Data API v3 provides legitimate video data access; use this first in future milestones.
- **Finite feed enhances but does not require** the anti-algorithm positioning. It can be shipped in v1 trivially (static file count is always known).

## MVP Definition

### Launch With (v1 — Milestone 1)

The player experience with static files. Validate the core interaction loop.

- [ ] Fullscreen vertical video player — the product literally doesn't exist without this
- [ ] Autoplay muted on load — first frame must play immediately
- [ ] Visible mute/unmute control — required for audio; browsers force this
- [ ] Swipe up/down to navigate between videos — the defining interaction
- [ ] Video loops — short-form default; no loop = dead end
- [ ] Progress bar overlay — users expect temporal context even on short clips
- [ ] Loading/buffering indicator — prevents "is this broken?" perception
- [ ] Preload next video — eliminates perceived gap between swipes
- [ ] Finite feed end state — "You've seen everything" message; aligns with anti-algorithm identity and is free to implement with static files

### Add After Validation (v1.x — post player validation)

Add once the player experience is proven solid.

- [ ] User authentication — unlock for all social features; add when ready to build social layer
- [ ] Video link submission (URL ingestion) — let friends share TikTok/Reels/Shorts URLs
- [ ] YouTube Shorts extraction — safest platform to start with (official API exists)
- [ ] "Who shared this" attribution on each card — low complexity once auth exists, high value

### Future Consideration (v2+)

Defer until product-market fit and social graph are established.

- [ ] TikTok video extraction — high complexity, fragile; worth solving only after YouTube Shorts is stable
- [ ] Instagram Reels extraction — most restrictive platform; likely requires third-party scraping service
- [ ] Friend invitation / social graph — requires trust and UX investment; do this deliberately
- [ ] Digest notifications — "N new videos from friends" — only after retention data shows value
- [ ] Mobile app wrapping (Capacitor/React Native) — web must be solid first

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Fullscreen vertical player | HIGH | LOW | P1 |
| Autoplay muted | HIGH | LOW | P1 |
| Swipe navigation | HIGH | MEDIUM | P1 |
| Video loop | HIGH | LOW | P1 |
| Progress bar | MEDIUM | LOW | P1 |
| Buffering indicator | MEDIUM | LOW | P1 |
| Preload next video | HIGH | MEDIUM | P1 |
| End-of-feed state | MEDIUM | LOW | P1 |
| Mute/unmute control | HIGH | LOW | P1 |
| User authentication | HIGH | MEDIUM | P2 |
| URL submission / link sharing | HIGH | MEDIUM | P2 |
| "Who shared this" attribution | HIGH | LOW (post-auth) | P2 |
| YouTube Shorts extraction | HIGH | MEDIUM | P2 |
| TikTok extraction | HIGH | HIGH | P3 |
| Instagram Reels extraction | HIGH | HIGH | P3 |
| Digest notifications | MEDIUM | MEDIUM | P3 |
| Native app wrapper | MEDIUM | HIGH | P3 |

**Priority key:**
- P1: Must have for v1 launch
- P2: Add after core player is validated
- P3: Future consideration, defer until PMF

## Competitor Feature Analysis

| Feature | TikTok | Instagram Reels | YouTube Shorts | Goonster Approach |
|---------|--------|-----------------|----------------|-------------------|
| Feed curation | Algorithm (For You) | Algorithm | Algorithm | Friend-submitted only — no algorithm |
| Content source | Original uploads | Original uploads | Original uploads | Aggregates links from all three platforms |
| Autoplay | Yes, muted | Yes, muted | Yes, muted | Yes, muted — standard |
| Swipe navigation | Yes, vertical | Yes, vertical | Yes, vertical | Yes, vertical — standard |
| Loop | Yes | Yes | Yes | Yes — standard |
| Like counts | Yes, public | Yes, public | Yes, public | Deliberately absent in v1 |
| Comment threads | Yes | Yes | Yes | Deliberately absent in v1 |
| End-of-feed | No — infinite | No — infinite | No — infinite | Yes — intentional; counter-positioning |
| Cross-platform | No | No | No | Yes — core differentiator |
| Social graph | Follows/followers | Follows/followers | Subscriptions | Friend-only; no public follower counts |
| Trending/Discover | Yes, prominent | Yes, prominent | Yes, prominent | No — explicitly excluded |

## Sources

- Mux: Best Practices for Video Playback (2025) — https://www.mux.com/articles/best-practices-for-video-playback-a-complete-guide-2025
- Vidzflow: Mastering Video Player Controls UX — https://www.vidzflow.com/blog/mastering-video-player-controls-ux-best-practices
- Adspyder: UX Design for Video Content (2026) — https://adspyder.io/blog/ux-design-for-video-content/
- Letterboxd design analysis (friend-feed without algorithm): https://blakecrosley.com/guides/design/letterboxd
- Bloomberg/BNN: Strava and Letterboxd surge on anti-algorithm demand — https://www.bnnbloomberg.ca/business/2024/08/31/strava-and-letterboxd-surge-as-users-crave-social-media-refuge/
- Medium/Rene Otto: Autoplay and infinite scroll as dark patterns — https://rene-otto.medium.com/autoplay-and-infinite-scroll-8607abe52bb7
- Scrapfly: Social Media Scraping complexity 2026 — https://scrapfly.io/blog/posts/social-media-scraping
- MDN Web Docs: Video buffering and time ranges — https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Audio_and_video_delivery/buffering_seeking_time_ranges

---
*Feature research for: short-form video player / friend-curated aggregator (Goonster)*
*Researched: 2026-04-01*
