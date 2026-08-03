import * as React from 'react'
import { Loader2, Inbox, AlertCircle } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

/**
 * Shared loading / empty / error state primitives.
 *
 * These consolidate the ~30 inline re-implementations of spinner, empty, and
 * error markup across the portal (see docs/component-consolidation-audit.md §6-8).
 * They are presentational and server-renderable (no "use client"). Visual tokens
 * are intentionally the current design-system values; the Vercel reskin in Phase 3
 * retargets the underlying tokens, not these components.
 */

const spinnerSize = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const

export interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: keyof typeof spinnerSize
  label?: string
}

export function Spinner({ size = 'md', label, className, ...props }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label={label ?? 'Loading'}
      className={cn('inline-flex items-center justify-center', className)}
      {...props}
    >
      <Loader2 className={cn('animate-spin', spinnerSize[size])} />
    </span>
  )
}

export interface LoadingStateProps {
  label?: string
  className?: string
  iconSize?: keyof typeof spinnerSize
}

export function LoadingState({
  label = 'Loading...',
  className,
  iconSize = 'md',
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 text-[var(--text-secondary)] text-sm',
        className
      )}
    >
      <Spinner size={iconSize} />
      <span>{label}</span>
    </div>
  )
}

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'No data found',
  description,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 py-8 text-center text-[var(--text-secondary)] text-sm',
        className
      )}
    >
      {icon ?? <Inbox className="h-6 w-6 text-[var(--text-muted)]" />}
      <p className="font-medium text-[var(--text-body)]">{title}</p>
      {description ? <p className="text-[var(--text-muted)]">{description}</p> : null}
    </div>
  )
}

export interface FieldErrorProps {
  id?: string
  message?: string
  className?: string
}

export function FieldError({ id, message, className }: FieldErrorProps) {
  if (!message) return null
  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className={cn('text-[var(--accent-red)] text-xs', className)}
    >
      {message}
    </p>
  )
}

export interface FormErrorProps {
  message?: string
  className?: string
}

export function FormError({ message, className }: FormErrorProps) {
  if (!message) return null
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex items-center gap-2 rounded-lg border border-[var(--accent-red)]/30 bg-[var(--accent-red)]/10 px-3 py-2 text-sm text-[var(--accent-red)]',
        className
      )}
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  )
}
