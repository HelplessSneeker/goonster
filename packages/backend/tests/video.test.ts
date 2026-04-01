import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/server.js'

describe('Video streaming (API-01)', () => {
  let server: ReturnType<typeof buildApp>['server']

  beforeAll(async () => {
    const app = buildApp()
    server = app.server
    await app.ready
    await server.ready()
  })

  afterAll(async () => {
    await server.close()
  })

  it('returns 206 with Content-Range for range request', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/video/placeholder-01.mp4',
      headers: { range: 'bytes=0-1023' },
    })
    expect(res.statusCode).toBe(206)
    expect(res.headers['content-range']).toBeDefined()
    expect(res.headers['content-range']).toMatch(/^bytes 0-/)
  })

  it('includes Accept-Ranges: bytes header', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/video/placeholder-01.mp4',
      headers: { range: 'bytes=0-1023' },
    })
    expect(res.headers['accept-ranges']).toBe('bytes')
  })

  it('returns 200 for request without Range header', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/video/placeholder-01.mp4',
    })
    expect(res.statusCode).toBe(200)
  })

  it('returns 404 for nonexistent video', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/video/nonexistent.mp4',
    })
    expect(res.statusCode).toBe(404)
  })
})
