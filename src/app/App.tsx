import { useEffect, useState } from 'react'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { AppRoutes } from './routes'
import { ScanLines } from '@/shared/ui/ScanLines'
import { ErrorBoundary } from '@/shared/ui/ErrorBoundary'
import { useAuthStore } from '@/features/auth/authStore'

function AuthInit() {
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const token = useAuthStore((s) => s.token)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (token) {
      checkAuth().finally(() => setReady(true))
    } else {
      setReady(true)
    }
  }, [])

  if (!ready) return null
  return null
}

function AdminRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    if (
      window.location.hostname.startsWith('admin.') &&
      (window.location.pathname === '/' || window.location.pathname === '')
    ) {
      navigate('/dashboard/admin/control-panel', { replace: true })
    }
  }, [navigate])
  return null
}

function AppContent() {
  const { token, user } = useAuthStore(useShallow((s) => ({ token: s.token, user: s.user })))
  const ready = token ? user !== null : true

  if (!ready) {
    return (
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-cyber-red/20 via-transparent to-cyber-blue/20 animate-pulse" />
        <div className="relative z-10">
          <div className="animate-[pulseNeon_2s_ease-in-out_infinite] text-cyber-red text-2xl font-bold mb-4">[CHK] NO FACE CLAN</div>
          <div className="animate-pulse text-cyber-text-muted text-sm">Initializing secure system...</div>
          <div className="mt-4 w-48 h-1 bg-cyber-panel rounded-full overflow-hidden">
            <div className="h-full bg-cyber-red animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <AdminRedirect />
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative overflow-x-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-red/10 via-transparent to-transparent animate-pulse" />
        <ScanLines />
        <AppRoutes />
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <ErrorBoundary>
        <AuthInit />
        <AppContent />
      </ErrorBoundary>
    </Router>
  )
}

export default App
