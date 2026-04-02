export default function BufferingSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="w-10 h-10 rounded-full border-4 border-white/30 border-t-white animate-spin" />
    </div>
  )
}
