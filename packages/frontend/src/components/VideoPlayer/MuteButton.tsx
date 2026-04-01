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
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="28"
          height="28"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        // Speaker with sound waves (unmuted)
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          width="28"
          height="28"
          aria-hidden="true"
        >
          <path d="M11 5L6 9H2v6h4l5 4V5z" />
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
        </svg>
      )}
    </button>
  )
}
