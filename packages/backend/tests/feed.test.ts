import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/server.js'
import { MockVideoStore } from './fixtures/MockVideoStore.js'
import type { VideoMeta } from '@goonster/shared'

const mockItems: VideoMeta[] = Array.from({ length: 5 }, (_, i) => ({
  id: `test-id-${i + 1}`,
  filename: `test-${i + 1}.mp4`,
  title: `Test Video ${i + 1}`,
  duration: 3,
  mimeType: 'video/mp4' as const,
  size: 1024,
  sourcePlatform: 'local' as const,
}))

describe('Feed API (API-02, API-03, API-04)', () => {
  let server: ReturnType<typeof buildApp>['server']

  beforeAll(async () => {
    const store = new MockVideoStore(mockItems)
    const app = buildApp({ store, skipAuth: true })
    server = app.server
    await app.ready
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('returns 200 with envelope shape', async () => {
    const res = await server.inject({ method: 'GET', url: '/feed' })
    expect(res.statusCode).toBe(200)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('data.items')
    expect(body).toHaveProperty('data.nextCursor')
    expect(body).toHaveProperty('meta.total')
  })

  it('returns all items when fewer than limit', async () => {
    const res = await server.inject({ method: 'GET', url: '/feed' })
    const body = JSON.parse(res.body)
    expect(body.data.items).toHaveLength(5)
    expect(body.data.nextCursor).toBeNull()
    expect(body.meta.total).toBe(5)
  })

  it('paginates with limit', async () => {
    const res = await server.inject({ method: 'GET', url: '/feed?limit=2' })
    const body = JSON.parse(res.body)
    expect(body.data.items).toHaveLength(2)
    expect(body.data.nextCursor).not.toBeNull()
  })

  it('returns next page with cursor', async () => {
    const res1 = await server.inject({ method: 'GET', url: '/feed?limit=2' })
    const body1 = JSON.parse(res1.body)
    const cursor = body1.data.nextCursor

    const res2 = await server.inject({ method: 'GET', url: `/feed?cursor=${cursor}&limit=2` })
    const body2 = JSON.parse(res2.body)
    expect(body2.data.items).toHaveLength(2)
    expect(body2.data.items[0].id).toBe('test-id-3')
  })

  it('returns null cursor on last page', async () => {
    const res1 = await server.inject({ method: 'GET', url: '/feed?limit=4' })
    const body1 = JSON.parse(res1.body)
    const cursor = body1.data.nextCursor

    const res2 = await server.inject({ method: 'GET', url: `/feed?cursor=${cursor}&limit=10` })
    const body2 = JSON.parse(res2.body)
    expect(body2.data.items).toHaveLength(1)
    expect(body2.data.nextCursor).toBeNull()
  })

  it('returns 400 for invalid cursor', async () => {
    const res = await server.inject({ method: 'GET', url: '/feed?cursor=not-a-valid-base64-cursor-that-decodes-to-nonexistent-id' })
    expect(res.statusCode).toBe(400)
    const body = JSON.parse(res.body)
    expect(body).toHaveProperty('error.code')
  })

  it('returns 400 for limit below minimum', async () => {
    const res = await server.inject({ method: 'GET', url: '/feed?limit=0' })
    expect(res.statusCode).toBe(400)
  })

  it('returns 400 for limit above maximum', async () => {
    const res = await server.inject({ method: 'GET', url: '/feed?limit=51' })
    expect(res.statusCode).toBe(400)
  })
})
