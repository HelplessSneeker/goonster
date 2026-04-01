import type { VideoStore } from '../../src/store/VideoStore.js'
import type { VideoMeta } from '@goonster/shared'
import { Readable } from 'node:stream'

export class MockVideoStore implements VideoStore {
  constructor(private readonly items: VideoMeta[] = []) {}

  async listVideos(): Promise<VideoMeta[]> {
    return this.items
  }

  async getSize(id: string): Promise<number> {
    const m = this.items.find(v => v.id === id)
    return m?.size ?? 1024
  }

  createReadStream(_id: string, _range: { start: number; end: number }): NodeJS.ReadableStream {
    return Readable.from(Buffer.alloc(1024))
  }
}
