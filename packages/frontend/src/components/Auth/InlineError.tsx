interface InlineErrorProps {
  id: string
  message: string | undefined
}

export default function InlineError({ id, message }: InlineErrorProps) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1 text-sm font-semibold text-red-500">
      {message}
    </p>
  )
}
