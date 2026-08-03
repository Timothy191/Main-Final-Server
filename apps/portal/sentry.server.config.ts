import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  // Only capture errors in production to reduce noise
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,
  beforeSend(event) {
    // Scrub potentially sensitive fields from server events
    if (event.request?.headers) {
      const scrubbed = new Set(['authorization', 'cookie', 'x-internal-secret'])
      for (const key of Object.keys(event.request.headers)) {
        if (scrubbed.has(key.toLowerCase())) {
          event.request.headers[key] = '[redacted]'
        }
      }
    }
    return event
  },
})
