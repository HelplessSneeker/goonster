interface SubmitButtonProps {
  label: string
  isPending: boolean
}

export default function SubmitButton({ label, isPending }: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={isPending}
      aria-disabled={isPending}
      className="flex w-full items-center justify-center rounded-lg bg-white text-black font-semibold text-base min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed"
    >
      {isPending ? (
        <svg
          className="animate-spin h-5 w-5 text-black"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        label
      )}
    </button>
  )
}
