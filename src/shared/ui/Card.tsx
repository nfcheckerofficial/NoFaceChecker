import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'panel' | 'glow'
  noPadding?: boolean
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', noPadding = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-sm transform transition-all duration-300',
          'group/card',
          {
            'bg-cyber-panel border border-cyber-border': variant === 'default',
            'bg-gradient-to-br from-cyber-panel/80 via-cyber-panel/60 to-cyber-dark/80 border border-cyber-border/50 shadow-[0_0_30px_rgba(0,0,0,0.2)] hover:border-cyber-red/30 hover:shadow-[0_0_20px_rgba(255,0,64,0.3)]': variant === 'panel',
            'border border-cyber-red/50 bg-cyber-panel shadow-[0_0_15px_rgba(255,0,64,0.3),0_0_30px_rgba(255,0,64,0.1)]': variant === 'glow',
            'p-6': !noPadding,
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'
