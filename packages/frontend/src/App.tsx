import { useQuery } from '@tanstack/react-query'
import { fetchFeed } from './api/feedApi'

export default function App() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['feed', 1],
    queryFn: () => fetchFeed(1),
  })

  if (isLoading) {
    return (
      <div className="fullscreen-container bg-black flex items-center justify-center">
        <span className="text-white text-base">Loading...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fullscreen-container bg-black flex items-center justify-center">
        <span className="text-white text-sm font-semibold">
          Could not load video. Check your connection and try again.
        </span>
      </div>
    )
  }

  const video = data?.data.items[0]
  if (!video) {
    return (
      <div className="fullscreen-container bg-black flex items-center justify-center flex-col gap-2">
        <span className="text-white text-base">No videos available</span>
        <span className="text-white/60 text-sm">
          Check back later or verify the backend is running.
        </span>
      </div>
    )
  }

  // VideoPlayer component wired in Plan 02
  return (
    <div className="fullscreen-container bg-black flex items-center justify-center">
      <span className="text-white text-base">Video: {video.title}</span>
    </div>
  )
}
