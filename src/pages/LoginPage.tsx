import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import { MatrixRain } from '@/shared/ui/MatrixRain'
import { ScanLines } from '@/shared/ui/ScanLines'
import { Eye, EyeOff, LogIn, UserPlus, AlertTriangle, MessageCircle } from 'lucide-react'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE || `http://${window.location.hostname}:4242`

export function LoginPage() {
  const { login, loginWithTelegram, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'password' | 'telegram'>('password')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [tgId, setTgId] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'password') {
      clearError()
      const ok = await login(username, password)
      if (ok) navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative flex items-center justify-center p-4">
      <MatrixRain opacity={0.06} />
      <ScanLines />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-orbitron font-bold text-2xl tracking-wider text-cyber-text">
            NO FACE<span className="text-cyber-red"> // </span>CHECKER
          </h1>
          <p className="text-sm text-cyber-text-muted mt-2">Access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm p-6 space-y-4">
          {/* Mode tabs */}
          <div className="flex rounded-lg border border-cyber-border overflow-hidden text-xs">
            <button
              type="button"
              onClick={() => setMode('password')}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors ${mode === 'password' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-cyber-text-muted hover:text-cyber-text'}`}
            >
              <LogIn size={13} />
              Password
            </button>
            <button
              type="button"
              onClick={() => setMode('telegram')}
              className={`flex-1 py-2 flex items-center justify-center gap-1.5 transition-colors ${mode === 'telegram' ? 'bg-cyber-blue/20 text-cyber-blue' : 'text-cyber-text-muted hover:text-cyber-text'}`}
            >
              <MessageCircle size={13} />
              Telegram
            </button>
          </div>

          {mode === 'password' && (
            <>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-red/10 border border-cyber-red/40 text-sm text-cyber-red">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs text-cyber-text-muted mb-1">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
                  placeholder="Enter your username"
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
                    placeholder="Enter your password"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-text-muted hover:text-cyber-text">
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !username || !password}
                className="w-full py-2.5 bg-cyber-blue/20 border border-cyber-blue/50 rounded-lg text-sm text-cyber-blue hover:bg-cyber-blue/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-cyber-blue border-t-transparent rounded-full" /> : <LogIn size={14} />}
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </>
          )}

          {mode === 'telegram' && (
            <>
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyber-red/10 border border-cyber-red/40 text-sm text-cyber-red">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <p className="text-xs text-cyber-text-muted leading-relaxed">
                Send <span className="text-cyber-green">/start</span> to{' '}
                <span className="text-cyber-blue">@NoFaceCheckerBot</span> on Telegram to get your Telegram ID, then enter it below.
              </p>

              <div>
                <label className="block text-xs text-cyber-text-muted mb-1">Telegram ID</label>
                <input
                  type="text"
                  value={tgId}
                  onChange={(e) => setTgId(e.target.value)}
                  className="w-full px-3 py-2 bg-cyber-black border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted focus:outline-none focus:border-cyber-blue"
                  placeholder="Enter your Telegram ID"
                  autoFocus
                />
              </div>

              <button
                type="button"
                onClick={async () => {
                  clearError()
                  const ok = await loginWithTelegram(tgId.trim())
                  if (ok) navigate('/dashboard')
                }}
                disabled={loading || !tgId.trim()}
                className="w-full py-2.5 bg-cyber-green/20 border border-cyber-green/50 rounded-lg text-sm text-cyber-green hover:bg-cyber-green/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <span className="animate-spin w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full" /> : <MessageCircle size={14} />}
                {loading ? 'Logging in...' : 'Login with Telegram'}
              </button>
            </>
          )}

          <p className="text-xs text-center text-cyber-text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyber-blue hover:underline">Register</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
