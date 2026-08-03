'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { SecondaryButton } from '@repo/ui/SecondaryButton'
import {
  isAppError,
  isValidationError,
  isAuthError,
  isNotFoundError,
  type AppError,
} from '@/lib/errors/error-classes'
import { logError } from '@/lib/errors/error-logger'

interface RootErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry?: () => void
}

/**
 * Get user-friendly error title based on error type
 */
function getErrorTitle(error: Error): string {
  if (isNotFoundError(error)) return 'Page not found'
  if (isAuthError(error)) return 'Access denied'
  if (isValidationError(error)) return 'Invalid input'
  if (isAppError(error)) {
    // Use the error name for other AppErrors
    return error.name.replace(/([A-Z])/g, ' $1').trim()
  }
  return 'Something went wrong'
}

/**
 * Get user-friendly error message
 */
function getErrorMessage(error: Error): string {
  if (isAppError(error)) {
    // AppError has user-friendly messages
    return error.message
  }
  // Fallback for generic errors
  return error.message || 'An unexpected error occurred. Please try again.'
}

/**
 * Get error context for debugging (only shown in development)
 */
function getErrorContext(error: Error): Record<string, unknown> | null {
  if (isAppError(error) && error.context) {
    return error.context
  }
  return null
}

export default function RootError({ error, reset, unstable_retry }: RootErrorProps) {
  useEffect(() => {
    logError(error)
  }, [error])

  const title = getErrorTitle(error)
  const message = getErrorMessage(error)
  const context = getErrorContext(error)
  const isDev = process.env.NODE_ENV === 'development'
  const appError = isAppError(error) ? (error as AppError) : null

  return (
    <div className="fixed inset-0 z-50 bg-arch-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <Image
            src="/error-pages/404-error.png"
            alt="Error Graphic"
            width={120}
            height={120}
            priority
            className="opacity-80 hover:opacity-100 transition-opacity duration-200"
          />
        </div>
        <div className="space-y-2" role="alert" aria-live="assertive">
          <h1 className="text-3xl font-medium text-arch-text-primary">{title}</h1>
          <p className="text-arch-text-muted text-sm">{message}</p>
        </div>

        {/* Show error code for AppErrors */}
        {appError && (
          <div className="text-xs text-arch-text-muted font-mono">
            Error code: {appError.code}
            {appError.statusCode != null && ` (${appError.statusCode})`}
          </div>
        )}

        {/* Show context in development */}
        {isDev && context && (
          <details className="text-left">
            <summary className="text-xs text-arch-text-muted cursor-pointer">
              Error details (dev only)
            </summary>
            <pre className="mt-2 p-3 bg-arch-surface-secondary rounded text-xs text-arch-text-muted overflow-auto">
              {JSON.stringify(context, null, 2)}
            </pre>
          </details>
        )}

        <SecondaryButton onClick={unstable_retry ?? reset}>Try again</SecondaryButton>
      </div>
    </div>
  )
}
