interface AuthCardProps {
  title: string
  children: React.ReactNode
}

export default function AuthCard({ title, children }: AuthCardProps) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-sm rounded-2xl bg-zinc-900 p-6">
        <h1 className="mb-6 text-xl font-semibold text-white">{title}</h1>
        {children}
      </div>
    </div>
  )
}
