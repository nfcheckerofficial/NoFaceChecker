import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'live' | 'dead' | 'warning'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'inline-flex items-center px-2 py-0.5 rounded-sm text-xs font-mono uppercase tracking-wider',
          {
            'bg-cyber-border/50 text-cyber-text-muted': variant === 'default',
            'bg-cyber-green/20 text-cyber-green border border-cyber-green/50': variant === 'live',
            'bg-cyber-red/20 text-cyber-red border border-cyber-red/50': variant === 'dead',
            'bg-cyber-yellow/20 text-cyber-yellow border border-cyber-yellow/50': variant === 'warning',
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    )
  }
)

Badge.displayName = 'Badge'
