import { clsx } from 'clsx'

export interface DonutSegment {
  value: number
  color: string
  label?: string
}

interface DonutChartProps {
  segments: DonutSegment[]
  size?: number
  thickness?: number
  className?: string
  /** Etiquetas top/bottom como en la referencia. */
  topLabel?: string
  bottomLabel?: string
  rightLabel?: string
}

export function DonutChart({
  segments,
  size = 220,
  thickness = 22,
  className,
  topLabel,
  bottomLabel,
  rightLabel,
}: DonutChartProps) {
  const radius = (size - thickness) / 2
  const cx = size / 2
  const cy = size / 2
  const circumference = 2 * Math.PI * radius
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1

  let offset = 0

  return (
    <div className={clsx('relative inline-flex', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none" stroke="currentColor" strokeWidth={thickness}
          className="text-cyber-border/50"
        />
        {segments.map((seg, i) => {
          const frac = seg.value / total
          const dash = frac * circumference
          const gap = circumference - dash
          const el = (
            <circle
              key={i}
              cx={cx} cy={cy} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
            />
          )
          offset += dash
          return el
        })}
      </svg>

      {topLabel && (
        <span className="absolute -top-1 left-1/2 -translate-x-1/2 text-[11px] text-cyber-text-muted">
          {topLabel}
        </span>
      )}
      {bottomLabel && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[11px] text-cyber-text-muted">
          {bottomLabel}
        </span>
      )}
      {rightLabel && (
        <span className="absolute top-1/2 -right-6 -translate-y-1/2 text-[11px] text-cyber-text-muted">
          {rightLabel}
        </span>
      )}
    </div>
  )
}
