// Video file serving is handled by @fastify/static in server.ts
// Registered with prefix: '/video/' pointing to fixtures/videos directory
// HTTP Range requests (206 Partial Content) are handled automatically
// Do NOT disable acceptRanges — iOS Safari requires it
//
// URL pattern: GET /video/{filename} (e.g., /video/placeholder-01.mp4)
// The client constructs this URL from VideoMeta.filename

import type { FastifyInstance } from 'fastify'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'
import type { VideoStore } from '../store/VideoStore.js'

export async function videoRoutes(
  fastify: FastifyInstance,
  options: { store: VideoStore },
) {
  fastify.addHook('preHandler', async (request, reply) => {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(request.headers),
    })
    if (!session) {
      reply.status(401).send({ error: 'Unauthorized' })
    }
  })

  // Individual video metadata endpoint
  fastify.get('/video/:id/meta', async (request, reply) => {
    const { id } = request.params as { id: string }
    const videos = await options.store.listVideos()
    const video = videos.find(v => v.id === id)
    if (!video) {
      return reply.status(404).send({
        error: { code: 'NOT_FOUND', message: `Video not found: ${id}` },
      })
    }
    return reply.send({ data: video })
  })
}
