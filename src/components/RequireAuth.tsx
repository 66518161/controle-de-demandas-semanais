import { Navigate } from 'react-router-dom'
import { useAppStore } from '@/stores/use-app-store'

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
