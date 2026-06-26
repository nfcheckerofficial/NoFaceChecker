import { ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  glow?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', glow = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'relative font-mono font-semibold uppercase tracking-wider transition-all duration-300',
          'border-2 border-current',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          {
            'bg-cyber-red/20 text-cyber-red hover:bg-cyber-red/30 hover:shadow-[0_0_20px_rgba(255,0,64,0.5)]': variant === 'primary',
            'bg-cyber-panel text-cyber-text hover:bg-cyber-panel-light': variant === 'secondary',
            'bg-red-900/20 text-red-500 hover:bg-red-900/30': variant === 'danger',
            'bg-cyber-green/20 text-cyber-green hover:bg-cyber-green/30 hover:shadow-[0_0_20px_rgba(0,255,136,0.5)]': variant === 'success',
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-8 py-4 text-base': size === 'lg',
            'shadow-[0_0_10px_currentColor]': glow,
          },
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </button>
    )
  }
)

Button.displayName = 'Button'
