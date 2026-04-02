import { useRef, useState, useEffect } from 'react'
import type { VideoMeta } from '@goonster/shared'
import VideoPlayer from '../VideoPlayer/VideoPlayer'
import BufferingSpinner from './BufferingSpinner'
import { useFeedStore } from '../../store/feedStore'

interface FeedSlideProps {
  video: VideoMeta
  isActive: boolean
}

export default function FeedSlide({ video, isActive }: FeedSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isBuffering, setIsBuffering] = useState(false)

  useEffect(() => {
    const videoEl = containerRef.current?.querySelector('video')
    if (!videoEl) return

    // Set preload based on active state (D-04, FEED-04)
    videoEl.preload = isActive ? 'auto' : 'metadata'

    // Buffering event listeners (D-06, D-07, RESEARCH.md Pattern 3)
    const onWaiting = () => setIsBuffering(true)
    const onCanPlay = () => setIsBuffering(false)
    const onPlaying = () => setIsBuffering(false)
    videoEl.addEventListener('waiting', onWaiting)
    videoEl.addEventListener('canplay', onCanPlay)
    videoEl.addEventListener('playing', onPlaying)

    // Play/pause coordination based on active state
    if (isActive) {
      const { isMuted } = useFeedStore.getState()
      videoEl.muted = isMuted
      videoEl.play().catch(() => {})
    } else {
      videoEl.pause()
    }

    return () => {
      videoEl.removeEventListener('waiting', onWaiting)
      videoEl.removeEventListener('canplay', onCanPlay)
      videoEl.removeEventListener('playing', onPlaying)
    }
  }, [isActive])

  return (
    <div ref={containerRef} className="h-full w-full relative">
      <VideoPlayer video={video} />
      {isActive && isBuffering && <BufferingSpinner />}
    </div>
  )
}
