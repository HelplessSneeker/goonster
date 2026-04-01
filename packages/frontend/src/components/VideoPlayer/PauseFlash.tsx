import { useState, useRef, useEffect } from 'react'

interface PauseFlashProps {
  isPlaying: boolean
}

export default function PauseFlash({ isPlaying }: PauseFlashProps) {
  const [showIcon, setShowIcon] = useState(false)
  const [visible, setVisible] = useState(false)
  const prevPlayingRef = useRef<boolean | null>(null)

  useEffect(() => {
    // Trigger only on transition from playing to paused (not on initial load)
    if (prevPlayingRef.current === true && isPlaying === false) {
      setShowIcon(true)
      setVisible(true)

      // Hold at opacity 1 for 500ms, then begin fade
      const fadeTimer = setTimeout(() => setVisible(false), 500)

      // Remove from DOM after fade completes (500ms hold + 300ms fade = 800ms)
      const removeTimer = setTimeout(() => setShowIcon(false), 800)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(removeTimer)
      }
    }

    prevPlayingRef.current = isPlaying
  }, [isPlaying])

  // Update prevPlayingRef on every render after the effect runs
  useEffect(() => {
    prevPlayingRef.current = isPlaying
  })

  if (!showIcon) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div
        className="w-20 h-20 rounded-full bg-black/50 flex items-center justify-center"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms',
        }}
      >
        <span className="text-white text-4xl ml-1">&#9654;</span>
      </div>
    </div>
  )
}
