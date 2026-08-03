import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  /** Login card fields — applies `.login-field` without conflicting default Input chrome. */
  variant?: 'default' | 'login'
}

const inputVariants = {
  default: cn(
    'flex h-10 w-full rounded-lg border px-3 py-2 text-sm',
    'bg-card border-arch-border-default',
    'text-arch-text-primary placeholder:text-arch-text-muted',
    'transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    'disabled:cursor-not-allowed disabled:opacity-50',
    'file:border-0 file:bg-transparent file:text-sm file:font-medium'
  ),
  login: cn(
    'login-field block w-full min-w-0 max-w-full h-11 box-border px-3 text-[14px] font-medium',
    'text-[var(--text-heading)] outline-none',
    'transition-[border-color,box-shadow,background-color] duration-200',
    'disabled:opacity-50'
  ),
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, variant = 'default', ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          inputVariants[variant],
          variant === 'default' &&
            error &&
            'border-arch-accent-red focus-visible:ring-arch-accent-red',
          className
        )}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'
