import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeed } from '../api/feedApi'
import type { VideoMeta } from '@goonster/shared'

export function useFeed() {
  const query = useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: ({ pageParam }) => fetchFeed({ cursor: pageParam ?? null, limit: 10 }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.data.nextCursor ?? undefined,
  })

  const allVideos: VideoMeta[] = query.data?.pages.flatMap((page) => page.data.items) ?? []

  return { ...query, allVideos }
}
