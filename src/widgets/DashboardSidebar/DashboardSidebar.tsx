import { useState, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronRight } from 'lucide-react'
import { NAV_GROUPS, type NavItem } from './navConfig'
import { useAuthStore } from '@/features/auth/authStore'

/** Mapea el color de texto del icono a su círculo de relleno sólido. */
const CIRCLE_BG: Record<string, string> = {
  'text-cyber-blue': 'bg-cyber-blue shadow-[0_0_12px_rgba(0,212,255,0.5)]',
  'text-cyber-green': 'bg-cyber-green shadow-[0_0_12px_rgba(0,255,136,0.5)]',
  'text-cyber-red': 'bg-cyber-red shadow-[0_0_12px_rgba(255,0,64,0.5)]',
  'text-cyber-purple': 'bg-cyber-purple shadow-[0_0_12px_rgba(157,0,255,0.5)]',
  'text-cyber-yellow': 'bg-cyber-yellow shadow-[0_0_12px_rgba(255,204,0,0.5)]',
  'text-orange-500': 'bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.5)]',
  'text-cyber-text-muted': 'bg-cyber-text-muted/70',
}

interface DashboardSidebarProps {
  open?: boolean
  onClose?: () => void
  className?: string
}

export function DashboardSidebar({ open, onClose, className }: DashboardSidebarProps) {
  const location = useLocation()
  const [expanded, setExpanded] = useState<string | null>(null)
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

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

  const handleNav = () => onClose?.()

  return (
    <aside
      className={clsx(
        'flex flex-col w-[260px] shrink-0 h-screen overflow-y-auto',
        // Desktop: sticky sidebar
        'hidden lg:flex sticky top-0',
        // Mobile: fixed overlay sidebar
        open
          ? 'fixed inset-y-0 left-0 z-50 flex'
          : 'hidden',
        'bg-gradient-to-b from-cyber-dark to-cyber-black border-r border-cyber-border',
        'transition-transform duration-200',
        className
      )}
    >
      <nav className="flex flex-col py-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-3 mx-4 border-t border-cyber-border/60" />}
            <div className="flex flex-col gap-0.5 px-3">
              {group.items.map(item => (
                <SidebarRow
                  key={item.label}
                  item={item}
                  active={!!isActive(item.href)}
                  isOpen={expanded === item.label}
                  onToggle={() =>
                    setExpanded(prev => (prev === item.label ? null : item.label))
                  }
                  childActive={(href) => location.pathname === href}
                  onClick={handleNav}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  )
}

function SidebarRow({
  item, active, isOpen, onToggle, childActive, onClick,
}: {
  item: NavItem
  active: boolean
  isOpen: boolean
  onToggle: () => void
  childActive: (href: string) => boolean
  onClick?: () => void
}) {
  const Icon = item.icon
  const hasChildren = !!item.children?.length
  const circle = CIRCLE_BG[item.color] ?? CIRCLE_BG['text-cyber-text-muted']

  const content = (
    <>
      <span
        className={clsx(
          'flex items-center justify-center w-8 h-8 rounded-full shrink-0 transition-all',
          circle
        )}
      >
        <Icon size={16} className="shrink-0 text-white" strokeWidth={2.25} />
      </span>
      <span className="flex-1 truncate">{item.label}</span>
      {hasChildren && (
        <ChevronRight
          size={15}
          className={clsx('shrink-0 transition-transform text-cyber-text-muted', isOpen && 'rotate-90')}
        />
      )}
    </>
  )

  const baseClasses = clsx(
    'flex items-center gap-3 px-2.5 py-2 rounded-lg text-sm transition-all w-full text-left',
    active
      ? 'bg-cyber-red/10 text-cyber-text border border-cyber-red/30'
      : 'text-cyber-text-muted hover:bg-cyber-panel hover:text-cyber-text border border-transparent'
  )

  if (hasChildren) {
    return (
      <div>
        <button onClick={onToggle} className={baseClasses}>
          {content}
        </button>
        {isOpen && (
          <div className="ml-11 mt-0.5 flex flex-col gap-0.5 border-l border-cyber-border pl-3">
            {item.children!.map(child => (
              <Link
                key={child.href}
                to={child.href}
                onClick={onClick}
                className={clsx(
                  'px-2 py-1.5 rounded text-[13px] transition-colors',
                  childActive(child.href)
                    ? 'text-cyber-red'
                    : 'text-cyber-text-muted hover:text-cyber-text'
                )}
              >
                {child.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link to={item.href ?? '#'} onClick={onClick} className={baseClasses}>
      {content}
    </Link>
  )
}
