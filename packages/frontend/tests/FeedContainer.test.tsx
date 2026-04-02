import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import FeedContainer from '../src/components/Feed/FeedContainer'
import type { VideoMeta } from '@goonster/shared'

// Mock Swiper to render simple divs that pass through props for assertion
vi.mock('swiper/react', () => ({
  Swiper: ({ children, ...props }: any) => (
    <div
      data-testid="swiper"
      data-direction={props.direction}
      data-speed={String(props.speed)}
      data-resistance={String(props.resistance)}
    >
      {children}
    </div>
  ),
  SwiperSlide: ({ children }: any) => <div data-testid="swiper-slide">{children}</div>,
}))
vi.mock('swiper/modules', () => ({ Mousewheel: {} }))
vi.mock('swiper/css', () => ({}))

// Mock useFeed hook
vi.mock('../src/hooks/useFeed', () => ({
  useFeed: vi.fn(),
}))

// Mock FeedSlide to avoid video element complexity
vi.mock('../src/components/Feed/FeedSlide', () => ({
  default: ({ video }: { video: VideoMeta }) => (
    <div data-testid="feed-slide">{video.title}</div>
  ),
}))

import { useFeed } from '../src/hooks/useFeed'

const mockVideos: VideoMeta[] = [
  { id: '1', filename: 'video1.mp4', title: 'Video 1', duration: 10, mimeType: 'video/mp4', size: 1000 },
  { id: '2', filename: 'video2.mp4', title: 'Video 2', duration: 10, mimeType: 'video/mp4', size: 1000 },
]

function renderFeedContainer() {
  const queryClient = new QueryClient()
  return render(
    <QueryClientProvider client={queryClient}>
      <FeedContainer />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.mocked(useFeed).mockReturnValue({
    allVideos: mockVideos,
    fetchNextPage: vi.fn(),
    hasNextPage: false,
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
    isFetching: false,
    isFetchingNextPage: false,
    status: 'success',
    fetchStatus: 'idle',
    isSuccess: true,
    isLoading: false,
    isRefetching: false,
    isFetchedAfterMount: true,
    isFetched: true,
    isLoadingError: false,
    isRefetchError: false,
    isPlaceholderData: false,
    dataUpdatedAt: 0,
    errorUpdatedAt: 0,
    failureCount: 0,
    failureReason: null,
    refetch: vi.fn(),
    fetchPreviousPage: vi.fn(),
    hasPreviousPage: false,
    isFetchingPreviousPage: false,
  } as any)
})

describe('FeedContainer', () => {
  it('Test 1 (FEED-01, FEED-02): Swiper renders with direction="vertical" prop', () => {
    const { getByTestId } = renderFeedContainer()
    const swiper = getByTestId('swiper')
    expect(swiper.getAttribute('data-direction')).toBe('vertical')
  })

  it('Test 2 (FEED-03): Swiper has speed=250 and resistance=false', () => {
    const { getByTestId } = renderFeedContainer()
    const swiper = getByTestId('swiper')
    expect(swiper.getAttribute('data-speed')).toBe('250')
    expect(swiper.getAttribute('data-resistance')).toBe('false')
  })

  it('Test 3 (FEED-06): EndOfFeedSlide is rendered as the last slide', () => {
    const { getByText } = renderFeedContainer()
    expect(getByText("You've seen everything")).toBeTruthy()
  })

  it('Test 4: Loading state shows "Loading..." text when isPending', () => {
    vi.mocked(useFeed).mockReturnValue({
      allVideos: [],
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isPending: true,
      isError: false,
    } as any)
    const { getByText } = renderFeedContainer()
    expect(getByText('Loading...')).toBeTruthy()
  })

  it('Test 5: Empty state shows "No videos available" when allVideos is empty', () => {
    vi.mocked(useFeed).mockReturnValue({
      allVideos: [],
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isPending: false,
      isError: false,
    } as any)
    const { getByText } = renderFeedContainer()
    expect(getByText('No videos available')).toBeTruthy()
  })
})
