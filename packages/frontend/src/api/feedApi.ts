import type { VideoMeta } from '@goonster/shared'

export interface FeedResponse {
  data: { items: VideoMeta[]; nextCursor: string | null }
  meta: { total: number }
}

export async function fetchFeed({ cursor, limit }: { cursor: string | null; limit: number }): Promise<FeedResponse> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/feed?${params}`)
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  return res.json() as Promise<FeedResponse>
}
