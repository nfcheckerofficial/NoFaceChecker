import { clsx } from 'clsx'

export interface BarDatum {
  label: string
  value: number
}

interface BarChartProps {
  data: BarDatum[]
  height?: number
  color?: string
  className?: string
}

export function BarChart({
  data,
  height = 280,
  color = 'var(--color-cyber-green)',
  className,
}: BarChartProps) {
  const max = Math.max(...data.map(d => d.value), 1)
  // Marcas del eje Y (5 niveles).
  const steps = 4
  const ticks = Array.from({ length: steps + 1 }, (_, i) =>
    Math.round((max / steps) * (steps - i))
  )

  return (
    <div className={clsx('flex w-full', className)} style={{ height }}>
      {/* Eje Y */}
      <div className="flex flex-col justify-between pr-2 text-[10px] text-cyber-text-muted text-right">
        {ticks.map((t, i) => (
          <span key={i}>{t >= 1000 ? `${Math.round(t / 1000)}K` : t}</span>
        ))}
      </div>

      {/* Área de barras */}
      <div className="flex-1 relative">
        {/* Líneas guía */}
        <div className="absolute inset-0 flex flex-col justify-between">
          {ticks.map((_, i) => (
            <div key={i} className="border-t border-cyber-border/40" />
          ))}
        </div>

        <div className="relative h-full flex items-end justify-around gap-2 pb-6">
          {data.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
              <div
                className="w-full max-w-[40px] rounded-t-sm transition-all"
                style={{
                  height: `${(d.value / max) * 100}%`,
                  background: `linear-gradient(180deg, ${color}, ${color}aa)`,
                }}
                title={`${d.label}: ${d.value}`}
              />
              <span className="absolute bottom-0 text-[10px] text-cyber-text-muted truncate max-w-[60px]">
                {d.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
