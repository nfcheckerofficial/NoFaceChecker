import { clsx } from 'clsx'

interface CircularProgressProps {
  /** 0–100. Si se omite y running es true, gira indefinidamente. */
  value?: number
  /** Texto central (ej. "Idle", "23%"). */
  label: string
  running?: boolean
  size?: number
  className?: string
}

export function CircularProgress({
  value = 0,
  label,
  running = false,
  size = 150,
  className,
}: CircularProgressProps) {
  const stroke = 8
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.max(0, Math.min(100, value))
  const offset = circumference - (clamped / 100) * circumference

  return (
    <div
      className={clsx('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className={clsx(running && clamped === 0 && 'animate-spin')}
      >
        {/* Pista base */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-cyber-border"
        />
        {/* Progreso */}
        {(running || clamped > 0) && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={running && clamped === 0 ? circumference * 0.7 : offset}
            className={clsx(
              'text-cyber-green transition-[stroke-dashoffset] duration-500 ease-out',
            )}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )}
      </svg>
      <span
        className={clsx(
          'absolute text-sm font-mono tracking-wide',
          running ? 'text-cyber-green' : 'text-cyber-text-muted'
        )}
      >
        {label}
      </span>
    </div>
  )
}
