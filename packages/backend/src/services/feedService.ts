import type { VideoStore } from '../store/VideoStore.js'
import type { VideoMeta } from '@goonster/shared'

export interface FeedPage {
  items: VideoMeta[]
  nextCursor: string | null
  total: number
}

export function encodeCursor(lastId: string): string {
  return Buffer.from(lastId).toString('base64url')
}

export function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64url').toString('utf8')
}

export async function getPage(
  store: VideoStore,
  cursor: string | null,
  limit: number = 10
): Promise<FeedPage> {
  const all = await store.listVideos()
  let startIndex = 0
  if (cursor) {
    const lastId = decodeCursor(cursor)
    const idx = all.findIndex(v => v.id === lastId)
    if (idx === -1) {
      throw new Error(`Invalid cursor: video not found`)
    }
    startIndex = idx + 1
  }
  const items = all.slice(startIndex, startIndex + limit)
  const lastItem = items.at(-1)
  return {
    items,
    nextCursor: lastItem && startIndex + limit < all.length
      ? encodeCursor(lastItem.id)
      : null,
    total: all.length,
  }
}
