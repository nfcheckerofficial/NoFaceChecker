import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '@/shared/ui/Logo'
import { Lock, User, Bell, AlertTriangle, X, Check } from 'lucide-react'
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
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)
  const warningsRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
      if (warningsRef.current && !warningsRef.current.contains(e.target as Node)) {
        setShowWarnings(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const navLinks = [
    { label: 'DEPLOYMENT', href: '/checker' },
    { label: 'BULK', href: '/checker/bulk' },
    { label: 'GENERATOR', href: '/generator' },
    { label: 'INTELLIGENCE', href: '/' },
    { label: 'ASSETS', href: '/' },
  ]

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-40',
        'bg-cyber-black/95 backdrop-blur-md',
        'border-b border-cyber-border/50',
        className
      )}
    >
      <div className="max-w-[1920px] mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className={clsx(
                  'px-3 py-1.5 text-[11px] font-mono text-cyber-text-muted/70',
                  'hover:text-cyber-red hover:bg-cyber-red/5',
                  'transition-all duration-300 rounded-sm',
                  'tracking-wider'
                )}
              >
                [{link.label}]
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {/* Warnings Dropdown */}
          <div ref={warningsRef} className="relative">
            <button
              onClick={() => { setShowWarnings(!showWarnings); setShowNotifications(false) }}
              className={clsx(
                'relative p-2 rounded-lg transition-all',
                MOCK_WARNINGS.length > 0
                  ? 'text-cyber-yellow hover:bg-cyber-yellow/10'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text'
              )}
            >
              <AlertTriangle size={16} />
              {MOCK_WARNINGS.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-yellow text-cyber-black text-[9px] font-bold rounded-full flex items-center justify-center">
                  {MOCK_WARNINGS.length}
                </span>
              )}
            </button>

            {showWarnings && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-cyber-text">Warnings</span>
                  <button onClick={() => setShowWarnings(false)} className="text-cyber-text-muted hover:text-cyber-text">
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
                      <div key={w.id} className="px-4 py-3 border-b border-cyber-border/50 hover:bg-cyber-panel/50">
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
                'relative p-2 rounded-lg transition-all',
                unreadCount > 0
                  ? 'text-cyber-blue hover:bg-cyber-blue/10'
                  : 'text-cyber-text-muted/60 hover:text-cyber-text'
              )}
            >
              <Bell size={16} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-cyber-red text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
                  <span className="text-sm font-semibold text-cyber-text">Notifications</span>
                  <button onClick={() => setShowNotifications(false)} className="text-cyber-text-muted hover:text-cyber-text">
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
                          'px-4 py-3 border-b border-cyber-border/50 hover:bg-cyber-panel/50 cursor-pointer transition-colors',
                          !n.read && 'bg-cyber-blue/5'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {!n.read && <span className="w-2 h-2 bg-cyber-blue rounded-full mt-1.5 shrink-0" />}
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

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-cyber-text-muted/60">
            <User size={13} />
            <span className="font-mono tracking-wide">OPERATIVE-2401</span>
          </div>
          <div className="w-px h-4 bg-cyber-border/50 hidden sm:block" />
          <Lock size={14} className="text-cyber-red/80" />
        </div>
      </div>
    </header>
  )
}
