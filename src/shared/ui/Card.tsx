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
          'bg-cyber-panel border border-cyber-border rounded-sm',
          {
            'p-6': !noPadding,
            'border-cyber-red/50 shadow-[0_0_15px_rgba(255,0,64,0.3),0_0_30px_rgba(255,0,64,0.1)]': variant === 'glow',
            'hover:border-cyber-red/30 hover:shadow-[0_0_20px_rgba(255,0,64,0.3)]': !variant || variant === 'default',
          },
          'transform transition-all duration-300',
          'group/card',
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
