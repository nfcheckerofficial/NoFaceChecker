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
        'glass-strong',
        'shadow-[0_0_40px_rgba(255,0,64,0.06)]',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex-shrink-0 group/logo transition-all duration-300 hover:opacity-80">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={clsx(
                  'relative px-3 py-1.5 text-[11px] font-mono text-cyber-text-muted/60',
                  'hover:text-cyber-red',
                  'transition-all duration-300 rounded-md',
                  'tracking-wider',
                  'hover:bg-cyber-red/5',
                  'after:absolute after:inset-x-2 after:bottom-0 after:h-[1px] after:bg-cyber-red/0 hover:after:bg-cyber-red/40 after:transition-all after:duration-300'
                )}
              >
                [{link.label}]
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <div ref={mobileRef} className="md:hidden relative">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="relative p-2 text-cyber-text-muted hover:text-cyber-red transition-all duration-300 rounded-lg hover:bg-cyber-red/10"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            {mobileMenuOpen && (
              <>
                <div className="fixed inset-0 top-16 bg-black/80 backdrop-blur-sm z-30 motion-safe:animate-fade-in" onClick={() => setMobileMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-56 glass-strong rounded-xl shadow-xl shadow-black/50 overflow-hidden z-40 motion-safe:animate-fade-in">
                  {navLinks.map((link) => (
                    <Link
                      key={link.label}
                      to={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 text-xs font-mono text-cyber-text-muted hover:text-cyber-red hover:bg-cyber-red/10 transition-colors border-b border-white/5 last:border-0 tracking-wider"
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
                  ? 'text-cyber-yellow hover:bg-cyber-yellow/10'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text hover:bg-white/5'
              )}
            >
              <AlertTriangle size={16} className={MOCK_WARNINGS.length > 0 ? 'motion-safe:animate-pulse' : ''} />
              {MOCK_WARNINGS.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-yellow text-cyber-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {MOCK_WARNINGS.length}
                </span>
              )}
            </button>

              {showWarnings && (
              <div className="absolute right-0 sm:right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-80 glass-strong rounded-xl shadow-xl shadow-black/50 overflow-hidden motion-safe:animate-fade-in">
                <div className="px-4 py-3 border-b border-white/5 bg-cyber-yellow/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyber-yellow">WARNINGS</span>
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
                      <div key={w.id} className="px-4 py-3 border-b border-white/5 hover:bg-cyber-yellow/5 transition-colors last:border-0">
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
                  ? 'text-cyber-blue hover:bg-cyber-blue/10'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text hover:bg-white/5'
              )}
            >
              <Bell size={16} className={unreadCount > 0 ? 'motion-safe:animate-pulse' : ''} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-blue text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 sm:right-0 top-full mt-2 w-[calc(100vw-32px)] sm:w-80 glass-strong rounded-xl shadow-xl shadow-black/50 overflow-hidden motion-safe:animate-fade-in">
                <div className="px-4 py-3 border-b border-white/5 bg-cyber-blue/5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyber-blue">NOTIFICATIONS</span>
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
                          'px-4 py-3 border-b border-white/5 hover:bg-cyber-blue/5 cursor-pointer transition-all last:border-0',
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

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-cyber-text-muted/60 group px-2 py-1 rounded-lg hover:bg-white/5 transition-all">
            <User size={13} className="group-hover:text-cyber-blue transition-colors" />
            <span className="font-mono tracking-wide">OPERATIVE-2401</span>
          </div>
          <div className="w-px h-4 bg-white/10 hidden sm:block" />
          <Lock size={14} className="text-cyber-red/60" />
        </div>
      </div>
    </header>
  )
}
