import { Card } from '@/shared/ui/Card'
import { GlitchText } from '@/shared/ui/GlitchText'
import { useCheckerStore } from '../store/checkerStore'
import { Activity, CheckCircle, XCircle, BarChart3 } from 'lucide-react'
import { clsx } from 'clsx'

interface StatsPanelProps {
  className?: string
}

export function StatsPanel({ className }: StatsPanelProps) {
  const { stats } = useCheckerStore()

  const livePercentage = stats.total > 0
    ? ((stats.live / stats.total) * 100).toFixed(1)
    : '0.0'

  const deadPercentage = stats.total > 0
    ? ((stats.dead / stats.total) * 100).toFixed(1)
    : '0.0'

  return (
    <Card className={clsx('bg-cyber-panel/90 backdrop-blur-sm', className)}>
      <div className="p-4 border-b border-cyber-border">
        <GlitchText intensity="low" className="text-xs text-cyber-red font-bold tracking-wider">
          SESSION STATISTICS
        </GlitchText>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-cyber-dark p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={14} className="text-cyber-blue" />
              <span className="text-[10px] text-cyber-text-muted uppercase">Total</span>
            </div>
            <div className="text-xl font-bold text-cyber-blue">
              {stats.total}
            </div>
          </div>

          <div className="bg-cyber-dark p-3 rounded-sm">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 size={14} className="text-cyber-purple" />
              <span className="text-[10px] text-cyber-text-muted uppercase">Rate</span>
            </div>
            <div className="text-xl font-bold text-cyber-purple">
              {livePercentage}%
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle size={14} className="text-cyber-green" />
              <span className="text-xs text-cyber-text-muted">LIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyber-green font-bold">{stats.live}</span>
              <span className="text-[10px] text-cyber-text-muted">({livePercentage}%)</span>
            </div>
          </div>

          <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-cyber-green transition-all duration-500"
              style={{ width: `${livePercentage}%` }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle size={14} className="text-cyber-red" />
              <span className="text-xs text-cyber-text-muted">DEAD</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-cyber-red font-bold">{stats.dead}</span>
              <span className="text-[10px] text-cyber-text-muted">({deadPercentage}%)</span>
            </div>
          </div>

          <div className="h-1.5 bg-cyber-dark rounded-full overflow-hidden">
            <div
              className="h-full bg-cyber-red transition-all duration-500"
              style={{ width: `${deadPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}
