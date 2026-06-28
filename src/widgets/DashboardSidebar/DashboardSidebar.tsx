import { useState, useMemo, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { ChevronRight, X } from 'lucide-react'
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

  // Close sidebar on route change (mobile)
  useEffect(() => {
    onClose?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleNav = () => onClose?.()

  return (
      <aside
        className={clsx(
          'flex-col w-[280px] shrink-0',
          'overflow-x-hidden overflow-y-auto',
          // Desktop: always visible
          'lg:flex lg:sticky lg:top-0 lg:max-h-screen',
          // Mobile: overlay when open, hidden when closed
          open
            ? 'fixed inset-y-0 left-0 z-50 flex max-h-screen motion-safe:animate-[slideInLeft_0.25s_ease-out]'
            : 'hidden',
          'bg-gradient-to-b from-cyber-dark/95 via-cyber-panel/90 to-cyber-black/95',
          'backdrop-blur-xl border-r border-cyber-border/50',
          className
        )}
      >
      {/* Mobile header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-cyber-dark/90 backdrop-blur-md border-b border-cyber-border/30 lg:hidden">
        <span className="font-orbitron text-sm font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyber-red to-cyber-purple">
          NO FACE
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-cyber-text-muted hover:text-cyber-text hover:bg-cyber-panel transition-all"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex flex-col py-3 lg:py-4">
        {groups.map((group, gi) => (
          <div key={gi}>
            {gi > 0 && <div className="my-2 lg:my-3 mx-4 border-t border-cyber-border/40" />}
            <div className="flex flex-col gap-0.5 px-2 lg:px-3">
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
          'flex items-center justify-center w-7 h-7 lg:w-8 lg:h-8 rounded-full shrink-0 transition-all duration-300',
          active ? clsx(circle, 'scale-110') : circle
        )}
      >
        <Icon size={14} className="lg:hidden shrink-0 text-white" strokeWidth={2.5} />
        <Icon size={16} className="hidden lg:block shrink-0 text-white" strokeWidth={2.25} />
      </span>
      <span className={clsx('flex-1 truncate text-xs lg:text-sm', active && 'font-semibold')}>
        {item.label}
      </span>
      {hasChildren && (
        <ChevronRight
          size={13}
          className={clsx('shrink-0 transition-transform duration-300 text-cyber-text-muted/70', isOpen && 'rotate-90')}
        />
      )}
    </>
  )

  const baseClasses = clsx(
    'flex items-center gap-2.5 lg:gap-3 px-3 lg:px-2.5 py-2.5 lg:py-2 rounded-lg text-sm transition-all duration-200 w-full text-left',
    'active:scale-[0.98]',
    active
      ? 'bg-gradient-to-r from-cyber-red/10 to-cyber-purple/10 text-cyber-text border border-cyber-red/30 shadow-[0_0_15px_rgba(255,0,64,0.08)]'
      : 'text-cyber-text-muted hover:bg-cyber-panel-light/50 hover:text-cyber-text/90 border border-transparent'
  )

  if (hasChildren) {
    return (
      <div>
        <button onClick={onToggle} className={baseClasses}>
          {content}
        </button>
        {isOpen && (
          <div className="ml-9 lg:ml-11 mt-0.5 flex flex-col gap-0.5 border-l border-cyber-border/50 pl-2.5 lg:pl-3">
            {item.children!.map(child => (
              <Link
                key={child.href}
                to={child.href}
                onClick={onClick}
                className={clsx(
                  'px-2.5 lg:px-2 py-2 lg:py-1.5 rounded text-xs lg:text-[13px] transition-all duration-200',
                  'hover:bg-cyber-panel-light/30',
                  childActive(child.href)
                    ? 'text-cyber-red font-semibold bg-cyber-red/5'
                    : 'text-cyber-text-muted/80 hover:text-cyber-text'
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
