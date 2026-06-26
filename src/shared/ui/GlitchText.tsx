import { HTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface GlitchTextProps extends HTMLAttributes<HTMLSpanElement> {
  intensity?: 'low' | 'medium' | 'high'
}

export const GlitchText = forwardRef<HTMLSpanElement, GlitchTextProps>(
  ({ className, intensity = 'medium', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(
          'relative inline-block',
          {
            'glitch-text': intensity === 'low',
            'glitch-text animate-glitch': intensity === 'medium',
            'glitch-text animate-glitch animate-flicker': intensity === 'high',
          },
          className
        )}
        data-text={typeof children === 'string' ? children : ''}
        {...props}
      >
        {children}
      </span>
    )
  }
)

GlitchText.displayName = 'GlitchText'
