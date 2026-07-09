import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/shared/ui/Logo'
import { Lock, User, Bell, AlertTriangle, X, Check, Menu } from 'lucide-react'
import { clsx } from 'clsx'

interface HeaderProps {
  className?: string
}

const MOCK_NOTIFICATIONS = [
  { id: 1, message: 'New gate "Cyber Gate" has been added', time: '2 min ago', read: false },
  { id: 2, message: 'Your credits have been topped up', time: '1 hour ago', read: false },
  { id: 3, message: 'System maintenance scheduled for tonight', time: '3 hours ago', read: true },
]

const MOCK_WARNINGS = [
  { id: 1, message: 'Rate limit exceeded - slow down your requests', time: '10 min ago' },
  { id: 2, message: 'Invalid cookie format detected', time: '1 hour ago' },
]

export function Header({ className }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showWarnings, setShowWarnings] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)
  const warningsRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (warningsRef.current && !warningsRef.current.contains(e.target as Node)) {
        setShowWarnings(false)
      }
      if (mobileRef.current && !mobileRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [mobileMenuOpen])

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const navLinks = [
    { label: 'DEPLOYMENT', href: '/checker' },
    { label: 'BULK', href: '/checker/bulk' },
    { label: 'GENERATOR', href: '/generator' },
    { label: 'INTELLIGENCE', href: '/checker' },
    { label: 'ASSETS', href: '/generator' },
  ]

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-40',
        'bg-cyber-black/98 backdrop-blur-lg',
        'border-b border-cyber-red/20',
        'shadow-[0_0_30px_rgba(255,0,64,0.08)]',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex-shrink-0 group/logo transition-all duration-300 hover:opacity-80">
            <Logo size="sm" />
            <div className="absolute -inset-3 rounded-lg opacity-0 group-hover/logo:opacity-100 transition-opacity duration-300 bg-cyber-red/10 blur-xl" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={clsx(
                  'relative px-3 py-1.5 text-[11px] font-mono text-cyber-text-muted/70',
                  'hover:text-cyber-red',
                  'transition-all duration-300 rounded-sm',
                  'tracking-wider',
                  'after:absolute after:inset-x-2 after:bottom-0 after:h-[1px] after:bg-cyber-red/0 hover:after:bg-cyber-red/40 after:transition-all after:duration-300'
                )}
              >
                [{link.label}]
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Mobile hamburger */}
          <div ref={mobileRef} className="md:hidden relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2 text-cyber-text-muted hover:text-cyber-red transition-all duration-300 rounded-lg hover:bg-cyber-red/10"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              <div className="absolute inset-0 rounded-lg bg-cyber-red/20 opacity-0 hover:opacity-100 transition-opacity" />
            </button>
            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 top-16 bg-black/80 backdrop-blur-sm z-30 motion-safe:animate-[fadeIn_0.2s_ease-out]" onClick={() => setMobileMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-56 bg-cyber-dark border border-cyber-red/30 rounded-lg shadow-xl shadow-[0_0_30px_rgba(255,0,64,0.2)] overflow-hidden z-40 motion-safe:animate-[fadeIn_0.2s_ease-out]">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-xs font-mono text-cyber-text-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-colors border-b border-cyber-border/30 last:border-0 tracking-wider"
                    >
                      [{link.label}]
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Warnings Dropdown */}
          <div ref={warningsRef} className="relative">
            <button
              onClick={() => { setShowWarnings(!showWarnings); setShowNotifications(false) }}
              className={clsx(
                'relative p-2 rounded-lg transition-all duration-300',
                MOCK_WARNINGS.length > 0
                  ? 'text-cyber-yellow hover:bg-cyber-yellow/15 hover:shadow-[0_0_12px_rgba(255,204,0,0.3)]'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text hover:bg-cyber-text/5'
              )}
            >
              <AlertTriangle size={16} className={MOCK_WARNINGS.length > 0 ? 'motion-safe:animate-[pulseNeon_2s_ease-in-out_infinite]' : ''} />
              {MOCK_WARNINGS.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-yellow text-cyber-black text-[9px] font-bold rounded-full flex items-center justify-center motion-safe:animate-[scaleIn_0.3s_ease-out]">
                  {MOCK_WARNINGS.length}
                </span>
              )}
            </button>

              {showWarnings && (
              <div className="absolute right-0 sm:right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-80 bg-cyber-dark border border-cyber-yellow/30 rounded-lg shadow-xl shadow-[0_0_30px_rgba(255,204,0,0.15)] overflow-hidden motion-safe:animate-[fadeIn_0.15s_ease-out]">
                <div className="px-4 py-3 border-b border-cyber-yellow/20 bg-cyber-yellow/5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-cyber-yellow">WARNINGS</span>
                  <button onClick={() => setShowWarnings(false)} className="text-cyber-text-muted hover:text-cyber-yellow transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {MOCK_WARNINGS.length === 0 ? (
                    <div className="px-4 py-6 text-center text-cyber-text-muted text-sm">
                      No warnings
                    </div>
                  ) : (
                    MOCK_WARNINGS.map(w => (
                      <div key={w.id} className="px-4 py-3 border-b border-cyber-border/50 hover:bg-cyber-yellow/5 transition-colors">
                        <p className="text-sm text-cyber-text">{w.message}</p>
                        <p className="text-xs text-cyber-text-muted mt-1">{w.time}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowWarnings(false) }}
              className={clsx(
                'relative p-2 rounded-lg transition-all duration-300',
                unreadCount > 0
                  ? 'text-cyber-blue hover:bg-cyber-blue/15 hover:shadow-[0_0_12px_rgba(0,212,255,0.3)]'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text hover:bg-cyber-text/5'
              )}
            >
              <Bell size={16} className={unreadCount > 0 ? 'motion-safe:animate-[pulseNeon_2s_ease-in-out_infinite]' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-blue text-white text-[9px] font-bold rounded-full flex items-center justify-center motion-safe:animate-[scaleIn_0.3s_ease-out]">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 sm:right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-80 bg-cyber-dark border border-cyber-blue/30 rounded-lg shadow-xl shadow-[0_0_30px_rgba(0,212,255,0.15)] overflow-hidden motion-safe:animate-[fadeIn_0.15s_ease-out]">
                <div className="px-4 py-3 border-b border-cyber-blue/20 bg-cyber-blue/5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-cyber-blue">NOTIFICATIONS</span>
                  <button onClick={() => setShowNotifications(false)} className="text-cyber-text-muted hover:text-cyber-blue transition-colors">
                    <X size={14} />
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-cyber-text-muted text-sm">
                      No notifications
                    </div>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => markAsRead(n.id)}
                        className={clsx(
                          'px-4 py-3 border-b border-cyber-border/50 hover:bg-cyber-blue/5 cursor-pointer transition-all',
                          !n.read && 'bg-cyber-blue/10 border-l-2 border-l-cyber-blue'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="w-2 h-2 bg-cyber-blue rounded-full mt-1.5 shrink-0 motion-safe:animate-pulse" />}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-cyber-text">{n.message}</p>
                            <p className="text-xs text-cyber-text-muted mt-1">{n.time}</p>
                          </div>
                          {n.read && <Check size={14} className="text-cyber-green mt-0.5" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-cyber-text-muted/60 group px-2 py-1 rounded-lg hover:bg-cyber-text/5 transition-all">
            <User size={13} className="group-hover:text-cyber-blue transition-colors" />
            <span className="font-mono tracking-wide">OPERATIVE-2401</span>
          </div>
          <div className="w-px h-4 bg-cyber-border/50 hidden sm:block" />
          <Lock size={14} className="text-cyber-red/80 motion-safe:animate-[pulseNeon_3s_ease-in-out_infinite]" />
        </div>
      </div>
    </header>
  )
}
