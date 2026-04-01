interface ProgressBarProps {
  progress: number // 0-1 float
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/30 pointer-events-none">
      <div
        className="h-full bg-white transition-[width] duration-100 ease-linear"
        style={{ width: `${progress * 100}%` }}
      />
    </div>
  )
}
