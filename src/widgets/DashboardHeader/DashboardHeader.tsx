import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { clsx } from 'clsx'
import {
  Bell, AlertTriangle, Search, Zap, X, Check,
  User, ChevronDown, Settings, LogOut, CircleDot,
} from 'lucide-react'
import { useUserStore } from '@/features/checker/store/userStore'

interface NotificationItem {
  id: number
  message: string
  time: string
  read: boolean
}

interface WarningItem {
  id: number
  message: string
  time: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  { id: 1, message: 'New gate "Cyber Gate" has been added', time: '2 min ago', read: false },
  { id: 2, message: 'Your credits have been topped up (+500)', time: '1 hour ago', read: false },
  { id: 3, message: 'System maintenance scheduled for tonight', time: '3 hours ago', read: true },
]

const WARNINGS: WarningItem[] = [
  { id: 1, message: 'Rate limit exceeded - slow down your requests', time: '10 min ago' },
  { id: 2, message: 'Invalid cookie format detected', time: '1 hour ago' },
]

type Panel = 'notifications' | 'warnings' | 'profile' | null

export function DashboardHeader() {
  const { profile } = useUserStore()
  const [panel, setPanel] = useState<Panel>(null)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const wrapRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setPanel(null)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = (p: Panel) => setPanel((prev) => (prev === p ? null : p))
  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  const markRead = (id: number) =>
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))

  return (
    <header className="h-16 shrink-0 sticky top-0 z-30 flex items-center gap-4 px-4 sm:px-6 border-b border-cyber-border bg-cyber-dark/80 backdrop-blur-md">
      {/* Status indicator + Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-cyber-green opacity-75 animate-ping" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyber-green" />
        </span>
        <span className="hidden sm:inline font-orbitron font-bold text-cyber-text tracking-wider text-sm">
          NO FACE<span className="text-cyber-red"> // </span>CONSOLE
        </span>
      </div>

      {/* Global search */}
      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative group">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-text-muted group-focus-within:text-cyber-blue transition-colors"
          />
          <input
            type="text"
            placeholder="Search gates, tools, cards..."
            className="w-full pl-9 pr-12 py-2 rounded-lg bg-cyber-black/60 border border-cyber-border text-sm text-cyber-text placeholder-cyber-text-muted/60 focus:outline-none focus:border-cyber-blue/60 transition-colors"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-cyber-panel border border-cyber-border text-[10px] font-mono text-cyber-text-muted">
            /
          </kbd>
        </div>
      </div>

      {/* Right cluster */}
      <div ref={wrapRef} className="flex items-center gap-1.5 sm:gap-2 ml-auto md:ml-0 shrink-0">
        {/* Credits pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyber-panel/70 border border-cyber-yellow/30">
          <Zap size={14} className="text-cyber-yellow" />
          <span className="text-sm font-bold text-cyber-yellow">{profile.credits}</span>
          <span className="text-[11px] text-cyber-text-muted">credits</span>
        </div>

        {/* Warnings */}
        <div className="relative">
          <IconButton
            active={panel === 'warnings'}
            onClick={() => toggle('warnings')}
            badge={WARNINGS.length}
            badgeColor="bg-cyber-yellow text-cyber-black"
            tone="warning"
          >
            <AlertTriangle size={16} />
          </IconButton>
          {panel === 'warnings' && (
            <DropdownPanel title="Warnings" accent="yellow" onClose={() => setPanel(null)}>
              {WARNINGS.length === 0 ? (
                <EmptyState label="No active warnings" />
              ) : (
                WARNINGS.map((w) => (
                  <div
                    key={w.id}
                    className="px-4 py-3 border-b border-cyber-border/40 hover:bg-cyber-yellow/5 transition-colors"
                  >
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={14} className="text-cyber-yellow mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-cyber-text leading-snug">{w.message}</p>
                        <p className="text-xs text-cyber-text-muted mt-1">{w.time}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </DropdownPanel>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <IconButton
            active={panel === 'notifications'}
            onClick={() => toggle('notifications')}
            badge={unread}
            badgeColor="bg-cyber-red text-white"
            tone="info"
          >
            <Bell size={16} />
          </IconButton>
          {panel === 'notifications' && (
            <DropdownPanel
              title="Notifications"
              accent="blue"
              onClose={() => setPanel(null)}
              action={
                unread > 0 ? (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-cyber-blue hover:underline"
                  >
                    Mark all read
                  </button>
                ) : undefined
              }
            >
              {notifications.length === 0 ? (
                <EmptyState label="No notifications" />
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={clsx(
                      'w-full text-left px-4 py-3 border-b border-cyber-border/40 hover:bg-cyber-blue/5 transition-colors',
                      !n.read && 'bg-cyber-blue/[0.04]'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.read ? (
                        <CircleDot size={14} className="text-cyber-blue mt-0.5 shrink-0" />
                      ) : (
                        <Check size={14} className="text-cyber-green mt-0.5 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm text-cyber-text leading-snug">{n.message}</p>
                        <p className="text-xs text-cyber-text-muted mt-1">{n.time}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </DropdownPanel>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => toggle('profile')}
            className={clsx(
              'flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-lg border transition-colors',
              panel === 'profile'
                ? 'bg-cyber-panel border-cyber-purple/50'
                : 'border-transparent hover:bg-cyber-panel/60'
            )}
          >
            <span className="w-8 h-8 rounded-md bg-gradient-to-br from-cyber-purple to-cyber-blue flex items-center justify-center text-white text-sm font-bold">
              {profile.username ? profile.username[0].toUpperCase() : '?'}
            </span>
            <span className="hidden lg:flex flex-col items-start leading-tight">
              <span className="text-xs font-semibold text-cyber-text truncate max-w-[100px]">
                {profile.username}
              </span>
              <span className="text-[10px] text-cyber-text-muted">Operative</span>
            </span>
            <ChevronDown
              size={14}
              className={clsx(
                'text-cyber-text-muted transition-transform',
                panel === 'profile' && 'rotate-180'
              )}
            />
          </button>
          {panel === 'profile' && (
            <DropdownPanel title="" accent="purple" onClose={() => setPanel(null)} width="w-56">
              <div className="px-4 py-3 border-b border-cyber-border/40">
                <p className="text-sm font-semibold text-cyber-text">{profile.username}</p>
                <p className="text-xs text-cyber-text-muted">TG: {profile.telegramId}</p>
              </div>
              <MenuLink to="/dashboard/profile" icon={<User size={14} />} label="Your Profile" />
              <MenuLink to="/dashboard/pricing" icon={<Zap size={14} />} label="Buy Credits" />
              <MenuLink
                to="/dashboard/admin/control-panel"
                icon={<Settings size={14} />}
                label="Admin Panel"
              />
              <Link
                to="/"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cyber-red hover:bg-cyber-red/10 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </Link>
            </DropdownPanel>
          )}
        </div>
      </div>
    </header>
  )
}

function IconButton({
  children,
  active,
  onClick,
  badge,
  badgeColor,
  tone,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  badge?: number
  badgeColor: string
  tone: 'info' | 'warning'
}) {
  const toneActive =
    tone === 'warning'
      ? 'text-cyber-yellow bg-cyber-yellow/10'
      : 'text-cyber-blue bg-cyber-blue/10'
  return (
    <button
      onClick={onClick}
      className={clsx(
        'relative p-2.5 rounded-lg transition-colors',
        active ? toneActive : 'text-cyber-text-muted hover:text-cyber-text hover:bg-cyber-panel/60'
      )}
    >
      {children}
      {!!badge && badge > 0 && (
        <span
          className={clsx(
            'absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-full flex items-center justify-center',
            badgeColor
          )}
        >
          {badge}
        </span>
      )}
    </button>
  )
}

const ACCENT_BORDER = {
  blue: 'border-t-cyber-blue',
  yellow: 'border-t-cyber-yellow',
  purple: 'border-t-cyber-purple',
} as const

function DropdownPanel({
  title,
  accent,
  onClose,
  action,
  children,
  width = 'w-80',
}: {
  title: string
  accent: keyof typeof ACCENT_BORDER
  onClose: () => void
  action?: React.ReactNode
  children: React.ReactNode
  width?: string
}) {
  return (
    <div
      className={clsx(
        'absolute right-0 top-full mt-2 bg-cyber-dark border border-cyber-border border-t-2 rounded-lg shadow-2xl shadow-black/50 overflow-hidden animate-fade-in z-50',
        ACCENT_BORDER[accent],
        width
      )}
    >
      {title && (
        <div className="px-4 py-3 border-b border-cyber-border flex items-center justify-between">
          <span className="text-sm font-semibold text-cyber-text">{title}</span>
          <div className="flex items-center gap-3">
            {action}
            <button onClick={onClose} className="text-cyber-text-muted hover:text-cyber-text">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <div className="max-h-72 overflow-y-auto">{children}</div>
    </div>
  )
}

function EmptyState({ label }: { label: string }) {
  return <div className="px-4 py-8 text-center text-sm text-cyber-text-muted">{label}</div>
}

function MenuLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-cyber-text-muted hover:text-cyber-text hover:bg-cyber-panel/60 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}
