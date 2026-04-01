# Phase 1: Backend Foundation - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Node/TypeScript server that serves video files with HTTP 206 range-request support and provides a cursor-paginated feed API. Includes a storage abstraction layer (disk now, cloud-swappable later). No frontend, no auth, no social features.

</domain>

<decisions>
## Implementation Decisions

### Project Structure
- **D-01:** Monorepo with `/packages/backend` and `/packages/frontend` directories, shared TypeScript types
- **D-02:** Monorepo tooling is Claude's discretion — choose whatever fits the project scale (likely simple npm/pnpm workspaces over Turborepo given current scope)

### Video Metadata
- **D-03:** Metadata schema design is Claude's discretion — design to support Phase 2 player needs (ID, URL, duration at minimum) with room for future social fields (source platform, sharer, etc.)

### Sample Content
- **D-04:** Bundled fixture videos checked into the repo — small placeholder vertical videos that are always available for development and testing

### API Conventions
- **D-05:** Response format is Claude's discretion — use whatever is standard for this kind of API (envelope pattern vs flat JSON)

### Claude's Discretion
- Monorepo tooling choice (D-02)
- Video metadata schema shape (D-03) — must support Phase 2 player and future social features
- API response envelope/format (D-05) — be consistent across all endpoints
- Fastify plugin structure and route organization
- Error response shape and HTTP status code conventions
- VideoStore interface design (must satisfy ROADMAP.md success criterion: swapping to mock requires no route handler changes)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, constraints (Node/TypeScript backend), storage evolution plan
- `.planning/REQUIREMENTS.md` — API-01 through API-04 acceptance criteria
- `.planning/ROADMAP.md` §Phase 1 — Success criteria (HTTP 206 curl test, cursor stability, VideoStore swappability)

### Research findings
- `.planning/research/STACK.md` — Fastify 5.8.x recommendation, `@fastify/static` for range requests
- `.planning/research/ARCHITECTURE.md` — VideoStore abstraction design, cursor pagination pattern, component boundaries
- `.planning/research/PITFALLS.md` — HTTP 206 range request requirement (iOS Safari breaks without it)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns

### Integration Points
- Phase 2 (Video Player Core) will consume the video streaming endpoint and feed API
- VideoStore interface established here will be swapped for cloud implementation in future milestones

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-backend-foundation*
*Context gathered: 2026-04-01*
