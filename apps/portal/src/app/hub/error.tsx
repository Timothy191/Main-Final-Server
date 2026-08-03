'use client'

import { useEffect } from 'react'
import { SecondaryButton } from '@repo/ui/SecondaryButton'
import { isAppError, isNotFoundError } from '@/lib/errors/error-classes'
import { logError } from '@/lib/errors/error-logger'

interface HubErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

function getErrorTitle(error: Error): string {
  if (isNotFoundError(error)) return 'Hub not found'
  if (isAppError(error)) return error.name.replace(/([A-Z])/g, ' $1').trim()
  return 'Hub Error'
}

function getErrorMessage(error: Error): string {
  if (isAppError(error)) return error.message
  return error.message || 'Failed to load hub data.'
}

export default function HubError({ error, reset }: HubErrorProps) {
  useEffect(() => {
    logError(error)
  }, [error])

  const title = getErrorTitle(error)
  const message = getErrorMessage(error)
  const appError = isAppError(error) ? error : null

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-arch-text-primary">{title}</h2>
      <p className="text-arch-text-muted text-sm">{message}</p>
      {(appError as { code?: string } | null) && (
        <div className="text-xs text-arch-text-muted font-mono">
          {(appError as { code?: string }).code}
        </div>
      )}
      <SecondaryButton size="sm" onClick={reset}>
        Try again
      </SecondaryButton>
    </div>
  )
}
