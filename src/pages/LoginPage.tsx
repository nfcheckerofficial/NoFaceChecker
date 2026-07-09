import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/features/auth/authStore'
import { MatrixRain } from '@/shared/ui/MatrixRain'
import { ScanLines } from '@/shared/ui/ScanLines'
import { Eye, EyeOff, LogIn, AlertTriangle, MessageCircle, Terminal, Shield, Activity, Users, Zap } from 'lucide-react'

const API_BASE = import.meta.env.VITE_PAYMENTS_API ?? ''

const tabClass = (active: boolean) =>
  `flex-1 py-3 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-semibold transition-all duration-300 ${
    active
      ? 'bg-gradient-to-r from-cyber-red/15 to-cyber-purple/15 text-cyber-red border-b-2 border-cyber-red shadow-[0_0_20px_rgba(255,0,64,0.2)]'
      : 'text-cyber-text-muted/50 border-b-2 border-transparent hover:text-cyber-text/70 hover:border-cyber-text-muted/20'
  }`

function Particles() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const isMobile = window.innerWidth < 640
    const colors = ['#ff0040', '#00d4ff', '#9d00ff', '#00ff88', '#ffcc00']

    const particles: { x: number; y: number; vx: number; vy: number; size: number; color: string; alpha: number }[] = []
    const count = isMobile ? 12 : 50
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        vy: (Math.random() - 0.5) * (isMobile ? 0.3 : 0.5),
        size: Math.random() * (isMobile ? 1.5 : 2) + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * (isMobile ? 0.3 : 0.5) + 0.1,
      })
    }

    let animId: number
    let lastTime = performance.now()
    const interval = isMobile ? 50 : 16

    const animate = (time: number) => {
      if (time - lastTime < interval) { animId = requestAnimationFrame(animate); return }
      lastTime = time
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach((p) => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = p.alpha
        ctx.fill()
      })
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}

export function LoginPage() {
  const { login, loginWithTelegram, loading, error, clearError } = useAuthStore(useShallow((s) => ({
    login: s.login,
    loginWithTelegram: s.loginWithTelegram,
    loading: s.loading,
    error: s.error,
    clearError: s.clearError,
  })))
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
      <MatrixRain opacity={0.04} />
      <ScanLines />
      <Particles />

      {/* Animated gradient orbs - smaller on mobile */}
      <div className="absolute top-1/3 left-1/3 w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-cyber-red/10 rounded-full blur-[80px] sm:blur-[150px] pointer-events-none motion-safe:animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/3 right-1/3 w-[200px] sm:w-[400px] h-[200px] sm:h-[400px] bg-cyber-purple/10 rounded-full blur-[60px] sm:blur-[120px] pointer-events-none motion-safe:animate-[float_10s_ease-in-out_infinite_reverse]" />
      <div className="hidden sm:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyber-blue/5 rounded-full blur-[180px] pointer-events-none motion-safe:animate-[float_12s_ease-in-out_infinite_0.5s]" />

      {/* Top status bar */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-6 py-1.5 sm:py-2 bg-cyber-black/80 backdrop-blur-md border-b border-cyber-border/30">
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1.5 text-[9px] sm:text-[11px] text-cyber-green/80">
            <span className="w-1 h-1.5 sm:w-1.5 sm:h-1.5 rounded-full bg-cyber-green motion-safe:animate-pulse shadow-[0_0_6px_rgba(0,255,136,0.5)]" />
            <span className="hidden sm:inline">SYSTEM </span>ONLINE
          </span>
          <span className="text-cyber-text-muted/30 hidden sm:inline">|</span>
          <span className="items-center gap-1.5 text-[9px] sm:text-[10px] text-cyber-text-muted/60 hidden sm:flex">
            <Users size={11} />
            42 ACTIVE
          </span>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="flex items-center gap-1 text-[9px] sm:text-[10px] text-cyber-text-muted/60">
            <Activity size={10} className="text-cyber-blue" />
            <span className="text-cyber-blue/80">SECURE</span>
          </span>
          <span className="text-cyber-text-muted/30 hidden sm:inline">|</span>
          <span className="text-[9px] sm:text-[10px] text-cyber-text-muted/60 hidden sm:block">v2.4.1</span>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-sm mt-8 sm:mt-8">
        {/* Brand section - animated logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-flex mb-3 sm:mb-5 motion-safe:animate-[float_4s_ease-in-out_infinite]">
            {/* Outer rotating gradient ring */}
            <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-gradient-to-r from-cyber-red via-cyber-purple via-cyber-blue to-cyber-red bg-[length:200%_200%] motion-safe:animate-[spin_3s_linear_infinite] opacity-80" />
            <div className="absolute -inset-2 sm:-inset-3 rounded-full bg-gradient-to-r from-cyber-red via-cyber-purple via-cyber-blue to-cyber-red bg-[length:200%_200%] motion-safe:animate-[spin_3s_linear_infinite] opacity-30 blur-lg" />
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue rounded-full blur-xl sm:blur-2xl opacity-60 motion-safe:animate-pulse" />
            {/* Shield container */}
            <div className="relative inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-cyber-red/30 via-cyber-purple/20 to-cyber-blue/20 border-2 border-cyber-red/40 shadow-[0_0_20px_rgba(255,0,64,0.25)] sm:shadow-[0_0_40px_rgba(255,0,64,0.3)] group">
              <Shield size={22} className="sm:hidden text-cyber-red drop-shadow-[0_0_8px_rgba(157,0,255,0.4)] motion-safe:animate-[flicker_2s_ease-in-out_infinite]" />
              <Shield size={34} className="hidden sm:block text-cyber-red drop-shadow-[0_0_12px_rgba(157,0,255,0.4)] motion-safe:animate-[flicker_2s_ease-in-out_infinite]" />
            </div>
          </div>
          <h1 className="font-orbitron font-black text-2xl sm:text-3xl tracking-[0.1em] sm:tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-[length:200%_auto] motion-safe:animate-[gradient_3s_ease_infinite]">
            NO FACE
          </h1>
          <p className="font-orbitron text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] text-cyber-red/90 mt-1.5 sm:mt-2 motion-safe:animate-pulse">
            // CHECKER
          </p>
          <p className="text-[10px] sm:text-xs text-cyber-text-muted/60 mt-3 sm:mt-4 tracking-wide flex items-center justify-center gap-1.5 sm:gap-2">
            <Zap size={10} className="sm:hidden text-cyber-yellow" />
            <Zap size={12} className="hidden sm:block text-cyber-yellow" />
            Access your dashboard
            <Zap size={10} className="sm:hidden text-cyber-yellow" />
            <Zap size={12} className="hidden sm:block text-cyber-yellow" />
          </p>
        </div>

        {/* Login card */}
        <div className="relative group">
          {/* Animated border glow - disabled on mobile for performance */}
          <div className="hidden sm:block absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-cyber-red via-cyber-purple via-cyber-blue to-cyber-red bg-[length:200%_200%] motion-safe:animate-[spin_4s_linear_infinite] opacity-75 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
          <div className="hidden sm:block absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-cyber-red via-cyber-purple via-cyber-blue to-cyber-red bg-[length:200%_200%] motion-safe:animate-[spin_4s_linear_infinite] opacity-30 group-hover:opacity-60 blur-[8px] transition-opacity duration-500" />
          {/* Static border on mobile */}
          <div className="sm:hidden absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyber-red/60 via-cyber-purple/40 to-cyber-blue/60" />
          <div className="sm:hidden absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyber-red/20 via-cyber-purple/20 to-cyber-blue/20 blur-[4px]" />

          <div className="relative rounded-2xl bg-gradient-to-br from-cyber-dark via-cyber-panel to-cyber-dark border border-cyber-border/50 shadow-[0_0_30px_rgba(255,0,64,0.1)] sm:shadow-[0_0_60px_rgba(255,0,64,0.1)] p-5 sm:p-8 space-y-5 sm:space-y-6">
            {/* Mode tabs */}
            <div className="flex rounded-lg sm:rounded-xl overflow-hidden bg-cyber-black/60 border border-cyber-border/30">
              <button
                type="button"
                onClick={() => { setMode('password'); clearError() }}
                className={tabClass(mode === 'password')}
              >
                <LogIn size={12} className="sm:hidden" />
                <LogIn size={13} className="hidden sm:block" />
                Password
              </button>
              <button
                type="button"
                onClick={() => { setMode('telegram'); clearError() }}
                className={tabClass(mode === 'telegram')}
              >
                <MessageCircle size={12} className="sm:hidden" />
                <MessageCircle size={13} className="hidden sm:block" />
                Telegram
              </button>
            </div>

            {mode === 'password' && (
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="flex items-center gap-2 px-3 sm:gap-2.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyber-red/15 to-cyber-red/5 border border-cyber-red/40 text-xs sm:text-sm text-cyber-red shadow-[0_0_15px_rgba(255,0,64,0.12)] sm:shadow-[0_0_25px_rgba(255,0,64,0.12)] motion-safe:animate-[fadeIn_0.3s_ease-out]">
                    <AlertTriangle size={13} className="sm:hidden shrink-0" />
                    <AlertTriangle size={15} className="hidden sm:block shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold">
                    Username
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-red/30 to-cyber-purple/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                    <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-red/70 focus:shadow-[0_0_15px_rgba(255,0,64,0.2)] sm:focus:shadow-[0_0_25px_rgba(255,0,64,0.2)] transition-all duration-300 tracking-wide"
                      placeholder="Username"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold">
                    Password
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-red/30 to-cyber-purple/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                    <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-red/70 focus:shadow-[0_0_15px_rgba(255,0,64,0.2)] sm:focus:shadow-[0_0_25px_rgba(255,0,64,0.2)] transition-all duration-300 tracking-wide"
                      placeholder="Password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-cyber-text-muted/50 hover:text-cyber-text/80 transition-colors z-10"
                    >
                      {showPw ? (
                        <><EyeOff size={13} className="sm:hidden" /><EyeOff size={15} className="hidden sm:block" /></>
                      ) : (
                        <><Eye size={13} className="sm:hidden" /><Eye size={15} className="hidden sm:block" /></>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !username || !password}
                  className="relative w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue bg-[length:200%_100%] motion-safe:animate-[spin_3s_linear_infinite] opacity-90 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-red via-cyber-purple to-cyber-blue opacity-0 group-hover/btn:opacity-50 transition-opacity duration-500 blur-xl sm:blur-2xl" />
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5 text-white">
                    {loading ? (
                      <>
                        <span className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span className="text-[11px] sm:text-sm">Signing in...</span>
                      </>
                    ) : (
                      <>
                        <LogIn size={13} className="sm:hidden" />
                        <LogIn size={15} className="hidden sm:block" />
                        Sign In
                      </>
                    )}
                  </span>
                </button>
              </form>
            )}

            {mode === 'telegram' && (
              <div className="space-y-4 sm:space-y-5">
                {error && (
                  <div className="flex items-center gap-2 px-3 sm:gap-2.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyber-red/15 to-cyber-red/5 border border-cyber-red/40 text-xs sm:text-sm text-cyber-red shadow-[0_0_15px_rgba(255,0,64,0.12)] sm:shadow-[0_0_25px_rgba(255,0,64,0.12)] motion-safe:animate-[fadeIn_0.3s_ease-out]">
                    <AlertTriangle size={13} className="sm:hidden shrink-0" />
                    <AlertTriangle size={15} className="hidden sm:block shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-cyber-green/10 to-cyber-blue/10 border border-cyber-green/30 text-[10px] sm:text-xs text-cyber-text-muted leading-relaxed space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-1.5 sm:gap-2 text-cyber-green text-[10px] sm:text-xs uppercase tracking-widest font-semibold">
                    <Terminal size={11} className="sm:hidden" />
                    <Terminal size={13} className="hidden sm:block" />
                    Instructions
                  </div>
                  <p>
                    Send <span className="text-cyber-green font-bold">/id</span> to{' '}
                    <span className="text-cyber-blue font-bold">@NoFaceCheckerBot</span>{' '}
                    on Telegram to get your ID.
                  </p>
                </div>

                <div className="space-y-1 sm:space-y-1.5">
                  <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold">
                    Telegram ID
                  </label>
                  <div className="relative group/input">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-green/30 to-cyber-blue/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                    <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                    <input
                      type="text"
                      value={tgId}
                      onChange={(e) => setTgId(e.target.value)}
                      className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-green/70 focus:shadow-[0_0_15px_rgba(0,255,136,0.2)] sm:focus:shadow-[0_0_25px_rgba(0,255,136,0.2)] transition-all duration-300 tracking-wide"
                      placeholder="Telegram ID"
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
                  className="relative w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-green bg-[length:200%_100%] motion-safe:animate-[spin_3s_linear_infinite] opacity-90 group-hover/btn:opacity-100 transition-opacity duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-green opacity-0 group-hover/btn:opacity-50 transition-opacity duration-500 blur-xl sm:blur-2xl" />
                  <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5 text-white">
                    {loading ? (
                      <>
                        <span className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full" />
                        <span className="text-[11px] sm:text-sm">Logging in...</span>
                      </>
                    ) : (
                      <>
                        <MessageCircle size={13} className="sm:hidden" />
                        <MessageCircle size={15} className="hidden sm:block" />
                        Login with Telegram
                      </>
                    )}
                  </span>
                </button>
              </div>
            )}

            <div className="pt-2.5 sm:pt-3 border-t border-cyber-border/30">
              <p className="text-[11px] sm:text-xs text-center text-cyber-text-muted/50">
                Don't have an account?{' '}
                <Link to="/register" className="text-cyber-red hover:text-cyber-red/80 hover:underline transition-colors font-bold tracking-wider">
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
