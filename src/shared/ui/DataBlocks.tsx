import { clsx } from 'clsx'

interface DataBlock {
  label: string
  value: number
  color?: string
}

interface DataBlocksProps {
  data: DataBlock[]
  className?: string
}

export function DataBlocks({ data, className }: DataBlocksProps) {
  const max = Math.max(...data.map(d => d.value), 1)

  return (
    <div className={clsx('space-y-3', className)}>
      {data.map((d, i) => {
        const frac = d.value / max
        const blocks = Math.max(1, Math.round(frac * 12))
        const color = d.color || 'var(--color-cyber-green)'
        return (
          <div key={i} className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cyber-text-muted">{d.label}</span>
              <span className="text-cyber-text font-mono font-medium">{d.value.toLocaleString()}</span>
            </div>
            <div className="flex gap-[3px]">
              {Array.from({ length: 12 }).map((_, j) => (
                <div
                  key={j}
                  className="h-4 flex-1 rounded-sm transition-all duration-500"
                  style={{
                    background: j < blocks
                      ? `linear-gradient(180deg, ${color}, ${color}66)`
                      : 'var(--color-cyber-dark)',
                    border: j < blocks
                      ? `1px solid ${color}44`
                      : '1px solid var(--color-cyber-border)',
                    boxShadow: j < blocks ? `0 0 4px ${color}44` : 'none',
                  }}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
