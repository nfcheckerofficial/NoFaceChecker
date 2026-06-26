import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import { MatrixRain } from '@/shared/ui/MatrixRain'
import { ScanLines } from '@/shared/ui/ScanLines'
import { Eye, EyeOff, UserPlus, AlertTriangle } from 'lucide-react'

export function RegisterPage() {
  const { register, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [localErr, setLocalErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalErr('')
    if (password !== confirm) { setLocalErr('Passwords do not match'); return }
    if (username.length < 3) { setLocalErr('Username must be at least 3 characters'); return }
    if (password.length < 4) { setLocalErr('Password must be at least 4 characters'); return }
    const ok = await register(username, password)
    if (ok) navigate('/dashboard')
  }

  const displayError = localErr || error

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative flex items-center justify-center p-4">
      <MatrixRain opacity={0.06} />
      <ScanLines />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-orbitron font-bold text-2xl tracking-wider text-cyber-text">
            NO FACE<span className="text-cyber-red"> // </span>CHECKER
          </h1>
          <p className="text-sm text-cyber-text-muted mt-2">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-cyber-text flex items-center gap-2">
            <UserPlus size={16} className="text-cyber-green" />
            Register
          </h2>

          {displayError && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-red/10 border border-cyber-red/40 text-sm text-cyber-red">
              <AlertTriangle size={14} />
              {displayError}
            </div>
          )}

          <div>
            <label className="block text-xs text-cyber-text-muted mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
              placeholder="Choose a username"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-cyber-text-muted mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
                placeholder="Create a password"
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-muted hover:text-cyber-text">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs text-cyber-text-muted mb-1">Confirm Password</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !username || !password || !confirm}
            className="w-full py-2.5 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? <span className="animate-spin w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full" /> : <UserPlus size={14} />}
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-xs text-center text-cyber-text-muted">
            Already have an account?{' '}
            <Link to="/login" className="text-cyber-blue hover:underline">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
