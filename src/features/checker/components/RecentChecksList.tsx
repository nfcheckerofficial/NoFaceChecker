import { useCheckerStore } from '../store/checkerStore'
import { clsx } from 'clsx'

interface RecentChecksListProps {
  limit?: number
  className?: string
}

export function RecentChecksList({ limit = 10, className }: RecentChecksListProps) {
  const { history } = useCheckerStore()

  if (history.length === 0) {
    return (
      <div className={clsx('text-xs text-cyber-text-muted text-center py-4', className)}>
        No checks performed yet
      </div>
    )
  }

  return (
    <div className={clsx('space-y-2 max-h-64 overflow-y-auto', className)}>
      {history.slice(0, limit).map((result, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-2 border-b border-cyber-border/50 last:border-0"
        >
          <span className="text-[10px] text-cyber-text-muted font-mono">
            {result.cardNumber.slice(-7)}
          </span>
          <span
            className={clsx(
              'text-[10px] font-bold uppercase',
              result.status === 'live' ? 'text-cyber-green' : 'text-cyber-red'
            )}
          >
            {result.status}
          </span>
        </div>
      ))}
    </div>
  )
}
