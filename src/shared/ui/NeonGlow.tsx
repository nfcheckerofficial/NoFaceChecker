import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface NeonGlowProps extends HTMLAttributes<HTMLDivElement> {
  color?: 'red' | 'green' | 'blue' | 'purple'
  pulse?: boolean
}

export const NeonGlow = forwardRef<HTMLDivElement, NeonGlowProps>(
  ({ className, color = 'red', pulse = false, children, ...props }, ref) => {
    const colorClasses = {
      red: 'text-cyber-red shadow-[0_0_5px_currentColor,0_0_10px_currentColor,0_0_20px_currentColor]',
      green: 'text-cyber-green shadow-[0_0_5px_currentColor,0_0_10px_currentColor,0_0_20px_currentColor]',
      blue: 'text-cyber-blue shadow-[0_0_5px_currentColor,0_0_10px_currentColor,0_0_20px_currentColor]',
      purple: 'text-cyber-purple shadow-[0_0_5px_currentColor,0_0_10px_currentColor,0_0_20px_currentColor]',
    }

    return (
      <div
        ref={ref}
        className={clsx(
          'inline-block',
          colorClasses[color],
          {
            'animate-pulse-neon': pulse,
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

NeonGlow.displayName = 'NeonGlow'
