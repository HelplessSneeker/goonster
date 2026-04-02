import { useSession } from '../auth/client'
import LogoutButton from '../components/Auth/LogoutButton'

export default function ProfilePage() {
  const { data: session } = useSession()

  return (
    <div className="min-h-dvh bg-black text-white p-6">
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      {session?.user && (
        <div className="space-y-2">
          <p className="text-white/60">
            <span className="text-white">{session.user.name}</span>
          </p>
          <p className="text-white/60">
            <span className="text-white">{session.user.email}</span>
          </p>
        </div>
      )}
      <p className="mt-6 text-sm text-white/40">Profile management coming in Phase 5.</p>
      <LogoutButton />
    </div>
  )
}
