import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { fromNodeHeaders } from 'better-auth/node'
import { auth } from '../auth.js'
import type { VideoStore } from '../store/VideoStore.js'
import { getPage } from '../services/feedService.js'

const QuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
})

export async function feedRoutes(
  fastify: FastifyInstance,
  options: { store: VideoStore; skipAuth?: boolean },
) {
  if (!options.skipAuth) {
    fastify.addHook('preHandler', async (request, reply) => {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(request.headers),
      })
      if (!session) {
        reply.status(401).send({ error: 'Unauthorized' })
      }
    })
  }

  fastify.get('/feed', async (request, reply) => {
    const parsed = QuerySchema.safeParse(request.query)
    if (!parsed.success) {
      return reply.status(400).send({
        error: { code: 'INVALID_QUERY', message: parsed.error.message },
      })
    }
    const { cursor, limit } = parsed.data
    try {
      const page = await getPage(options.store, cursor ?? null, limit)
      return reply.send({
        data: {
          items: page.items,
          nextCursor: page.nextCursor,
        },
        meta: { total: page.total },
      })
    } catch (err) {
      if (err instanceof Error && err.message.includes('Invalid cursor')) {
        return reply.status(400).send({
          error: { code: 'INVALID_CURSOR', message: err.message },
        })
      }
      throw err
    }
  })
}
