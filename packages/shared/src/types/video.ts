export interface VideoMeta {
  id: string                // stable UUID — never a filename
  filename: string          // disk filename (internal to DiskVideoStore)
  title: string
  duration: number          // seconds
  mimeType: string          // 'video/mp4'
  size: number              // bytes
  // Future social fields (D-03):
  sourcePlatform?: 'tiktok' | 'reels' | 'youtube-shorts' | 'local'
  sharedBy?: string         // user ID of friend who shared
  sharedAt?: string         // ISO 8601
}
