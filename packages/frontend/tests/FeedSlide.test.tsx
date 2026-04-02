import { render, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FeedSlide from '../src/components/Feed/FeedSlide'
import type { VideoMeta } from '@goonster/shared'

// Mock VideoPlayer to render a simple video element for testing
vi.mock('../src/components/VideoPlayer/VideoPlayer', () => ({
  default: ({ video }: { video: VideoMeta }) => (
    <video data-testid="video-player" src={`/video/${video.filename}`} />
  ),
}))

const mockVideo: VideoMeta = {
  id: 'test-uuid',
  filename: 'test-video.mp4',
  title: 'Test Video',
  duration: 10,
  mimeType: 'video/mp4',
  size: 1000,
}

function renderFeedSlide(isActive: boolean) {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <FeedSlide video={mockVideo} isActive={isActive} />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
})

describe('FeedSlide', () => {
  it('Test 6 (FEED-04): non-active slide video has preload="metadata"', () => {
    const { container } = renderFeedSlide(false)
    const video = container.querySelector('video')!
    expect(video).toBeTruthy()
    expect(video.preload).toBe('metadata')
  })

  it('Test 7 (FEED-05): BufferingSpinner renders when video fires "waiting" event', async () => {
    const { container, queryByTestId } = renderFeedSlide(true)
    const video = container.querySelector('video')!

    // Initially no spinner
    expect(container.querySelector('.animate-spin')).toBeNull()

    // Fire waiting event to trigger buffering
    await act(async () => {
      video.dispatchEvent(new Event('waiting'))
    })

    // Spinner should now appear
    expect(container.querySelector('.animate-spin')).toBeTruthy()
  })
})
