import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[11px] text-cyber-text/70 mb-2.5 uppercase tracking-wider font-semibold">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cyber-text-muted/80">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full bg-cyber-dark/80 border-2 border-cyber-border rounded-sm',
              'px-4 py-3.5 text-cyber-text font-mono text-sm tracking-wide',
              'focus:outline-none focus:border-cyber-red focus:bg-cyber-dark focus:shadow-[0_0_12px_rgba(255,0,64,0.25)]',
              'hover:border-cyber-border/80',
              'transition-all duration-300',
              'placeholder:text-cyber-text-muted/50',
              {
                'border-red-500': error,
                'pl-11': icon,
              },
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
