import { useNavigate } from 'react-router'
import { signOut } from '../../auth/client'

export default function LogoutButton() {
  const navigate = useNavigate()

  async function handleLogout() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="absolute top-4 right-4 z-50 rounded-full bg-black/50 px-3 py-1.5 text-sm text-white/70 backdrop-blur-sm hover:text-white transition-colors min-h-[44px]"
      aria-label="Log out"
    >
      Log out
    </button>
  )
}
