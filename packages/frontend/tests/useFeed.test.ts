import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useFeed } from '../src/hooks/useFeed'
import type { FeedResponse } from '../src/api/feedApi'
import type { VideoMeta } from '@goonster/shared'

vi.mock('../src/api/feedApi', () => ({
  fetchFeed: vi.fn(),
}))

import { fetchFeed } from '../src/api/feedApi'
const mockFetchFeed = fetchFeed as ReturnType<typeof vi.fn>

function makeVideo(id: string): VideoMeta {
  return {
    id,
    filename: `${id}.mp4`,
    title: `Video ${id}`,
    duration: 10,
    mimeType: 'video/mp4',
    size: 1000,
  }
}

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('useFeed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns empty array when no data loaded yet (initial state)', () => {
    // Never resolves — simulates loading state
    mockFetchFeed.mockImplementation(() => new Promise(() => {}))

    const { result } = renderHook(() => useFeed(), { wrapper: makeWrapper() })

    expect(result.current.allVideos).toEqual([])
  })

  it('returns allVideos as flattened array from multiple pages', async () => {
    const page1: FeedResponse = {
      data: { items: [makeVideo('a'), makeVideo('b')], nextCursor: 'cursor-2' },
      meta: { total: 4 },
    }
    const page2: FeedResponse = {
      data: { items: [makeVideo('c'), makeVideo('d')], nextCursor: null },
      meta: { total: 4 },
    }

    // First call returns page1, subsequent calls return page2
    mockFetchFeed.mockResolvedValueOnce(page1)
    mockFetchFeed.mockResolvedValueOnce(page2)

    const { result } = renderHook(() => useFeed(), { wrapper: makeWrapper() })

    // Wait for initial page to load
    await waitFor(() => expect(result.current.allVideos).toHaveLength(2))

    expect(result.current.allVideos.map((v) => v.id)).toEqual(['a', 'b'])

    // Fetch next page
    result.current.fetchNextPage()

    await waitFor(() => expect(result.current.allVideos).toHaveLength(4))

    expect(result.current.allVideos.map((v) => v.id)).toEqual(['a', 'b', 'c', 'd'])
  })
})
