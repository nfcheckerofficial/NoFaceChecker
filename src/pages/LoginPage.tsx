import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/authStore'
import { MatrixRain } from '@/shared/ui/MatrixRain'
import { Eye, EyeOff, LogIn, UserPlus, AlertTriangle, MessageCircle, Terminal, Shield } from 'lucide-react'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''
const SERVER_URL = API_BASE || `http://${window.location.hostname}:4242`

const tabClass = (active: boolean) =>
  `flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
    active
      ? 'bg-gradient-to-r from-cyber-red/10 to-cyber-purple/10 text-cyber-red border-b-2 border-cyber-red shadow-[0_0_15px_rgba(255,0,64,0.15)]'
      : 'text-cyber-text-muted/60 border-b-2 border-transparent hover:text-cyber-text/60 hover:border-cyber-text-muted/20'
  }`

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
    <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative flex items-center justify-center p-4 overflow-hidden">
      <MatrixRain opacity={0.05} />

      {/* ambient glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-red/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyber-purple/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-cyber-red/20 to-cyber-purple/20 border border-cyber-red/30 mb-4 shadow-[0_0_30px_rgba(255,0,64,0.15)]">
            <Shield size={28} className="text-cyber-red" />
          </div>
          <h1 className="font-orbitron font-bold text-2xl tracking-widest text-cyber-text">
            NO FACE
          </h1>
          <p className="font-orbitron text-xs tracking-[0.3em] text-cyber-red mt-1">
            // CHECKER
          </p>
          <p className="text-xs text-cyber-text-muted/70 mt-4 tracking-wide">Access your dashboard</p>
        </div>

        <div className="relative rounded-xl bg-gradient-to-br from-cyber-red/20 via-cyber-purple/10 to-cyber-blue/10 p-[1px] shadow-[0_0_40px_rgba(255,0,64,0.1)]">
          <div className="rounded-xl bg-cyber-black/95 backdrop-blur-xl p-6 sm:p-8 space-y-6">
            {/* Mode tabs */}
            <div className="flex rounded-lg overflow-hidden bg-cyber-dark/80">
              <button
                type="button"
                onClick={() => { setMode('password'); clearError() }}
                className={tabClass(mode === 'password')}
              >
                <LogIn size={13} />
                Password
              </button>
              <button
                type="button"
                onClick={() => { setMode('telegram'); clearError() }}
                className={tabClass(mode === 'telegram')}
              >
                <MessageCircle size={13} />
                Telegram
              </button>
            </div>

            {mode === 'password' && (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-gradient-to-r from-cyber-red/10 to-cyber-red/5 border border-cyber-red/30 text-sm text-cyber-red shadow-[0_0_20px_rgba(255,0,64,0.08)]">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-cyber-text-muted/80 uppercase tracking-widest font-semibold">
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyber-red/20 to-cyber-purple/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="relative w-full px-4 py-3 bg-cyber-dark/90 border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-red/60 focus:shadow-[0_0_20px_rgba(255,0,64,0.15)] transition-all duration-300 tracking-wide"
                      placeholder="Enter your username"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-cyber-text-muted/80 uppercase tracking-widest font-semibold">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyber-red/20 to-cyber-purple/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative w-full px-4 py-3 pr-11 bg-cyber-dark/90 border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-red/60 focus:shadow-[0_0_20px_rgba(255,0,64,0.15)] transition-all duration-300 tracking-wide"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cyber-text-muted/50 hover:text-cyber-text/80 transition-colors"
                    >
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="relative w-full py-3 rounded-lg text-sm font-semibold uppercase tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl" />
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                    {loading ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn size={15} />
                        Sign In
                      </>
                    )}
                  </span>
                </button>
              </form>
            )}

            {mode === 'telegram' && (
              <div className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-gradient-to-r from-cyber-red/10 to-cyber-red/5 border border-cyber-red/30 text-sm text-cyber-red shadow-[0_0_20px_rgba(255,0,64,0.08)]">
                    <AlertTriangle size={15} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="p-4 rounded-lg bg-gradient-to-r from-cyber-green/5 to-cyber-blue/5 border border-cyber-green/20 text-xs text-cyber-text-muted leading-relaxed space-y-2">
                  <div className="flex items-center gap-2 text-cyber-green text-xs uppercase tracking-widest font-semibold">
                    <Terminal size={13} />
                    Instructions
                  </div>
                  <p>
                    Send <span className="text-cyber-green font-semibold">/id</span> to{' '}
                    <span className="text-cyber-blue font-semibold">@NoFaceCheckerBot</span>{' '}
                    on Telegram to get your ID, then enter it below.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[11px] text-cyber-text-muted/80 uppercase tracking-widest font-semibold">
                    Telegram ID
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyber-green/20 to-cyber-blue/20 opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm" />
                    <input
                      type="text"
                      value={tgId}
                      onChange={(e) => setTgId(e.target.value)}
                      className="relative w-full px-4 py-3 bg-cyber-dark/90 border border-cyber-border rounded-lg text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-green/60 focus:shadow-[0_0_20px_rgba(0,255,136,0.15)] transition-all duration-300 tracking-wide"
                      placeholder="Enter your Telegram ID"
                      autoFocus
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    clearError()
                    const ok = await loginWithTelegram(tgId.trim())
                    if (ok) navigate('/dashboard')
                  }}
                  disabled={loading || !tgId.trim()}
                  className="relative w-full py-3 rounded-lg text-sm font-semibold uppercase tracking-widest transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed overflow-hidden group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-green opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-green opacity-0 group-hover:opacity-40 transition-opacity duration-500 blur-xl" />
                  <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                    {loading ? (
                      <>
                        <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        <MessageCircle size={15} />
                        Login with Telegram
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}

            <div className="pt-2 border-t border-cyber-border/40">
              <p className="text-xs text-center text-cyber-text-muted/60">
                Don't have an account?{' '}
                <Link to="/register" className="text-cyber-red hover:text-cyber-red/80 hover:underline transition-colors font-semibold tracking-wider">
                  Register
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
