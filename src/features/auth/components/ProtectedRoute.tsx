import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}
