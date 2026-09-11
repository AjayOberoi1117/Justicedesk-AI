import { Navigate } from 'react-router-dom'
import { useAppStore } from '../store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const productMode = useAppStore(s => s.productMode)
  const authState = useAppStore(s => s.authState[s.productMode!])

  if (!productMode) {
    return <Navigate to="/login" />
  }

  if (!authState?.isAuthenticated) {
    return <Navigate to="/login" />
  }

  return <>{children}</>
}
