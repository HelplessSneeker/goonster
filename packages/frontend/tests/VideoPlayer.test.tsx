import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import VideoPlayer from '../src/components/VideoPlayer/VideoPlayer'
import type { VideoMeta } from '@goonster/shared'

const mockVideo: VideoMeta = {
  id: 'test-uuid',
  filename: 'test-video.mp4',
  title: 'Test Video',
  duration: 10,
  mimeType: 'video/mp4',
  size: 1000,
}

function renderVideoPlayer() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <VideoPlayer video={mockVideo} />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
})

describe('VideoPlayer', () => {
  it('PLAY-01: renders video with object-cover for fullscreen fill', () => {
    const { container } = renderVideoPlayer()
    const video = container.querySelector('video')
    expect(video).toBeTruthy()
    expect(video!.classList.contains('object-cover')).toBe(true)
    expect(video!.classList.contains('w-full')).toBe(true)
    expect(video!.classList.contains('h-full')).toBe(true)
  })

  it('PLAY-02: video has autoPlay, muted, playsInline attributes', () => {
    const { container } = renderVideoPlayer()
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('autoplay')
    expect(video.muted).toBe(true)
    expect(video).toHaveAttribute('playsinline')
  })

  it('PLAY-05: video has loop attribute', () => {
    const { container } = renderVideoPlayer()
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('loop')
  })

  it('MOBL-01: container uses fullscreen-container class', () => {
    const { container } = renderVideoPlayer()
    expect(container.firstChild).toHaveClass('fullscreen-container')
  })

  it('MOBL-02: video has playsInline attribute', () => {
    const { container } = renderVideoPlayer()
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('playsinline')
  })

  it('MOBL-04: only one video element rendered', () => {
    const { container } = renderVideoPlayer()
    expect(container.querySelectorAll('video')).toHaveLength(1)
  })

  it('PLAY-04: clicking container calls video.pause when playing', async () => {
    const { container } = renderVideoPlayer()
    const video = container.querySelector('video')!
    const pauseMock = vi.fn()
    HTMLMediaElement.prototype.pause = pauseMock

    // Simulate video is playing (paused = false)
    Object.defineProperty(video, 'paused', { get: () => false, configurable: true })

    const containerDiv = container.firstChild as HTMLElement
    containerDiv.click()

    expect(pauseMock).toHaveBeenCalled()
  })

  it('Video src uses resolveVideoUrl: src attribute contains /video/ + fixture filename', () => {
    const { container } = renderVideoPlayer()
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('src', '/video/test-video.mp4')
  })
})
