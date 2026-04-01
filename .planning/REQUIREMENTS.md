# Requirements: Goonster

**Defined:** 2026-04-01
**Core Value:** A vertical-swipe video feed that plays content your friends chose to share — no algorithm, just people you trust.

## v1 Requirements

Requirements for initial release (Milestone 1: Static Video Player).

### Video Playback

- [ ] **PLAY-01**: Video plays fullscreen in vertical (9:16) format with `object-fit: cover`
- [ ] **PLAY-02**: First video autoplays muted on page load without user interaction
- [ ] **PLAY-03**: User can mute/unmute via a visible, persistent control on the video overlay
- [ ] **PLAY-04**: User can tap the video body to toggle play/pause
- [ ] **PLAY-05**: Video loops automatically when it reaches the end
- [ ] **PLAY-06**: Thin progress bar overlay shows elapsed time on the current video

### Feed Navigation

- [ ] **FEED-01**: User can swipe up to advance to the next video
- [ ] **FEED-02**: User can swipe down to return to the previous video
- [ ] **FEED-03**: Videos snap into place after swipe with smooth animation
- [ ] **FEED-04**: Next video is preloaded before user swipes to eliminate perceived gap
- [ ] **FEED-05**: Loading/buffering state indicator displays when video is not yet ready
- [ ] **FEED-06**: End-of-feed state displays "You've seen everything" when no more videos remain

### Backend API

- [x] **API-01**: Server responds to video requests with HTTP 206 partial content (range requests)
- [x] **API-02**: Feed endpoint returns paginated list of available videos with metadata
- [x] **API-03**: Feed pagination uses cursor-based approach (stable when videos are added)
- [x] **API-04**: Storage layer uses an abstraction interface (disk now, cloud-swappable later)

### Mobile Experience

- [ ] **MOBL-01**: App uses `100dvh` with `-webkit-fill-available` fallback for correct mobile viewport
- [ ] **MOBL-02**: All `<video>` elements include `playsinline` attribute for iOS Safari compatibility
- [ ] **MOBL-03**: Layout and controls are optimized for mobile-first touch interaction
- [ ] **MOBL-04**: Only one video plays at a time (respects iOS single-video hardware constraint)

## v2 Requirements

Deferred to future milestones. Tracked but not in current roadmap.

### Authentication & Social

- **AUTH-01**: User can create an account
- **AUTH-02**: User can log in and maintain a session
- **SOCL-01**: User can add/follow friends
- **SOCL-02**: User can see which friend shared each video ("who shared this" attribution)

### Video Ingestion

- **INGST-01**: User can submit a video link (TikTok, Reels, Shorts URL)
- **INGST-02**: System extracts video from YouTube Shorts via API
- **INGST-03**: System extracts video from TikTok
- **INGST-04**: System extracts video from Instagram Reels

### Platform

- **PLAT-01**: Native mobile app via Capacitor or React Native
- **PLAT-02**: Digest notifications ("N new videos from friends")
- **PLAT-03**: Cloud storage migration (S3/GCS)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Algorithmic recommendations | Fundamentally contradicts core value — friend-curated, not algorithm-driven |
| Public like/reaction counts | Introduces virality optimization; pollutes what friends share |
| Trending / explore section | Pulls in popularity-ranked content; undermines anti-algorithm identity |
| Comment threads | Scope explosion + moderation burden; not needed for v1 player validation |
| Video upload / original content | Goonster aggregates, platforms create — different product |
| Unmuted autoplay | Universally blocked by browsers; violates user trust |
| Infinite scroll without end state | Removes intentional-viewing experience; becomes what the product opposes |
| Push notifications per share | Notification fatigue; anti-pattern for this product's ethos |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAY-01 | Phase 2 | Pending |
| PLAY-02 | Phase 2 | Pending |
| PLAY-03 | Phase 2 | Pending |
| PLAY-04 | Phase 2 | Pending |
| PLAY-05 | Phase 2 | Pending |
| PLAY-06 | Phase 2 | Pending |
| FEED-01 | Phase 3 | Pending |
| FEED-02 | Phase 3 | Pending |
| FEED-03 | Phase 3 | Pending |
| FEED-04 | Phase 3 | Pending |
| FEED-05 | Phase 3 | Pending |
| FEED-06 | Phase 3 | Pending |
| API-01 | Phase 1 | Complete |
| API-02 | Phase 1 | Complete |
| API-03 | Phase 1 | Complete |
| API-04 | Phase 1 | Complete |
| MOBL-01 | Phase 2 | Pending |
| MOBL-02 | Phase 2 | Pending |
| MOBL-03 | Phase 2 | Pending |
| MOBL-04 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after roadmap creation*
