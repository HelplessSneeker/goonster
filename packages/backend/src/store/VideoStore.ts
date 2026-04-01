import type { VideoMeta } from '@goonster/shared'

export interface VideoStore {
  listVideos(): Promise<VideoMeta[]>
  getSize(id: string): Promise<number>
  createReadStream(id: string, range: { start: number; end: number }): NodeJS.ReadableStream
}

export type { VideoMeta }
