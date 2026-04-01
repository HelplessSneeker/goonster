# Phase 1: Backend Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-01
**Phase:** 01-Backend Foundation
**Areas discussed:** Video metadata, Project structure, Sample content, API conventions

---

## Video Metadata

| Option | Description | Selected |
|--------|-------------|----------|
| Basics only | ID, video URL, duration — minimum to play | |
| Display metadata | Title, description, thumbnail URL — for future overlay UI | |
| Source tracking | Original platform + URL — prep for future extraction | |
| You decide | Include whatever makes sense for future phases | ✓ |

**User's choice:** You decide
**Notes:** Claude has discretion to design metadata schema supporting Phase 2 player and future social features.

---

## Project Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Monorepo | Single repo, /backend and /frontend dirs, shared TypeScript types | ✓ |
| Separate repos | Independent repos for backend and frontend | |
| You decide | Whatever works best for project size | |

**User's choice:** Monorepo

### Follow-up: Monorepo Tooling

| Option | Description | Selected |
|--------|-------------|----------|
| Simple /packages | Manual workspace structure | |
| Turborepo | Build orchestration, caching | |
| You decide | Whatever fits the project scale | ✓ |

**User's choice:** You decide

---

## Sample Content

| Option | Description | Selected |
|--------|-------------|----------|
| Bundled fixtures | Small placeholder videos checked into repo | ✓ |
| Script to download | Seed script for sample videos | |
| Bring my own | Drop files into folder manually | |
| You decide | Whatever gets testing fastest | |

**User's choice:** Bundled fixtures

---

## API Conventions

| Option | Description | Selected |
|--------|-------------|----------|
| Envelope pattern | { data, cursor, meta } wrapper | |
| Flat JSON | Top-level array/object, cursor in headers | |
| You decide | Whatever is standard | ✓ |

**User's choice:** You decide

---

## Claude's Discretion

- Video metadata schema design
- Monorepo tooling choice
- API response format and error shape
- Fastify plugin structure
- VideoStore interface design

## Deferred Ideas

None — discussion stayed within phase scope
