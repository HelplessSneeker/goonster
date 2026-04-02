interface FloatingLabelInputProps {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  hint?: string
}

export default function FloatingLabelInput({
  id,
  label,
  type,
  value,
  onChange,
  error,
  hint,
}: FloatingLabelInputProps) {
  return (
    <div>
      <div className="relative">
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder=" "
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className="peer block w-full rounded-lg bg-white/5 border border-white/20 px-4 pt-5 pb-2 text-base text-white placeholder-transparent focus:outline-none focus:border-white min-h-[56px]"
        />
        <label
          htmlFor={id}
          className="absolute left-4 top-4 text-base text-white/50 transition-all duration-150 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-white/70 peer-not-placeholder-shown:top-1 peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:text-white/70"
        >
          {label}
        </label>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-white/40">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}
