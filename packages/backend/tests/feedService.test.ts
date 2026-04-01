import { describe, it, expect } from 'vitest'
import { getPage, encodeCursor, decodeCursor } from '../src/services/feedService.js'
import { MockVideoStore } from './fixtures/MockVideoStore.js'
import type { VideoMeta } from '@goonster/shared'

function makeVideo(id: string, index: number): VideoMeta {
  return {
    id,
    filename: `video-${index}.mp4`,
    title: `Video ${index}`,
    duration: 10,
    mimeType: 'video/mp4',
    size: 1024,
    sourcePlatform: 'local',
  }
}

const VIDEOS: VideoMeta[] = [
  makeVideo('id-01', 1),
  makeVideo('id-02', 2),
  makeVideo('id-03', 3),
  makeVideo('id-04', 4),
  makeVideo('id-05', 5),
]

describe('encodeCursor / decodeCursor', () => {
  it('round-trips correctly', () => {
    const id = 'some-uuid-12345'
    expect(decodeCursor(encodeCursor(id))).toBe(id)
  })

  it('produces different cursors for different ids', () => {
    expect(encodeCursor('id-01')).not.toBe(encodeCursor('id-02'))
  })
})

describe('getPage()', () => {
  it('returns first 2 items and a non-null nextCursor when cursor is null', async () => {
    const store = new MockVideoStore(VIDEOS)
    const page = await getPage(store, null, 2)

    expect(page.items).toHaveLength(2)
    expect(page.items[0]!.id).toBe('id-01')
    expect(page.items[1]!.id).toBe('id-02')
    expect(page.nextCursor).not.toBeNull()
    expect(page.total).toBe(5)
  })

  it('returns next page when cursor is provided', async () => {
    const store = new MockVideoStore(VIDEOS)
    const page1 = await getPage(store, null, 2)
    const page2 = await getPage(store, page1.nextCursor!, 2)

    expect(page2.items).toHaveLength(2)
    expect(page2.items[0]!.id).toBe('id-03')
    expect(page2.items[1]!.id).toBe('id-04')
    expect(page2.nextCursor).not.toBeNull()
  })

  it('returns nextCursor: null on the last page', async () => {
    const store = new MockVideoStore(VIDEOS)
    const page1 = await getPage(store, null, 2)
    const page2 = await getPage(store, page1.nextCursor!, 2)
    const page3 = await getPage(store, page2.nextCursor!, 2)

    expect(page3.items).toHaveLength(1)
    expect(page3.items[0]!.id).toBe('id-05')
    expect(page3.nextCursor).toBeNull()
  })

  it('returns nextCursor: null when exactly last item is fetched', async () => {
    const store = new MockVideoStore(VIDEOS)
    const page = await getPage(store, null, 5)

    expect(page.items).toHaveLength(5)
    expect(page.nextCursor).toBeNull()
  })

  it('cursor is stable when a new video is inserted at position 0', async () => {
    // Get a cursor that points after id-02
    const storeInitial = new MockVideoStore(VIDEOS)
    const page1 = await getPage(storeInitial, null, 2)
    const cursorAfterIdTwo = page1.nextCursor!
    expect(cursorAfterIdTwo).not.toBeNull()

    // Insert a new video at the beginning of the list
    const newVideo = makeVideo('id-00-new', 0)
    const videosWithInserted: VideoMeta[] = [newVideo, ...VIDEOS]
    const storeWithInserted = new MockVideoStore(videosWithInserted)

    // Cursor should still find id-02 and return items after it
    const page2WithInserted = await getPage(storeWithInserted, cursorAfterIdTwo, 2)

    // Should return id-03 and id-04 (items AFTER id-02), not offset-shifted items
    expect(page2WithInserted.items[0]!.id).toBe('id-03')
    expect(page2WithInserted.items[1]!.id).toBe('id-04')
  })

  it('throws when cursor references a non-existent video id', async () => {
    const store = new MockVideoStore(VIDEOS)
    const fakeCursor = encodeCursor('nonexistent-id')

    await expect(getPage(store, fakeCursor, 2)).rejects.toThrow('Invalid cursor: video not found')
  })

  it('returns all items when limit is larger than total', async () => {
    const store = new MockVideoStore(VIDEOS)
    const page = await getPage(store, null, 100)

    expect(page.items).toHaveLength(5)
    expect(page.nextCursor).toBeNull()
  })

  it('returns empty items array when store has no videos', async () => {
    const store = new MockVideoStore([])
    const page = await getPage(store, null, 10)

    expect(page.items).toHaveLength(0)
    expect(page.nextCursor).toBeNull()
    expect(page.total).toBe(0)
  })
})
