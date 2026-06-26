import { useEffect, useState } from 'react'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ScanLines } from '@/shared/ui/ScanLines'
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
  const { token, user } = useAuthStore()
  const ready = token ? user !== null : true

  if (!ready) {
    return (
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono flex items-center justify-center">
        <div className="animate-pulse text-cyber-text-muted text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <AdminRedirect />
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative overflow-x-hidden">
        <ScanLines />
        <AppRoutes />
      </div>
    </>
  )
}

function App() {
  return (
    <Router>
      <AuthInit />
      <AppContent />
    </Router>
  )
}

export default App
