import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { useShallow } from 'zustand/react/shallow'
import { ChevronDown, LogOut, User, DollarSign, Minimize2, Maximize2 } from 'lucide-react'
import { NAV_GROUPS, type NavItem } from './navConfig'
import { useAuthStore } from '@/features/auth/authStore'

const GROUP_LABELS: Record<number, string> = {
  0: 'PRIMARY',
  1: 'GATES',
  2: 'TOOLS',
  3: 'INFO',
  4: 'ADMIN',
}

function getIconBg(iconColor: string): string {
  const map: Record<string, string> = {
    'text-cyber-blue': 'from-cyber-blue/20 to-cyber-blue/5 border-cyber-blue/30',
    'text-cyber-green': 'from-cyber-green/20 to-cyber-green/5 border-cyber-green/30',
    'text-cyber-red': 'from-cyber-red/20 to-cyber-red/5 border-cyber-red/30',
    'text-cyber-purple': 'from-cyber-purple/20 to-cyber-purple/5 border-cyber-purple/30',
    'text-cyber-yellow': 'from-cyber-yellow/20 to-cyber-yellow/5 border-cyber-yellow/30',
    'text-orange-500': 'from-orange-500/20 to-orange-500/5 border-orange-500/30',
    'text-cyber-text-muted': 'from-white/10 to-white/5 border-white/10',
  }
  return map[iconColor] ?? 'from-white/10 to-white/5 border-white/10'
}

function getActiveGlow(iconColor: string): string {
  const map: Record<string, string> = {
    'text-cyber-blue': 'shadow-[0_0_20px_rgba(0,212,255,0.25)]',
    'text-cyber-green': 'shadow-[0_0_20px_rgba(0,255,136,0.25)]',
    'text-cyber-red': 'shadow-[0_0_20px_rgba(255,0,64,0.25)]',
    'text-cyber-purple': 'shadow-[0_0_20px_rgba(157,0,255,0.25)]',
    'text-cyber-yellow': 'shadow-[0_0_20px_rgba(255,204,0,0.25)]',
    'text-orange-500': 'shadow-[0_0_20px_rgba(249,115,22,0.25)]',
  }
  return map[iconColor] ?? ''
}

function getAccentColor(iconColor: string): string {
  const map: Record<string, string> = {
    'text-cyber-blue': 'bg-cyber-blue',
    'text-cyber-green': 'bg-cyber-green',
    'text-cyber-red': 'bg-cyber-red',
    'text-cyber-purple': 'bg-cyber-purple',
    'text-cyber-yellow': 'bg-cyber-yellow',
    'text-orange-500': 'bg-orange-500',
    'text-cyber-text-muted': 'bg-cyber-text-muted',
  }
  return map[iconColor] ?? 'bg-white'
}

function getActiveTextColor(iconColor: string): string {
  const map: Record<string, string> = {
    'text-cyber-blue': 'text-cyber-blue',
    'text-cyber-green': 'text-cyber-green',
    'text-cyber-red': 'text-cyber-red',
    'text-cyber-purple': 'text-cyber-purple',
    'text-cyber-yellow': 'text-cyber-yellow',
    'text-orange-500': 'text-orange-400',
    'text-cyber-text-muted': 'text-cyber-text',
  }
  return map[iconColor] ?? 'text-cyber-text'
}

interface DashboardSidebarProps {
  open?: boolean
  onClose?: () => void
  className?: string
}

export function DashboardSidebar({ open, onClose, className }: DashboardSidebarProps) {
  const location = useLocation()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore(useShallow((s) => ({
    user: s.user,
    logout: s.logout,
  })))
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    onClose?.()
  }, [location.pathname])

  const groups = useMemo(() => {
    if (isAdmin) return NAV_GROUPS
    return NAV_GROUPS.filter((group) =>
      !group.items.some((item) => item.label === 'Admin Panel')
    ).map((group) => ({
      ...group,
      items: group.items.filter((item) => !item.adminOnly),
    }))
  }, [isAdmin])

  const isActive = (href?: string) =>
    href && (href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(href))

  const handleNav = () => {
    if (!collapsed) onClose?.()
  }

  const userCredits = user?.credits ?? 0
  const username = user?.username ?? 'User'

  return (
    <aside
      className={clsx(
        'flex-col shrink-0 overflow-y-auto overflow-x-hidden',
        'transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
        collapsed ? 'w-[72px]' : 'w-[270px]',
        'lg:flex lg:sticky lg:top-0 lg:max-h-screen',
        open
          ? 'fixed inset-y-0 left-0 z-50 flex max-h-screen motion-safe:animate-[slideInLeft_0.25s_ease-out]'
          : 'hidden',
        'bg-gradient-to-b from-[#0a0a14] via-[#0d0d1a] to-[#08080f]',
        'border-r border-white/5',
        className
      )}
    >
      {/* Logo */}
      <div className="sticky top-0 z-20 bg-[#0a0a14]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className={clsx(
          'flex items-center h-16',
          collapsed ? 'justify-center px-2' : 'px-5'
        )}>
          {collapsed ? (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-red to-cyber-purple flex items-center justify-center shadow-[0_0_20px_rgba(255,0,64,0.3)]">
              <span className="text-xs font-black text-white tracking-tighter">NF</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyber-red to-cyber-purple flex items-center justify-center shadow-[0_0_20px_rgba(255,0,64,0.3)] shrink-0">
                <span className="text-xs font-black text-white tracking-tighter">NF</span>
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm font-orbitron font-bold tracking-wider bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent leading-tight">
                  NO FACE
                </h1>
                <span className="text-[9px] tracking-[0.25em] text-cyber-text-muted/50 uppercase font-mono">
                  {isAdmin ? 'Admin Terminal' : 'Operator Hub'}
                </span>
              </div>
              <button
                onClick={() => setCollapsed(!collapsed)}
                className="ml-auto p-1.5 rounded-lg text-cyber-text-muted/40 hover:text-cyber-text hover:bg-white/5 transition-all"
                title={collapsed ? 'Expand' : 'Collapse'}
              >
                {collapsed ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User badge */}
      {!collapsed && (
        <div className="mx-3 mt-3 mb-2 p-3 rounded-xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyber-purple/40 to-cyber-red/20 border border-white/10 flex items-center justify-center shrink-0">
              <User size={16} className="text-cyber-text" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-cyber-text truncate leading-tight">{username}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <DollarSign size={10} className="text-cyber-green" />
                <span className="text-[11px] font-medium text-cyber-green">{userCredits.toLocaleString()} cr</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="flex justify-center py-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyber-purple/40 to-cyber-red/20 border border-white/10 flex items-center justify-center">
            <User size={15} className="text-cyber-text" />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-1">
        {groups.map((group, gi) => (
          <div key={gi} className="mb-1">
            {!collapsed && (
              <div className="flex items-center gap-2 px-5 py-2">
                <span className="text-[9px] tracking-[0.2em] text-cyber-text-muted/30 font-mono font-semibold">
                  {GROUP_LABELS[gi] ?? ''}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-white/[0.04] to-transparent" />
              </div>
            )}
            <div className={clsx(
              'flex flex-col gap-0.5',
              collapsed ? 'items-center px-2' : 'px-2.5'
            )}>
              {group.items.map(item => (
                <SidebarRow
                  key={item.label}
                  item={item}
                  collapsed={collapsed}
                  active={!!isActive(item.href)}
                  isOpen={expanded === item.label}
                  onToggle={() => setExpanded(prev => (prev === item.label ? null : item.label))}
                  childActive={(href) => location.pathname === href}
                  onClick={handleNav}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className={clsx(
        'sticky bottom-0 bg-[#0a0a14]/90 backdrop-blur-xl border-t border-white/[0.04] py-2',
        collapsed ? 'px-2' : 'px-3'
      )}>
        {collapsed ? (
          <button
            onClick={logout}
            className="w-full flex items-center justify-center p-2.5 rounded-xl text-cyber-text-muted/50 hover:text-cyber-red hover:bg-cyber-red/5 transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        ) : (
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-cyber-text-muted/60 hover:text-cyber-red hover:bg-cyber-red/5 transition-all group"
          >
            <LogOut size={15} className="transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </button>
        )}
      </div>
    </aside>
  )
}

function SidebarRow({
  item, collapsed, active, isOpen, onToggle, childActive, onClick,
}: {
  item: NavItem
  collapsed: boolean
  active: boolean
  isOpen: boolean
  onToggle: () => void
  childActive: (href: string) => boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  const hasChildren = !!item.children?.length
  const iconBg = getIconBg(item.color)
  const activeGlow = getActiveGlow(item.color)
  const accentColor = getAccentColor(item.color)
  const activeText = getActiveTextColor(item.color)

  const iconEl = (
    <div className={clsx(
      'relative flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-all duration-300',
      'bg-gradient-to-br border',
      iconBg,
      active && clsx(accentColor.replace('bg-', 'bg-').replace('bg-', 'shadow-'), activeGlow)
    )}>
      {active && (
        <span className={clsx(
          'absolute inset-0 rounded-xl opacity-20 animate-pulse',
          accentColor
        )} />
      )}
      <Icon size={15} className={clsx(
        'relative z-10 transition-colors',
        active ? 'text-white' : 'text-cyber-text-muted/70 group-hover:text-cyber-text/90'
      )} strokeWidth={2} />
    </div>
  )

  const content = collapsed ? iconEl : (
    <div className="flex items-center gap-2.5 w-full">
      {iconEl}
      <span className={clsx(
        'flex-1 text-xs font-medium truncate transition-colors',
        active ? activeText : 'text-cyber-text-muted/80 group-hover:text-cyber-text/90'
      )}>
        {item.label}
      </span>
      {hasChildren && (
        <ChevronDown
          size={12}
          className={clsx(
            'shrink-0 transition-transform duration-300',
            isOpen ? 'rotate-180' : 'rotate-0',
            active ? 'text-white/60' : 'text-cyber-text-muted/30'
          )}
        />
      )}
    </div>
  )

  const baseClasses = clsx(
    'group relative flex items-center rounded-xl transition-all duration-200',
    collapsed ? 'justify-center p-2 w-12 h-12 mx-auto' : 'w-full px-2.5 py-2',
    'hover:bg-white/[0.03]',
    active && !collapsed && clsx(
      'bg-gradient-to-r from-white/[0.06] to-transparent',
      'shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]'
    ),
    active && collapsed && clsx(
      'bg-white/[0.06]',
      'shadow-[0_0_15px_rgba(255,255,255,0.06)]'
    )
  )

  const renderActiveBar = () => {
    if (!active || collapsed) return null
    return (
      <span className={clsx(
        'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full',
        accentColor,
        'shadow-[0_0_8px_rgba(255,255,255,0.15)]'
      )} />
    )
  }

  if (hasChildren) {
    return (
      <div className={clsx(collapsed ? 'w-full flex justify-center' : 'w-full')}>
        <button onClick={onToggle} className={baseClasses}>
          {renderActiveBar()}
          {content}
        </button>
        {isOpen && !collapsed && (
          <div className="flex flex-col items-center gap-1.5 px-2 pt-2 pb-1">
            {item.children!.map((child, ci) => {
              const childColor = (child as any).color || 'text-cyber-text'
              const active = childActive(child.href)
              const colorValues: Record<string, { bg: string; border: string; dot: string; dotMuted: string; shadow: string }> = {
                'text-cyber-red': { bg: 'bg-cyber-red/15', border: 'border-cyber-red/40', dot: 'bg-cyber-red', dotMuted: 'bg-cyber-red/40', shadow: 'shadow-[0_0_12px_rgba(255,0,64,0.25)]' },
                'text-cyber-blue': { bg: 'bg-cyber-blue/15', border: 'border-cyber-blue/40', dot: 'bg-cyber-blue', dotMuted: 'bg-cyber-blue/40', shadow: 'shadow-[0_0_12px_rgba(0,212,255,0.25)]' },
                'text-cyber-green': { bg: 'bg-cyber-green/15', border: 'border-cyber-green/40', dot: 'bg-cyber-green', dotMuted: 'bg-cyber-green/40', shadow: 'shadow-[0_0_12px_rgba(0,255,136,0.25)]' },
                'text-cyber-purple': { bg: 'bg-cyber-purple/15', border: 'border-cyber-purple/40', dot: 'bg-cyber-purple', dotMuted: 'bg-cyber-purple/40', shadow: 'shadow-[0_0_12px_rgba(157,0,255,0.25)]' },
                'text-cyber-yellow': { bg: 'bg-cyber-yellow/15', border: 'border-cyber-yellow/40', dot: 'bg-cyber-yellow', dotMuted: 'bg-cyber-yellow/40', shadow: 'shadow-[0_0_12px_rgba(255,204,0,0.25)]' },
                'text-orange-500': { bg: 'bg-orange-500/15', border: 'border-orange-500/40', dot: 'bg-orange-500', dotMuted: 'bg-orange-500/40', shadow: 'shadow-[0_0_12px_rgba(249,115,22,0.25)]' },
              }
              const cv = colorValues[childColor] || { bg: 'bg-white/10', border: 'border-white/30', dot: 'bg-white/50', shadow: '' }
              return (
                <Link
                  key={child.href}
                  to={child.href}
                  onClick={onClick}
                  className={clsx(
                    'relative w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-300',
                    'backdrop-blur-sm motion-safe:animate-slide-up',
                    active
                      ? clsx(cv.bg, cv.border, 'border', childColor, 'font-bold', cv.shadow)
                      : 'bg-white/[0.03] border border-white/[0.06] text-cyber-text-muted/70',
                    'hover:bg-white/[0.06] hover:border-white/[0.12]'
                  )}
                  style={{ animationDelay: `${ci * 0.06}s` }}
                >
                  <span className={clsx(
                    'w-2.5 h-2.5 rounded-full shrink-0 transition-all duration-300',
                    cv.dotMuted,
                    active && cv.dot,
                    active && 'shadow-[0_0_12px_currentColor]'
                  )} />
                  <span className={clsx('transition-all duration-300', active ? childColor : 'text-cyber-text-muted/80')}>
                    {child.label}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link to={item.href ?? '#'} onClick={onClick} className={clsx(collapsed ? 'w-full flex justify-center' : 'w-full')}>
      <div className={baseClasses}>
        {renderActiveBar()}
        {content}
      </div>
    </Link>
  )
}
