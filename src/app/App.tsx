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

function App() {
  return (
    <Router>
      <AuthInit />
      <AdminRedirect />
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative overflow-x-hidden">
        <ScanLines />
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App
