import { clsx } from 'clsx'

interface SummaryCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  color: string
}

export function SummaryCard({ icon, label, value, color }: SummaryCardProps) {
  return (
    <div className="rounded-lg border border-cyber-border bg-cyber-panel/70 backdrop-blur-sm px-4 py-4">
      <div className="flex items-center gap-3">
        <span className={clsx('w-11 h-11 rounded-md flex items-center justify-center text-white shrink-0', color)}>
          {icon}
        </span>
        <div>
          <p className="text-2xl font-bold text-cyber-text">{value}</p>
          <p className="text-xs text-cyber-text-muted">{label}</p>
        </div>
      </div>
    </div>
  )
}
