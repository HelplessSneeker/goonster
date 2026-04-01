import { useState, useRef, useEffect } from 'react'

interface PauseFlashProps {
  isPlaying: boolean
}

export default function PauseFlash({ isPlaying }: PauseFlashProps) {
  const [showIcon, setShowIcon] = useState(false)
  const [visible, setVisible] = useState(false)
  const [icon, setIcon] = useState<'play' | 'pause'>('pause')
  const prevPlayingRef = useRef<boolean | null>(null)

  useEffect(() => {
    const prev = prevPlayingRef.current
    prevPlayingRef.current = isPlaying

    // Skip initial mount
    if (prev === null) return

    // Trigger on any play/pause transition
    if (prev !== isPlaying) {
      setIcon(isPlaying ? 'play' : 'pause')
      setShowIcon(true)
      setVisible(true)

      const fadeTimer = setTimeout(() => setVisible(false), 500)
      const removeTimer = setTimeout(() => setShowIcon(false), 800)

      return () => {
        clearTimeout(fadeTimer)
        clearTimeout(removeTimer)
      }
    }
  }, [isPlaying])

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
        {icon === 'play' ? (
          <span className="text-white text-4xl ml-1">&#9654;</span>
        ) : (
          <span className="text-white text-4xl">&#9646;&#9646;</span>
        )}
      </div>
    </div>
  )
}
