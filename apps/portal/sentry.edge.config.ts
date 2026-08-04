/**
 * Sentry Edge Configuration — Agent Tracing + Google GenAI
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing/
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // ── Tracing ────────────────────────────────────────────────────────────
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // ── Logs ───────────────────────────────────────────────────────────────
  enableLogs: true,
})
