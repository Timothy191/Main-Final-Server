'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { SecondaryButton } from '@repo/ui/SecondaryButton'
import { isAppError, isNotFoundError, isAuthError } from '@/lib/errors/error-classes'
import { logError } from '@/lib/errors/error-logger'

interface DepartmentErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function getErrorTitle(error: Error): string {
  if (isNotFoundError(error)) return 'Department not found'
  if (isAuthError(error)) return 'Access denied'
  if (isAppError(error)) return error.name.replace(/([A-Z])/g, ' $1').trim()
  return 'Department Error'
}

function getErrorMessage(error: Error): string {
  if (isAppError(error)) return error.message
  return error.message || 'Failed to load department data.'
}

function getActionLink(error: Error): { href: string; label: string } {
  if (isNotFoundError(error)) {
    return { href: '/', label: 'Back to Hub' }
  }
  if (isAuthError(error)) {
    return { href: '/login', label: 'Sign in' }
  }
  return { href: '/', label: 'Back to Hub' }
}

export default function DepartmentError({ error, reset }: DepartmentErrorProps) {
  useEffect(() => {
    logError(error)
  }, [error])

  const title = getErrorTitle(error)
  const message = getErrorMessage(error)
  const action = getActionLink(error)
  const appError = isAppError(error) ? error : null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-arch-text-primary">{title}</h2>
      <p className="text-arch-text-muted text-sm">{message}</p>
      {appError && (
        <div className="text-xs text-arch-text-muted font-mono">
          {(appError as { code?: string }).code}
          {(appError as { statusCode?: number }).statusCode &&
            ` (${(appError as { statusCode?: number }).statusCode})`}
        </div>
      )}
      <div className="flex items-center gap-3">
        <SecondaryButton size="sm" onClick={reset}>
          Try again
        </SecondaryButton>
        <Link
          href={action.href}
          className="px-4 py-2 rounded-full text-arch-text-muted text-sm hover:text-arch-text-primary transition-colors"
        >
          {action.label}
        </Link>
      </div>
    </div>
  )
}
