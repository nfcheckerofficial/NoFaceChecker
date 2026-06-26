import { useEffect } from 'react'
import { BrowserRouter as Router, useNavigate } from 'react-router-dom'
import { AppRoutes } from './routes'
import { ScanLines } from '@/shared/ui/ScanLines'

function AdminRedirect() {
  const navigate = useNavigate()
  useEffect(() => {
    if (window.location.hostname.startsWith('admin.')) {
      navigate('/dashboard/admin/control-panel', { replace: true })
    }
  }, [navigate])
  return null
}

function App() {
  return (
    <Router>
      <AdminRedirect />
      <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative overflow-x-hidden">
        <ScanLines />
        <AppRoutes />
      </div>
    </Router>
  )
}

export default App
