import { clsx } from 'clsx'

interface SectionProps {
  title?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  accent?: 'red' | 'purple' | 'blue' | 'green' | 'yellow'
  transparent?: boolean
}

const ACCENT_LINE: Record<string, string> = {
  red: 'border-cyber-red/30',
  purple: 'border-cyber-purple/30',
  blue: 'border-cyber-blue/30',
  green: 'border-cyber-green/30',
  yellow: 'border-cyber-yellow/30',
}

const ACCENT_ICON: Record<string, string> = {
  red: 'text-cyber-red/70',
  purple: 'text-cyber-text-muted/70',
  blue: 'text-cyber-blue/70',
  green: 'text-cyber-green/70',
  yellow: 'text-cyber-yellow/70',
}

export function Section({ title, icon, children, className, accent = 'purple', transparent }: SectionProps) {
  return (
    <div className={clsx(
      'rounded-xl border border-white/[0.05] overflow-hidden',
      transparent ? 'bg-transparent' : 'bg-white/[0.02] backdrop-blur-sm',
      className
    )}>
      {title && (
        <div className={clsx('flex items-center gap-2 px-5 py-3.5 border-b', ACCENT_LINE[accent] || 'border-white/[0.04]')}>
          {icon && <span className={ACCENT_ICON[accent] || 'text-cyber-text-muted/70'}>{icon}</span>}
          <h2 className="text-xs font-semibold text-cyber-text/80 uppercase tracking-wider font-mono">{title}</h2>
        </div>
      )}
      <div className={clsx(title ? 'p-5' : 'p-0')}>
        {children}
      </div>
    </div>
  )
}

export function Grid({ cols = 2, className, children }: { cols?: 1 | 2 | 3 | 4; className?: string; children: React.ReactNode }) {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }
  return (
    <div className={clsx('grid gap-3', gridCols[cols], className)}>
      {children}
    </div>
  )
}

export function Card({ children, className, hover }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={clsx(
      'rounded-xl border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4',
      hover && 'hover:bg-white/[0.03] hover:border-white/[0.08] transition-all duration-300',
      className
    )}>
      {children}
    </div>
  )
}

export function Row({ icon, label, value, valueClass }: { icon?: React.ReactNode; label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="text-cyber-text-muted/50 mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[10px] uppercase tracking-wider text-cyber-text-muted/50 font-mono">{label}</p>
        <p className={clsx('text-sm text-cyber-text/90 truncate font-mono mt-0.5', valueClass)}>{value || '—'}</p>
      </div>
    </div>
  )
}

export function Divider({ className }: { className?: string }) {
  return (
    <div className={clsx('h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent', className)} />
  )
}
