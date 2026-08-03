'use client'

import { useEffect } from 'react'
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
    // Log to console in development; Sentry is initialized via instrumentation.ts
    if (process.env.NODE_ENV === 'development') {
      console.error('Global error:', error)
    }
  }, [error])

  return (
    <html lang="en">
      <body>
        <RootError error={error} reset={reset} unstable_retry={unstable_retry} />
      </body>
    </html>
  )
}
