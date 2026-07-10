import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '@/features/auth/authStore'
import { MatrixRain } from '@/shared/ui/MatrixRain'
import { ScanLines } from '@/shared/ui/ScanLines'
import { Particles } from '@/shared/ui/Particles'
import { Eye, EyeOff, UserPlus, AlertTriangle, MessageCircle, Shield, ArrowLeft } from 'lucide-react'

export function RegisterPage() {
  const { register, loading, error, clearError } = useAuthStore(useShallow((s) => ({
    register: s.register,
    loading: s.loading,
    error: s.error,
    clearError: s.clearError,
  })))
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [telegramId, setTelegramId] = useState('')
  const [localErr, setLocalErr] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setLocalErr('')
    if (password !== confirm) { setLocalErr('Passwords do not match'); return }
    if (username.length < 3) { setLocalErr('Username must be at least 3 characters'); return }
    if (password.length < 4) { setLocalErr('Password must be at least 4 characters'); return }
    if (!telegramId.trim() || !/^\d+$/.test(telegramId.trim())) { setLocalErr('Valid Telegram ID is required'); return }
    const ok = await register(username, password, telegramId.trim())
    if (ok) navigate('/dashboard')
  }

  const displayError = localErr || error

  return (
    <div className="min-h-screen bg-cyber-black text-cyber-text font-mono relative flex items-center justify-center p-4 overflow-hidden">
      <MatrixRain opacity={0.04} />
      <ScanLines />
      <Particles />

      {/* Animated gradient orbs - smaller on mobile */}
      <div className="absolute top-1/4 left-1/4 w-[200px] sm:w-[450px] h-[200px] sm:h-[450px] bg-cyber-green/8 rounded-full blur-[60px] sm:blur-[130px] pointer-events-none motion-safe:animate-[float_8s_ease-in-out_infinite]" />
      <div className="absolute bottom-1/3 right-1/4 w-[160px] sm:w-[350px] h-[160px] sm:h-[350px] bg-cyber-blue/8 rounded-full blur-[50px] sm:blur-[110px] pointer-events-none motion-safe:animate-[float_10s_ease-in-out_infinite_reverse]" />

      <div className="relative z-10 w-full max-w-sm">
        {/* Brand section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-flex mb-3 sm:mb-5">
            <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-purple rounded-full blur-xl sm:blur-2xl opacity-50 motion-safe:animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-cyber-green/30 via-cyber-blue/20 to-cyber-purple/20 border-2 border-cyber-green/40 shadow-[0_0_20px_rgba(0,255,136,0.2)] sm:shadow-[0_0_40px_rgba(0,255,136,0.25)]">
              <Shield size={22} className="sm:hidden text-cyber-green drop-shadow-[0_0_8px_rgba(0,255,136,0.4)]" />
              <Shield size={34} className="hidden sm:block text-cyber-green drop-shadow-[0_0_12px_rgba(0,255,136,0.4)]" />
            </div>
          </div>
          <h1 className="font-orbitron font-black text-2xl sm:text-3xl tracking-[0.1em] sm:tracking-[0.15em] text-transparent bg-clip-text bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-purple">
            CREATE ACCOUNT
          </h1>
          <p className="font-orbitron text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] text-cyber-green/80 mt-1.5 sm:mt-2">
            // REGISTRATION
          </p>
        </div>

        {/* Register card */}
        <div className="relative group">
          {/* Animated border glow - disabled on mobile for performance */}
          <div className="hidden sm:block absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-cyber-green via-cyber-blue via-cyber-purple to-cyber-green bg-[length:200%_200%] motion-safe:animate-[spin_4s_linear_infinite] opacity-75 group-hover:opacity-100 blur-[2px] transition-opacity duration-500" />
          <div className="hidden sm:block absolute -inset-[2px] rounded-2xl bg-gradient-to-r from-cyber-green via-cyber-blue via-cyber-purple to-cyber-green bg-[length:200%_200%] motion-safe:animate-[spin_4s_linear_infinite] opacity-30 group-hover:opacity-60 blur-[8px] transition-opacity duration-500" />
          {/* Static border on mobile */}
          <div className="sm:hidden absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyber-green/60 via-cyber-blue/40 to-cyber-purple/60" />
          <div className="sm:hidden absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-cyber-green/20 via-cyber-blue/20 to-cyber-purple/20 blur-[4px]" />

          <form onSubmit={handleSubmit} className="relative rounded-2xl bg-gradient-to-br from-cyber-dark via-cyber-panel to-cyber-dark border border-cyber-border/50 shadow-[0_0_30px_rgba(0,255,136,0.06)] sm:shadow-[0_0_60px_rgba(0,255,136,0.08)] p-5 sm:p-8 space-y-4 sm:space-y-5">
            <div className="flex items-center gap-1.5 sm:gap-2 pb-2 border-b border-cyber-border/30">
              <UserPlus size={14} className="sm:hidden text-cyber-green" />
              <UserPlus size={16} className="hidden sm:block text-cyber-green" />
              <span className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-cyber-text">Register</span>
            </div>

            {displayError && (
              <div className="flex items-center gap-2 px-3 sm:gap-2.5 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-cyber-red/15 to-cyber-red/5 border border-cyber-red/40 text-xs sm:text-sm text-cyber-red shadow-[0_0_15px_rgba(255,0,64,0.08)] sm:shadow-[0_0_25px_rgba(255,0,64,0.12)] motion-safe:animate-[fadeIn_0.3s_ease-out]">
                <AlertTriangle size={13} className="sm:hidden shrink-0" />
                <AlertTriangle size={15} className="hidden sm:block shrink-0" />
                {displayError}
              </div>
            )}

            <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-cyber-green/8 to-cyber-blue/8 border border-cyber-green/20 text-[10px] sm:text-xs text-cyber-text-muted leading-relaxed">
              <p>
                Send <span className="text-cyber-green font-bold">/id</span> to{' '}
                <span className="text-cyber-blue font-bold">@NoFaceCheckerBot</span> on Telegram to get your ID, then enter it below.
              </p>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold flex items-center gap-1">
                <MessageCircle size={10} className="sm:hidden text-cyber-blue" />
                <MessageCircle size={12} className="hidden sm:block text-cyber-blue" />
                Telegram ID <span className="text-cyber-red ml-0.5">*</span>
              </label>
              <div className="relative group/input">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-green/30 to-cyber-blue/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                <input
                  type="text"
                  value={telegramId}
                  onChange={(e) => setTelegramId(e.target.value)}
                  className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-green/70 focus:shadow-[0_0_15px_rgba(0,255,136,0.15)] sm:focus:shadow-[0_0_25px_rgba(0,255,136,0.2)] transition-all duration-300 tracking-wide"
                  placeholder="Telegram ID"
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold">
                Username
              </label>
              <div className="relative group/input">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-blue/30 to-cyber-purple/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-blue/70 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] sm:focus:shadow-[0_0_25px_rgba(0,212,255,0.2)] transition-all duration-300 tracking-wide"
                  placeholder="Username"
                />
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold">
                Password
              </label>
              <div className="relative group/input">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-blue/30 to-cyber-purple/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 pr-10 sm:pr-12 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-blue/70 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] sm:focus:shadow-[0_0_25px_rgba(0,212,255,0.2)] transition-all duration-300 tracking-wide"
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

            <div className="space-y-1 sm:space-y-1.5">
              <label className="block text-[10px] sm:text-[11px] text-cyber-text-muted/70 uppercase tracking-widest font-semibold">
                Confirm Password
              </label>
              <div className="relative group/input">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyber-blue/30 to-cyber-purple/30 opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-500 blur-md" />
                <div className="absolute inset-[1px] rounded-xl bg-cyber-dark/95" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="relative w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent border border-cyber-border/60 rounded-xl text-xs sm:text-sm text-cyber-text placeholder-cyber-text-muted/40 focus:outline-none focus:border-cyber-blue/70 focus:shadow-[0_0_15px_rgba(0,212,255,0.15)] sm:focus:shadow-[0_0_25px_rgba(0,212,255,0.2)] transition-all duration-300 tracking-wide"
                  placeholder="Confirm password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password || !confirm || !telegramId.trim()}
              className="relative w-full py-3 sm:py-3.5 rounded-xl text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-300 disabled:opacity-35 disabled:cursor-not-allowed overflow-hidden group/btn"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-purple bg-[length:200%_100%] motion-safe:animate-[spin_3s_linear_infinite] opacity-90 group-hover/btn:opacity-100 transition-opacity duration-500" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyber-green via-cyber-blue to-cyber-purple opacity-0 group-hover/btn:opacity-50 transition-opacity duration-500 blur-xl sm:blur-2xl" />
              <span className="relative z-10 flex items-center justify-center gap-2 sm:gap-2.5 text-white">
                {loading ? (
                  <>
                    <span className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full" />
                    <span className="text-[11px] sm:text-sm">Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={13} className="sm:hidden" />
                    <UserPlus size={15} className="hidden sm:block" />
                    Create Account
                  </>
                )}
              </span>
            </button>

            <div className="pt-2 flex items-center justify-between border-t border-cyber-border/30">
              <Link to="/login" className="text-[11px] sm:text-xs text-cyber-text-muted/50 hover:text-cyber-blue transition-colors flex items-center gap-1">
                <ArrowLeft size={11} className="sm:hidden" />
                <ArrowLeft size={12} className="hidden sm:block" />
                Back to Sign In
              </Link>
              <span className="text-[9px] sm:text-[10px] text-cyber-text-muted/30">SECURED</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
