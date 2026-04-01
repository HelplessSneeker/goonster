import fs from 'node:fs'
import path from 'node:path'
import type { VideoStore } from './VideoStore.js'
import type { VideoMeta } from '@goonster/shared'

export class DiskVideoStore implements VideoStore {
  constructor(
    private readonly videosDir: string,
    private readonly metadataPath: string,
  ) {}

  async listVideos(): Promise<VideoMeta[]> {
    const raw = await fs.promises.readFile(this.metadataPath, 'utf-8')
    return JSON.parse(raw) as VideoMeta[]
  }

  async getSize(id: string): Promise<number> {
    const meta = await this.findMeta(id)
    const stat = await fs.promises.stat(path.join(this.videosDir, meta.filename))
    return stat.size
  }

  createReadStream(id: string, range: { start: number; end: number }): NodeJS.ReadableStream {
    const all = JSON.parse(fs.readFileSync(this.metadataPath, 'utf-8')) as VideoMeta[]
    const meta = all.find(v => v.id === id)
    if (!meta) throw new Error(`Video not found: ${id}`)
    return fs.createReadStream(path.join(this.videosDir, meta.filename), range)
  }

  private async findMeta(id: string): Promise<VideoMeta> {
    const all = await this.listVideos()
    const found = all.find(v => v.id === id)
    if (!found) throw new Error(`Video not found: ${id}`)
    return found
  }
}
