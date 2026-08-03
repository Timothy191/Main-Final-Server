import * as React from 'react'
import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info' | 'outline'

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-arch-surface-tertiary text-arch-text-secondary',
  success: 'bg-arch-accent-mint text-white',
  warning: 'bg-arch-accent-amber text-white',
  error: 'bg-arch-accent-red text-white',
  info: 'bg-arch-accent-charcoal text-white',
  outline: 'border border-arch-border-default text-arch-text-primary',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        'transition-colors duration-150',
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
