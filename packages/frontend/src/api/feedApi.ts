import type { VideoMeta } from '@goonster/shared'

export interface FeedResponse {
  data: { items: VideoMeta[]; nextCursor: string | null }
  meta: { total: number }
}

export async function fetchFeed({ cursor, limit }: { cursor: string | null; limit: number }): Promise<FeedResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/feed?${params}`, { credentials: 'include' })
  if (!res.ok) {
    const err = new Error(`Feed fetch failed: ${res.status}`) as Error & { status: number }
    err.status = res.status
    throw err
  }
  return res.json() as Promise<FeedResponse>
}
