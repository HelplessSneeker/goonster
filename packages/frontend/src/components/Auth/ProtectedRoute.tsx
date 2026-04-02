import { Navigate } from 'react-router'
import { useSession } from '../../auth/client'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()

  if (isPending) return null // Black screen during hydration — D-09: no flash of feed content
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}
