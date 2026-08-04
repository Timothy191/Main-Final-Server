'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import RootError from './error'

export default function GlobalError({
  error,
  reset,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  reset: () => void
  unstable_retry?: () => void
}) {
  useEffect(() => {
    // Capture in Sentry — this is a last-resort boundary for root layout errors
    Sentry.captureException(error)
    Sentry.logger.error('Global error boundary triggered', {
      error_message: error.message,
      error_name: error.name,
      digest: error.digest,
    })
  }, [error])

  return (
    <html lang="en">
      <body>
        <RootError error={error} reset={reset} unstable_retry={unstable_retry} />
      </body>
    </html>
  )
}
