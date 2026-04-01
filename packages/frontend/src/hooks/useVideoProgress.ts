import { useState, useEffect, type RefObject } from 'react'

export function useVideoProgress(videoRef: RefObject<HTMLVideoElement | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handler = () => {
      if (video.duration > 0) {
        setProgress(video.currentTime / video.duration)
      }
    }

    video.addEventListener('timeupdate', handler)
    return () => video.removeEventListener('timeupdate', handler)
  }, [videoRef])

  return progress
}
