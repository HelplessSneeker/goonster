import React from 'react'

interface MuteButtonProps {
  isMuted: boolean
  onToggle: (e: React.MouseEvent) => void
}

export default function MuteButton({ isMuted, onToggle }: MuteButtonProps) {
  return (
    <button
      onClick={onToggle}
      aria-label={isMuted ? 'Unmute' : 'Mute'}
      className="absolute bottom-6 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center pointer-events-auto touch-manipulation text-white"
    >
      {isMuted ? (
        // Speaker with X (muted)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="28"
          height="28"
          aria-hidden="true"
        >
          <path d="M13 4.07V2a10 10 0 0 1 0 19.93v-2.07A8 8 0 0 0 13 4.07zM11 4.07A8 8 0 0 0 5.93 8H3.5A2 2 0 0 0 2 9.5v5A2 2 0 0 0 3.5 16H6l5 4V4.07zM2.71 2.71L1.29 4.13l18 18 1.41-1.41L18.59 18A9.95 9.95 0 0 1 13 19.93V21a11 11 0 0 1-5.47-1.49L2.71 2.71z" />
        </svg>
      ) : (
        // Speaker with sound waves (unmuted)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="28"
          height="28"
          aria-hidden="true"
        >
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0 0 14 7.97v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
        </svg>
      )}
    </button>
  )
}
