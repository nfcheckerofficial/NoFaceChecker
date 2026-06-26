import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface StreamRankProps {
  data: { label: string; value: number }[]
  className?: string
}

function glitchText(text: string): string {
  const chars = '0123456789ABCDEF'
  return text.split('').map(c => Math.random() > 0.92 ? chars[Math.floor(Math.random() * chars.length)] : c).join('')
}

export function StreamRank({ data, className }: StreamRankProps) {
  const [activeRow, setActiveRow] = useState(0)
  const [glitching, setGlitching] = useState(-1)
  const max = Math.max(...data.map(d => d.value), 1)

  useEffect(() => {
    const rowInterval = setInterval(() => setActiveRow(p => (p + 1) % data.length), 2000)
    const glitchInterval = setInterval(() => {
      setGlitching(Math.floor(Math.random() * data.length))
      setTimeout(() => setGlitching(-1), 150)
    }, 4000)
    return () => { clearInterval(rowInterval); clearInterval(glitchInterval) }
  }, [data.length])

  return (
    <div className={clsx('space-y-1.5', className)}>
      {data.map((d, i) => {
        const frac = d.value / max
        const bars = Math.round(frac * 20)
        const isActive = i === activeRow
        const isGlitching = i === glitching

        return (
          <div key={i} className={clsx(
            'flex items-center gap-2 px-2 py-1.5 rounded transition-all duration-300',
            isActive ? 'bg-cyber-blue/10 border border-cyber-blue/20' : 'border border-transparent'
          )}>
            <span className={clsx(
              'w-5 text-[10px] font-mono font-bold text-right',
              isActive ? 'text-cyber-blue' : 'text-cyber-text-muted'
            )}>
              #{i + 1}
            </span>
            <span className={clsx(
              'w-20 text-xs font-mono truncate',
              isGlitching ? 'text-cyber-red' : isActive ? 'text-cyber-text' : 'text-cyber-text-muted'
            )}>
              {isGlitching ? glitchText(d.label) : d.label}
            </span>
            <div className="flex-1 flex gap-[2px]">
              {Array.from({ length: 20 }).map((_, j) => (
                <div key={j} className={clsx(
                  'h-3 flex-1 rounded-sm transition-all duration-200',
                  j < bars
                    ? isActive
                      ? 'bg-cyber-green'
                      : 'bg-cyber-green/40'
                    : 'bg-cyber-dark border border-cyber-border/30'
                )}
                  style={j < bars && isActive ? { boxShadow: '0 0 4px #22c55e66' } : {}}
                />
              ))}
            </div>
            <span className={clsx(
              'w-14 text-[10px] font-mono text-right',
              isActive ? 'text-cyber-green' : 'text-cyber-text-muted'
            )}>
              {d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : d.value}
            </span>
          </div>
        )
      })}
    </div>
  )
}
