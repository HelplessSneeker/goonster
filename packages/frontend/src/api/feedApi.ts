import type { VideoMeta } from '@goonster/shared'

export interface FeedResponse {
  data: { items: VideoMeta[]; nextCursor: string | null }
  meta: { total: number }
}

export async function fetchFeed(limit = 1): Promise<FeedResponse> {
  const res = await fetch(`/feed?limit=${limit}`)
  if (!res.ok) throw new Error(`Feed fetch failed: ${res.status}`)
  return res.json() as Promise<FeedResponse>
}
