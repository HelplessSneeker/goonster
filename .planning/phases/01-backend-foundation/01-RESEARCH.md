# Phase 1: Backend Foundation - Research

**Researched:** 2026-04-01
**Domain:** Node/TypeScript HTTP server — video file streaming with HTTP 206, cursor-paginated feed API, storage abstraction layer, pnpm monorepo scaffold
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Monorepo with `/packages/backend` and `/packages/frontend` directories, shared TypeScript types
- **D-02:** Monorepo tooling is Claude's discretion — choose whatever fits the project scale (likely simple npm/pnpm workspaces over Turborepo given current scope)
- **D-03:** Metadata schema design is Claude's discretion — design to support Phase 2 player needs (ID, URL, duration at minimum) with room for future social fields (source platform, sharer, etc.)
- **D-04:** Bundled fixture videos checked into the repo — small placeholder vertical videos that are always available for development and testing
- **D-05:** Response format is Claude's discretion — use whatever is standard for this kind of API (envelope pattern vs flat JSON)

### Claude's Discretion

- Monorepo tooling choice (D-02)
- Video metadata schema shape (D-03) — must support Phase 2 player and future social features
- API response envelope/format (D-05) — be consistent across all endpoints
- Fastify plugin structure and route organization
- Error response shape and HTTP status code conventions
- VideoStore interface design (must satisfy ROADMAP.md success criterion: swapping to mock requires no route handler changes)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| API-01 | Server responds to video requests with HTTP 206 partial content (range requests) | `@fastify/static` 9.x handles HTTP Range headers natively; verified against plugin README. No custom range handler needed. |
| API-02 | Feed endpoint returns paginated list of available videos with metadata | Fastify route returning JSON array from in-memory VideoStore; metadata sourced from JSON file on disk. |
| API-03 | Feed pagination uses cursor-based approach (stable when videos are added) | Opaque cursor = base64-encoded last-seen ID; server decodes to find offset. Offset pagination explicitly excluded per PITFALLS research. |
| API-04 | Storage layer uses an abstraction interface (disk now, cloud-swappable later) | TypeScript interface `VideoStore` with `listVideos()`, `createReadStream()`, `getSize()` methods. `DiskVideoStore` is the M1 implementation. |
</phase_requirements>

---

## Summary

Phase 1 establishes the Node/TypeScript monorepo and a Fastify 5 backend that serves video files with HTTP 206 partial content support and a cursor-paginated feed API. The entire project runs from a pnpm workspace monorepo with `packages/backend` and `packages/frontend` (frontend is a stub for Phase 2). The only non-trivial technical decision is the `VideoStore` interface design — getting this abstraction right determines how painless the M2 cloud migration will be.

The technical risk in this phase is low: `@fastify/static` handles HTTP 206 natively (no custom range request code needed), and cursor pagination for a static JSON file is straightforward. The monorepo scaffold, TypeScript config, and dev tooling take more clock time than they take intellectual effort. The fixture video files (D-04) need to be small legitimate vertical mp4s — placeholder content is sufficient.

**Primary recommendation:** Use `@fastify/static` 9.x for video file serving (HTTP 206 is automatic), define the `VideoStore` TypeScript interface before writing any route, and implement the cursor as base64-encoded last-item ID so it is stable under insertion.

---

## Standard Stack

### Core (Backend)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| fastify | 5.8.4 | HTTP server | Built-in TypeScript types, ~48k req/s, JSON Schema validation. V5 is current stable. |
| @fastify/static | 9.0.0 | Serve video files | Handles HTTP Range headers (206) automatically. Fastify 5 requires v7+; 9.x is current latest. |
| @fastify/cors | 11.2.0 | CORS headers | Required for Vite dev server (port 5173) calling backend (port 3000). |
| typescript | 6.0.2 | Type safety | Current stable. CLAUDE.md says 5.x but 6.x is now latest. |
| zod | 3.25.2 | Runtime validation | Validate env config and query params at startup. |

> **Version note:** CLAUDE.md was written during initial research and lists `@fastify/cors 9.x` and `typescript 5.x`. Actual npm latest at research date: `@fastify/cors@11.2.0`, `typescript@6.0.2`, `@fastify/static@9.0.0`. Use these verified versions.

### Supporting (Backend Dev)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| tsx | 4.21.0 | TypeScript execution | `tsx watch src/server.ts` for dev live-reload; no compile step needed in dev. |
| vitest | 4.1.2 | Unit/integration testing | Vite-native runner; pairs with `@testing-library/react` for Phase 2+. CLAUDE.md says 3.x — actual latest is 4.1.2. |
| @types/node | 25.5.0 | Node type definitions | Required for `fs`, `path`, `stream` types in TypeScript. |

### Monorepo Tooling

| Tool | Version | Purpose | Notes |
|------|---------|---------|-------|
| pnpm | 10.33.0 | Package manager + workspaces | Workspace protocol (`workspace:*`) for shared types. No Turborepo needed at this scale. |

**Installation:**
```bash
# Monorepo root
pnpm init
# pnpm-workspace.yaml: packages: ["packages/*"]

# Backend package
mkdir -p packages/backend
cd packages/backend
pnpm init
pnpm add fastify @fastify/static @fastify/cors zod
pnpm add -D tsx typescript @types/node vitest
```

**Version verification:** Versions above are confirmed against npm registry on 2026-04-01.

---

## Architecture Patterns

### Recommended Project Structure

```
goonster/
├── packages/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   ├── feed.ts        # GET /feed?cursor=&limit=
│   │   │   │   └── video.ts       # GET /video/:id (delegated to @fastify/static)
│   │   │   ├── store/
│   │   │   │   ├── VideoStore.ts  # Interface definition
│   │   │   │   └── DiskVideoStore.ts  # Disk implementation
│   │   │   ├── services/
│   │   │   │   └── feedService.ts # Pagination logic, cursor encode/decode
│   │   │   ├── types/
│   │   │   │   └── video.ts       # Shared VideoMeta type
│   │   │   └── server.ts          # Fastify app entry, plugin registration
│   │   ├── fixtures/
│   │   │   ├── videos/            # Placeholder vertical mp4 files (D-04)
│   │   │   └── metadata.json      # Video metadata records
│   │   ├── tests/
│   │   │   ├── feed.test.ts
│   │   │   ├── video.test.ts
│   │   │   └── DiskVideoStore.test.ts
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   └── frontend/                  # Stub — Phase 2 populates this
│       └── package.json
├── pnpm-workspace.yaml
├── package.json                   # Root: scripts only, no deps
└── tsconfig.base.json             # Shared compiler options
```

### Pattern 1: VideoStore Interface (API-04)

**What:** All video file I/O routes through a TypeScript interface. Route handlers depend only on the interface — never on `fs` directly. `DiskVideoStore` is the M1 implementation; a `MockVideoStore` can replace it in tests without touching routes.

**When to use:** Always — from the first commit. ARCHITECTURE.md confirms this is the single most important seam.

```typescript
// Source: ARCHITECTURE.md Pattern 3
// packages/backend/src/store/VideoStore.ts

export interface VideoStore {
  listVideos(): Promise<VideoMeta[]>
  getSize(id: string): Promise<number>
  // DiskVideoStore wraps fs.createReadStream; S3VideoStore wraps S3 getObject
  createReadStream(id: string, range: { start: number; end: number }): NodeJS.ReadableStream
  // resolveVideoUrl: used by @fastify/static root config, not by routes
}

export interface VideoMeta {
  id: string              // stable UUID — never a filename
  filename: string        // disk filename (internal to DiskVideoStore)
  title: string
  duration: number        // seconds
  mimeType: string        // 'video/mp4'
  size: number            // bytes
  // Future social fields (D-03):
  sourcePlatform?: 'tiktok' | 'reels' | 'youtube-shorts' | 'local'
  sharedBy?: string       // user ID of friend who shared
  sharedAt?: string       // ISO 8601
}
```

**Why the ID must be a UUID (not a filename):** Anti-Pattern 3 in ARCHITECTURE.md. If routes ever return the filename as the ID, a rename or cloud migration requires a data migration of client-side cached IDs. UUIDs are stable.

### Pattern 2: HTTP 206 via @fastify/static (API-01)

**What:** Register `@fastify/static` with the videos directory as root. The plugin handles `Range` headers and responds with `206 Partial Content` automatically. No manual range parsing needed.

**When to use:** This is the correct approach — see PITFALLS.md Pitfall 6 and ARCHITECTURE.md Anti-Pattern 1.

```typescript
// Source: @fastify/static README, verified against github.com/fastify/fastify-static
// packages/backend/src/server.ts

import Fastify from 'fastify'
import staticPlugin from '@fastify/static'
import cors from '@fastify/cors'
import path from 'node:path'

const server = Fastify({ logger: true })

await server.register(cors, {
  origin: ['http://localhost:5173'],  // Vite dev server
})

await server.register(staticPlugin, {
  root: path.join(import.meta.dirname, '../fixtures/videos'),
  prefix: '/video/',
  // acceptRanges defaults to true — do NOT disable it
})
```

**Verification command (from ROADMAP.md success criterion 1):**
```bash
curl -r 0-1023 http://localhost:3000/video/:id
# Must return: HTTP/1.1 206 Partial Content + Content-Range header
```

**Security note (PITFALLS.md):** `@fastify/static` handles path traversal prevention automatically. Manual file serving with `fs.createReadStream` requires explicit path sanitization — another reason to use the plugin.

### Pattern 3: Cursor-Based Feed Pagination (API-03)

**What:** `/feed` returns items plus an opaque `nextCursor` string. The cursor encodes the last-seen video ID. Server decodes cursor, finds that ID in the ordered list, returns the next `limit` items. Stable under insertion.

**When to use:** From day one. ARCHITECTURE.md Anti-Pattern 4 explains why offset pagination is wrong for this use case.

```typescript
// packages/backend/src/services/feedService.ts

interface FeedPage {
  items: VideoMeta[]
  nextCursor: string | null
  total: number
}

function encodeCursor(lastId: string): string {
  return Buffer.from(lastId).toString('base64url')
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64url').toString('utf8')
}

async function getPage(
  store: VideoStore,
  cursor: string | null,
  limit: number = 10
): Promise<FeedPage> {
  const all = await store.listVideos()
  const startIndex = cursor
    ? all.findIndex(v => v.id === decodeCursor(cursor)) + 1
    : 0
  const items = all.slice(startIndex, startIndex + limit)
  const lastItem = items.at(-1)
  return {
    items,
    nextCursor: lastItem && startIndex + limit < all.length
      ? encodeCursor(lastItem.id)
      : null,
    total: all.length,
  }
}
```

**Cursor stability under insertion:** Because the cursor encodes the item ID (not a numeric offset), inserting a new video before position N does not invalidate cursors held by in-progress sessions. This satisfies ROADMAP.md success criterion 3.

### Pattern 4: Response Envelope (D-05)

**What:** Wrap all API responses in a consistent shape. Errors follow the same envelope shape. This is the standard for APIs that will grow.

```typescript
// Success
{ "data": { ... }, "meta": { "cursor": "...", "total": 42 } }

// Error
{ "error": { "code": "NOT_FOUND", "message": "Video not found" } }
```

**Recommended:** Use the envelope. Phase 2's TanStack Query integration expects predictable response shapes. An inconsistent API is harder to type and mock.

### Pattern 5: Fastify Plugin Structure

**What:** Each route family is a Fastify plugin (arrow function wrapped in `fastifyPlugin`). This allows isolated dependency injection — inject a `VideoStore` instance per plugin rather than using globals.

```typescript
// packages/backend/src/routes/feed.ts
import { FastifyInstance } from 'fastify'
import type { VideoStore } from '../store/VideoStore.js'

export async function feedRoutes(
  fastify: FastifyInstance,
  options: { store: VideoStore }
) {
  fastify.get('/feed', async (request, reply) => {
    const { cursor, limit = '10' } = request.query as Record<string, string>
    // ...
  })
}
```

This is what makes swapping `DiskVideoStore` for a `MockVideoStore` in tests require no route handler changes (ROADMAP.md success criterion 4).

### Anti-Patterns to Avoid

- **Importing `fs` directly in route handlers:** All file I/O must go through `VideoStore`. See ARCHITECTURE.md Anti-Pattern 5.
- **Disabling `acceptRanges` on `@fastify/static`:** This breaks HTTP 206. Safari will not play the video.
- **Using filenames as video IDs in API responses:** Anti-Pattern 3. Use UUID stable identifiers.
- **Offset pagination (`?page=N`):** Anti-Pattern 4. Use cursor pagination.
- **Path traversal without plugin protection:** PITFALLS.md Security section. Use `@fastify/static` (handled automatically) or sanitize manually.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| HTTP 206 range request handling | Custom `Range` header parser + `fs.createReadStream` with byte range | `@fastify/static` 9.x | The plugin handles multi-range requests, conditional GET, ETag, If-Range, 416 errors — all of RFC 7233. Custom implementations routinely miss edge cases. |
| Path traversal prevention | Manual `path.resolve()` + prefix check | `@fastify/static` | Plugin handles `..` escapes, symlink following, and encoded slashes. |
| CORS header management | Manual `res.setHeader('Access-Control-Allow-Origin', ...)` | `@fastify/cors` | Pre-flight OPTIONS, credentials handling, and vary headers are easy to get wrong. |
| TypeScript project scaffolding | Manual tsconfig from scratch | pnpm workspace + `tsconfig.base.json` | Extend from base config in each package; avoids drift. |

**Key insight:** HTTP range requests have more edge cases than they appear. RFC 7233 covers multi-range, partial-range, unsatisfiable-range (416), conditional-range (If-Range header), and ETag interactions. `@fastify/static` implements all of this. The 30-line custom implementation in the architecture docs is illustrative — do not ship it.

---

## Common Pitfalls

### Pitfall 1: `acceptRanges` Silently Disabled

**What goes wrong:** Someone adds `acceptRanges: false` to `@fastify/static` options (perhaps copying a snippet for a non-video use case), and the server returns HTTP 200 instead of 206. Video seeking breaks. iOS Safari may refuse to play entirely.

**Why it happens:** `acceptRanges` is a plugin option that defaults to `true`. It is easy to override without realizing the consequence.

**How to avoid:** Never pass `acceptRanges: false` to `@fastify/static`. Add a test that asserts the `Accept-Ranges: bytes` header is present on video responses.

**Warning signs:** Network tab shows `200 OK` for video requests instead of `206 Partial Content`.

### Pitfall 2: TypeScript Module Resolution Mismatch

**What goes wrong:** `tsconfig.json` uses `"module": "CommonJS"` but Fastify 5 recommends ESM, or `import.meta.dirname` is used without `"module": "Node16"` or `"NodeNext"`. Build fails with obscure module errors.

**Why it happens:** Copy-pasted tsconfig snippets from older tutorials. Fastify 5 and Node 22 work best with native ESM.

**How to avoid:**
```json
// tsconfig.json for packages/backend
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "Node16",
    "moduleResolution": "Node16",
    "target": "ES2022",
    "outDir": "dist",
    "rootDir": "src"
  }
}
```
And in `package.json`: `"type": "module"` — required for `import.meta.dirname` and top-level `await`.

### Pitfall 3: Video Files Not in .gitignore Scope

**What goes wrong:** Fixture videos (D-04) are large binary files. If `git add .` stages them before a `.gitattributes` rule or `.gitignore` exclusion is configured, they bloat the repo permanently. Git history cannot be easily cleaned.

**Why it happens:** Greenfield project, `.gitignore` not yet configured, developer runs `git add .` carelessly.

**How to avoid:** Add to `.gitignore` before any `git add`:
```
packages/backend/fixtures/videos/*.mp4
packages/backend/fixtures/videos/*.webm
```
Then add the fixture files explicitly with `git add -f packages/backend/fixtures/videos/placeholder.mp4`. Or use Git LFS for binary fixtures.

**Alternative:** Use very small (< 100KB) placeholder videos — short duration, low resolution. At that size, they are acceptable in git without LFS.

### Pitfall 4: Missing `.js` Extensions in ESM Imports

**What goes wrong:** In Node16/NodeNext module mode, TypeScript requires `.js` extensions on relative imports even though the source files are `.ts`. Without them, `node` cannot resolve the modules at runtime.

**Why it happens:** CommonJS Node tolerated missing extensions. ESM does not.

**How to avoid:**
```typescript
// Wrong
import { VideoStore } from '../store/VideoStore'
// Correct
import { VideoStore } from '../store/VideoStore.js'
```

### Pitfall 5: Cursor Decoding Fails on Invalid Base64

**What goes wrong:** A client passes a malformed or expired cursor. `Buffer.from(cursor, 'base64url')` produces garbage. `findIndex` returns -1. The server returns items from position 0 — silently resetting pagination.

**Why it happens:** No input validation on the cursor query parameter.

**How to avoid:** Wrap cursor decoding in a try/catch. Return a 400 with a clear error if decoding fails or if the decoded ID is not found in the current video list. Use Zod to validate query params:
```typescript
const QuerySchema = z.object({
  cursor: z.string().base64url().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})
```

---

## Code Examples

### Fastify 5 Server Entry (ESM + Top-Level Await)

```typescript
// packages/backend/src/server.ts
import Fastify from 'fastify'
import staticPlugin from '@fastify/static'
import cors from '@fastify/cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { feedRoutes } from './routes/feed.js'
import { DiskVideoStore } from './store/DiskVideoStore.js'

const store = new DiskVideoStore(
  path.join(import.meta.dirname, '../fixtures/videos'),
  path.join(import.meta.dirname, '../fixtures/metadata.json'),
)

const server = Fastify({ logger: true })

await server.register(cors, {
  origin: process.env.NODE_ENV === 'production'
    ? ['https://goonster.app']
    : ['http://localhost:5173'],
})

await server.register(staticPlugin, {
  root: path.join(import.meta.dirname, '../fixtures/videos'),
  prefix: '/video/',
  // acceptRanges defaults true — never override to false
})

await server.register(feedRoutes, { store })

const port = parseInt(process.env.PORT ?? '3000', 10)
await server.listen({ port, host: '0.0.0.0' })
```

### DiskVideoStore Implementation

```typescript
// packages/backend/src/store/DiskVideoStore.ts
import fs from 'node:fs'
import path from 'node:path'
import type { VideoStore, VideoMeta } from './VideoStore.js'

export class DiskVideoStore implements VideoStore {
  constructor(
    private readonly videosDir: string,
    private readonly metadataPath: string,
  ) {}

  async listVideos(): Promise<VideoMeta[]> {
    const raw = await fs.promises.readFile(this.metadataPath, 'utf-8')
    return JSON.parse(raw) as VideoMeta[]
  }

  async getSize(id: string): Promise<number> {
    const meta = await this.#findMeta(id)
    const stat = await fs.promises.stat(path.join(this.videosDir, meta.filename))
    return stat.size
  }

  createReadStream(id: string, range: { start: number; end: number }): NodeJS.ReadableStream {
    // NOTE: @fastify/static handles range requests directly from root dir.
    // This method exists for future S3VideoStore compatibility and direct-stream tests.
    const meta = this.#findMetaSync(id)
    return fs.createReadStream(path.join(this.videosDir, meta.filename), range)
  }

  #findMetaSync(id: string): VideoMeta {
    const all = JSON.parse(fs.readFileSync(this.metadataPath, 'utf-8')) as VideoMeta[]
    const found = all.find(v => v.id === id)
    if (!found) throw new Error(`Video not found: ${id}`)
    return found
  }

  async #findMeta(id: string): Promise<VideoMeta> {
    const all = await this.listVideos()
    const found = all.find(v => v.id === id)
    if (!found) throw new Error(`Video not found: ${id}`)
    return found
  }
}
```

### Feed Route

```typescript
// packages/backend/src/routes/feed.ts
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import type { VideoStore } from '../store/VideoStore.js'
import { getPage } from '../services/feedService.js'

const QuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function feedRoutes(
  fastify: FastifyInstance,
  options: { store: VideoStore },
) {
  fastify.get('/feed', async (request, reply) => {
    const parsed = QuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_QUERY', message: parsed.error.message },
      })
    }
    const { cursor, limit } = parsed.data
    const page = await getPage(options.store, cursor ?? null, limit)
    return reply.send({ data: page })
  })
}
```

### Vitest Config

```typescript
// packages/backend/vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
```

### MockVideoStore for Tests

```typescript
// packages/backend/tests/fixtures/MockVideoStore.ts
import type { VideoStore, VideoMeta } from '../../src/store/VideoStore.js'
import { Readable } from 'node:stream'

export class MockVideoStore implements VideoStore {
  constructor(private readonly items: VideoMeta[] = []) {}

  async listVideos(): Promise<VideoMeta[]> { return this.items }

  async getSize(id: string): Promise<number> {
    const m = this.items.find(v => v.id === id)
    return m?.size ?? 1024
  }

  createReadStream(_id: string, _range: { start: number; end: number }): NodeJS.ReadableStream {
    return Readable.from(Buffer.alloc(1024))
  }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `express.static()` for video serving | `@fastify/static` on Fastify 5 | Fastify 5 stable 2024 | ~2-3x throughput gain; built-in TypeScript types |
| `@fastify/cors 9.x` (CLAUDE.md version) | `@fastify/cors 11.2.x` | 2025-2026 | Same API, updated deps; use 11.x |
| `@fastify/static 8.x` (CLAUDE.md version) | `@fastify/static 9.0.0` | 2026-03 | Latest; use 9.x with Fastify 5 |
| `typescript 5.x` (CLAUDE.md version) | `typescript 6.0.2` | 2025-2026 | New stable major; Node16 module mode still valid |
| `vitest 3.x` (CLAUDE.md version) | `vitest 4.1.2` | 2025-2026 | Same API; use latest |

**Deprecated/outdated:**
- `zod-to-json-schema`: Not needed for Phase 1. Fastify's JSON Schema validation is optional for this scope. Zod with `.safeParse()` in route handlers is sufficient and simpler.
- `tsx watch` in `package.json#scripts.dev` — still current, no change.

---

## Open Questions

1. **Fixture video files source (D-04)**
   - What we know: Small vertical placeholder videos should be checked in.
   - What's unclear: Whether to generate programmatically (e.g., ffmpeg black screen), download from a public domain source, or provide instructions for the developer to supply their own.
   - Recommendation: Use ffmpeg to generate two 3-second 360x640 placeholder mp4 files during Wave 0 setup. Document the generation command. No ffmpeg at plan execution time? Provide a `curl` command to download a Creative Commons placeholder from a known URL.

2. **Shared TypeScript types package (D-01)**
   - What we know: D-01 specifies shared types between backend and frontend.
   - What's unclear: Whether to create `packages/shared` now or inline `VideoMeta` in backend and copy to frontend in Phase 2.
   - Recommendation: Create `packages/shared/src/types/video.ts` in Phase 1. Import it from both packages via the pnpm workspace protocol. Avoids a copy-paste divergence when Phase 2 starts.

3. **`@fastify/static` video prefix URL**
   - What we know: ARCHITECTURE.md says the client uses `/video/:id` as the src URL. `@fastify/static` with `prefix: '/video/'` would serve `fixtures/videos/filename.mp4` at `/video/filename.mp4`.
   - What's unclear: Since IDs are UUIDs and files are named by UUID (e.g., `abc-123.mp4`), the URL becomes `/video/abc-123.mp4`. The `VideoStore.listVideos()` returns a URL the client can use directly, OR the client constructs the URL from the ID.
   - Recommendation: `listVideos()` returns `VideoMeta` with just the `id` field. The client (Phase 2) constructs `${API_BASE}/video/${id}.mp4`. This keeps the storage abstraction clean — the server never exposes filenames in the API.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Server runtime | Yes | v25.8.2 | — |
| pnpm | Package manager | Yes | 10.33.0 | npm workspaces (minor DX difference) |
| npm registry access | Package install | Assumed yes | — | — |
| ffmpeg | Fixture video generation | Unknown — not checked | — | Download pre-made placeholder mp4 via curl |

**Missing dependencies with no fallback:** None blocking.

**Missing dependencies with fallback:**
- ffmpeg for fixture generation: if absent, use a `curl` download of a public-domain 3-second vertical video (or check in a pre-generated binary placeholder < 100KB).

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.2 |
| Config file | `packages/backend/vitest.config.ts` — Wave 0 must create this |
| Quick run command | `pnpm --filter backend test --run` |
| Full suite command | `pnpm --filter backend test --run --coverage` |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| API-01 | `GET /video/test.mp4` with `Range: bytes=0-1023` returns HTTP 206 + `Content-Range` header | integration | `pnpm --filter backend test --run tests/video.test.ts` | No — Wave 0 |
| API-01 | `GET /video/test.mp4` without Range header returns HTTP 200 (full file) | integration | same | No — Wave 0 |
| API-02 | `GET /feed` returns JSON array of VideoMeta with correct shape | integration | `pnpm --filter backend test --run tests/feed.test.ts` | No — Wave 0 |
| API-02 | `GET /feed` returns `nextCursor` when more items exist | integration | same | No — Wave 0 |
| API-03 | Calling `GET /feed?cursor=<token>` returns next page | integration | same | No — Wave 0 |
| API-03 | Cursor is stable after inserting a new video (splice test) | unit | `pnpm --filter backend test --run tests/feedService.test.ts` | No — Wave 0 |
| API-04 | Swapping MockVideoStore for DiskVideoStore requires no route handler changes | integration | `pnpm --filter backend test --run tests/feed.test.ts` (uses MockVideoStore) | No — Wave 0 |
| API-04 | `DiskVideoStore.listVideos()` returns valid VideoMeta array from fixture JSON | unit | `pnpm --filter backend test --run tests/DiskVideoStore.test.ts` | No — Wave 0 |

### Sampling Rate

- **Per task commit:** `pnpm --filter backend test --run`
- **Per wave merge:** `pnpm --filter backend test --run --coverage`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `packages/backend/vitest.config.ts` — test config
- [ ] `packages/backend/tests/video.test.ts` — API-01 coverage
- [ ] `packages/backend/tests/feed.test.ts` — API-02, API-03, API-04 coverage
- [ ] `packages/backend/tests/feedService.test.ts` — cursor stability unit tests
- [ ] `packages/backend/tests/DiskVideoStore.test.ts` — store unit tests
- [ ] `packages/backend/tests/fixtures/MockVideoStore.ts` — shared test helper
- [ ] Framework install: `pnpm add -D vitest @vitest/coverage-v8` — in Wave 0 setup task

---

## Project Constraints (from CLAUDE.md)

All directives from CLAUDE.md that constrain Phase 1 planning:

| Directive | Impact on Phase 1 |
|-----------|-------------------|
| Backend: Node/TypeScript only | Fastify 5 + TypeScript — no other server runtime |
| Static content only (m1) | No database, no auth, no external API calls. Video files served from disk. |
| Architecture choices should not preclude native app later | Use UUIDs for video IDs (not filenames). Keep video URL resolution behind `resolveVideoUrl(id)`. No `file://` URLs in API responses. |
| Do not use Express (greenfield) | Fastify 5 is the correct choice — confirmed |
| Do not use Redux/RTK | Backend-only phase, not applicable |
| Do not use HLS.js (v1 scope) | Serve raw mp4/webm — confirmed |
| `@fastify/static` for byte-range requests | Confirmed — handles HTTP Range natively. Never roll custom range handler. |
| pnpm workspace monorepo | D-02 locked |
| Abstract `resolveVideoUrl(id)` from day one | `VideoStore` interface is that abstraction |

---

## Sources

### Primary (HIGH confidence)
- npm registry — fastify@5.8.4, @fastify/static@9.0.0, @fastify/cors@11.2.0, vitest@4.1.2, typescript@6.0.2, tsx@4.21.0, zod@3.25.2, pnpm@10.33.0 — versions verified 2026-04-01
- `.planning/research/ARCHITECTURE.md` — VideoStore interface, cursor pagination, HTTP 206 pattern
- `.planning/research/PITFALLS.md` — path traversal, range request, anti-pattern inventory
- `.planning/research/STACK.md` — Fastify 5 + @fastify/static rationale

### Secondary (MEDIUM confidence)
- CLAUDE.md — Stack recommendations (versions stale; rationale valid)
- `github.com/fastify/fastify-static` — plugin API and Range request behavior

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry 2026-04-01
- Architecture: HIGH — VideoStore pattern, cursor pagination, and HTTP 206 approach all documented in prior architecture research with authoritative sources
- Pitfalls: HIGH — derived from prior pitfalls research; most items verified against official browser/WebKit documentation

**Research date:** 2026-04-01
**Valid until:** 2026-06-01 (stable packages; re-verify if more than 60 days pass before planning begins)
