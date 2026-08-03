import * as React from 'react'
import { cn } from '../../lib/utils'

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link'
type Size = 'sm' | 'md' | 'lg'

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-arch-accent-charcoal text-white hover:bg-arch-accent-brand-hover focus-visible:ring-arch-accent-charcoal',
  secondary:
    'bg-arch-surface-secondary text-arch-text-primary hover:bg-arch-surface-tertiary focus-visible:ring-arch-border-emphasis border border-arch-border-default',
  ghost:
    'bg-transparent text-arch-text-secondary hover:bg-arch-surface-tertiary hover:text-arch-text-primary focus-visible:ring-arch-border-emphasis',
  destructive: 'bg-arch-accent-red text-white hover:opacity-90 focus-visible:ring-arch-accent-red',
  outline:
    'bg-transparent border border-arch-border-default text-arch-text-secondary hover:bg-arch-surface-tertiary hover:text-arch-text-primary focus-visible:ring-arch-border-emphasis',
  link: 'bg-transparent underline underline-offset-4 hover:underline',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
          'transition-all duration-150 focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          'disabled:pointer-events-none disabled:opacity-50',
          'select-none',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'
