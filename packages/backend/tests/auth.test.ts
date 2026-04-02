import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildApp } from '../src/server.js'
import { MockVideoStore } from './fixtures/MockVideoStore.js'

describe.skipIf(!process.env.DATABASE_URL)(
  'Auth API (AUTH-01, AUTH-02, AUTH-03, AUTH-04, INFRA-02, INFRA-05)',
  () => {
    let server: ReturnType<typeof buildApp>['server']
    const testEmail = `test-${Date.now()}@example.com`
    const testPassword = 'testpassword123'
    let sessionCookie: string

    beforeAll(async () => {
      const store = new MockVideoStore([])
      const app = buildApp({ store })
      server = app.server
      await app.ready
      await server.ready()
    })

    afterAll(async () => {
      await server.close()
    })

    // INFRA-05: CORS credentials
    it('CORS preflight includes Access-Control-Allow-Credentials', async () => {
      const res = await server.inject({
        method: 'OPTIONS',
        url: '/api/auth/sign-in/email',
        headers: {
          origin: 'http://localhost:5173',
          'access-control-request-method': 'POST',
        },
      })
      expect(res.headers['access-control-allow-credentials']).toBe('true')
    })

    // INFRA-02: Feed requires auth
    it('GET /feed returns 401 without session cookie', async () => {
      const res = await server.inject({ method: 'GET', url: '/feed' })
      expect(res.statusCode).toBe(401)
    })

    // AUTH-01: Registration
    it('POST /api/auth/sign-up/email creates a user', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/auth/sign-up/email',
        payload: {
          email: testEmail,
          password: testPassword,
          name: testEmail.split('@')[0],
        },
        headers: { 'content-type': 'application/json' },
      })
      expect(res.statusCode).toBe(200)
      const body = JSON.parse(res.body)
      expect(body).toHaveProperty('user')
      expect(body.user.email).toBe(testEmail)
    })

    // AUTH-02: Login
    it('POST /api/auth/sign-in/email returns session with cookie', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/auth/sign-in/email',
        payload: { email: testEmail, password: testPassword },
        headers: { 'content-type': 'application/json' },
      })
      expect(res.statusCode).toBe(200)
      const setCookie = res.headers['set-cookie']
      expect(setCookie).toBeDefined()
      sessionCookie = Array.isArray(setCookie)
        ? setCookie.join('; ')
        : (setCookie as string)
    })

    // AUTH-04: Session cookie is httpOnly
    it('session cookie has httpOnly flag', async () => {
      expect(sessionCookie).toBeDefined()
      expect(sessionCookie.toLowerCase()).toContain('httponly')
    })

    // INFRA-02: Authed feed access
    it('GET /feed returns 200 with valid session cookie', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/feed',
        headers: { cookie: sessionCookie },
      })
      expect(res.statusCode).toBe(200)
    })

    // AUTH-03: Logout
    it('POST /api/auth/sign-out destroys session', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/auth/sign-out',
        headers: { cookie: sessionCookie },
      })
      expect(res.statusCode).toBe(200)

      const feedRes = await server.inject({
        method: 'GET',
        url: '/feed',
        headers: { cookie: sessionCookie },
      })
      expect(feedRes.statusCode).toBe(401)
    })
  }
)
