import { clsx } from 'clsx'

interface NeoGaugeProps {
  value: number
  max: number
  label: string
  sublabel?: string
  color?: string
  size?: number
  className?: string
}

export function NeoGauge({
  value,
  max,
  label,
  sublabel,
  color = '#22c55e',
  size = 180,
  className,
}: NeoGaugeProps) {
  const cx = size / 2
  const cy = size / 2
  const radius = (size - 28) / 2
  const stroke = 8

  const frac = Math.min(value / max, 1)
  const sweep = 270
  const startAngle = 135
  const endAngle = startAngle + sweep * frac
  const startRad = (startAngle * Math.PI) / 180
  const endRad = (endAngle * Math.PI) / 180

  const x1 = cx + radius * Math.cos(startRad)
  const y1 = cy + radius * Math.sin(startRad)
  const x2 = cx + radius * Math.cos(endRad)
  const y2 = cy + radius * Math.sin(endRad)
  const largeArc = frac > 0.5 ? 1 : 0

  return (
    <div className={clsx('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <path
          d={`M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          className="drop-shadow-[0_0_6px_rgba(34,197,94,0.5)]"
          style={{
            filter: `drop-shadow(0 0 6px ${color}88)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tracking-wider" style={{ color }}>{label}</span>
        {sublabel && <span className="text-[10px] text-cyber-text-muted mt-0.5">{sublabel}</span>}
      </div>
    </div>
  )
}
