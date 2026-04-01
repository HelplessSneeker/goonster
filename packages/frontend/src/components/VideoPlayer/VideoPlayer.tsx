import { useEffect } from 'react'
import type { VideoMeta } from '@goonster/shared'
import { useVideoPlayer } from '../../hooks/useVideoPlayer'
import { useVideoProgress } from '../../hooks/useVideoProgress'
import { resolveVideoUrl } from '../../lib/resolveVideoUrl'
import MuteButton from './MuteButton'
import ProgressBar from './ProgressBar'
import PauseFlash from './PauseFlash'

interface VideoPlayerProps {
  video: VideoMeta
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const { videoRef, isPlaying, isMuted, togglePlay, toggleMute } = useVideoPlayer()
  const progress = useVideoProgress(videoRef)

  // Guarantee autoplay starts regardless of mount timing (RESEARCH.md Open Question 3)
  useEffect(() => {
    videoRef.current?.play().catch(() => {})
  }, [video.filename, videoRef])

  return (
    <div className="fullscreen-container relative bg-black" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={resolveVideoUrl(video.filename)}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 pointer-events-none">
        <MuteButton
          isMuted={isMuted}
          onToggle={(e) => {
            e.stopPropagation()
            toggleMute()
          }}
        />
        <ProgressBar progress={progress} />
        <PauseFlash isPlaying={isPlaying} />
      </div>
    </div>
  )
}
