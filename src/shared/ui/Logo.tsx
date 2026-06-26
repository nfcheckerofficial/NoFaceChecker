import { clsx } from 'clsx'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Logo({ size = 'md', className }: LogoProps) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <svg
        viewBox="0 0 100 40"
        className={clsx(
          'fill-current',
          {
            'w-16 h-6': size === 'sm',
            'w-24 h-10': size === 'md',
            'w-32 h-12': size === 'lg',
          }
        )}
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <text
          x="5"
          y="28"
          fontFamily="'Orbitron', sans-serif"
          fontSize="22"
          fontWeight="700"
          fill="#ff0040"
          filter="url(#glow)"
        >
          [CHK]
        </text>
        <line
          x1="5"
          y1="33"
          x2="95"
          y2="33"
          stroke="#ff0040"
          strokeWidth="1.5"
          opacity="0.6"
        />
      </svg>
    </div>
  )
}
