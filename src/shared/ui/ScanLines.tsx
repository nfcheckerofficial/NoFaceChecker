import { clsx } from 'clsx'

interface ScanLinesProps {
  className?: string
}

export function ScanLines({ className }: ScanLinesProps) {
  return (
    <div
      className={clsx(
        'fixed inset-0 pointer-events-none z-50',
        'bg-repeating-linear-gradient',
        className
      )}
      style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.1) 2px, rgba(0, 0, 0, 0.1) 4px)',
        animation: 'scanline 8s linear infinite',
      }}
    />
  )
}
