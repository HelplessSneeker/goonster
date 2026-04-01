import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { DiskVideoStore } from '../src/store/DiskVideoStore.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixturesDir = path.join(__dirname, '../fixtures')
const videosDir = path.join(fixturesDir, 'videos')
const metadataPath = path.join(fixturesDir, 'metadata.json')

describe('DiskVideoStore', () => {
  const store = new DiskVideoStore(videosDir, metadataPath)

  describe('listVideos()', () => {
    it('returns an array of 3 items from fixtures/metadata.json', async () => {
      const videos = await store.listVideos()
      expect(videos).toHaveLength(3)
    })

    it('each item has the required VideoMeta fields', async () => {
      const videos = await store.listVideos()
      for (const video of videos) {
        expect(video).toHaveProperty('id')
        expect(video).toHaveProperty('filename')
        expect(video).toHaveProperty('title')
        expect(video).toHaveProperty('duration')
        expect(video).toHaveProperty('mimeType')
        expect(video).toHaveProperty('size')
        expect(typeof video.id).toBe('string')
        expect(typeof video.filename).toBe('string')
        expect(typeof video.title).toBe('string')
        expect(typeof video.duration).toBe('number')
        expect(typeof video.mimeType).toBe('string')
        expect(typeof video.size).toBe('number')
      }
    })

    it('first item has the expected id', async () => {
      const videos = await store.listVideos()
      expect(videos[0]!.id).toBe('a1b2c3d4-e5f6-7890-abcd-ef1234567801')
    })
  })

  describe('getSize()', () => {
    it('returns a positive number for a known fixture video id', async () => {
      const size = await store.getSize('a1b2c3d4-e5f6-7890-abcd-ef1234567801')
      expect(size).toBeGreaterThan(0)
    })

    it('returns the actual file size', async () => {
      const size = await store.getSize('a1b2c3d4-e5f6-7890-abcd-ef1234567801')
      expect(size).toBe(5995)
    })

    it('throws for a non-existent video id', async () => {
      await expect(store.getSize('nonexistent-id')).rejects.toThrow('Video not found: nonexistent-id')
    })
  })
})
