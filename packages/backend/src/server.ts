import Fastify from 'fastify'
import staticPlugin from '@fastify/static'
import cors from '@fastify/cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { feedRoutes } from './routes/feed.js'
import { videoRoutes } from './routes/video.js'
import { DiskVideoStore } from './store/DiskVideoStore.js'
import type { VideoStore } from './store/VideoStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export function buildApp(overrides?: { store?: VideoStore }) {
  const fixturesDir = path.join(__dirname, '../fixtures')
  const store = overrides?.store ?? new DiskVideoStore(
    path.join(fixturesDir, 'videos'),
    path.join(fixturesDir, 'metadata.json'),
  )

  const server = Fastify({ logger: false })

  // Register plugins sequentially inside an async IIFE, returns a ready promise
  const ready = (async () => {
    await server.register(cors, {
      origin: process.env.NODE_ENV === 'production'
        ? ['https://goonster.app']
        : ['http://localhost:5173'],
    })

    await server.register(staticPlugin, {
      root: path.join(fixturesDir, 'videos'),
      prefix: '/video/',
      // acceptRanges defaults true — NEVER override to false (breaks iOS Safari)
    })

    await server.register(feedRoutes, { store })
    await server.register(videoRoutes, { store })
  })()

  return { server, ready }
}

// Start server when run directly (not imported for tests)
const isMain = process.argv[1] !== undefined &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isMain) {
  const { server, ready } = buildApp()
  await ready
  const port = parseInt(process.env.PORT ?? '3000', 10)
  await server.listen({ port, host: '0.0.0.0' })
  console.log(`Server listening on port ${port}`)
}

export default buildApp
