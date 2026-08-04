/**
 * Sentry Client Configuration — Agent Tracing + Google GenAI
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing/
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/google-genai/
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // ── Tracing ────────────────────────────────────────────────────────────
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // ── Logs ───────────────────────────────────────────────────────────────
  enableLogs: true,

  // ── Session Replay ─────────────────────────────────────────────────────
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // ── Integrations ───────────────────────────────────────────────────────
  integrations: [Sentry.replayIntegration()],

  // ── Privacy — scrub sensitive fields ───────────────────────────────────
  beforeSend(event) {
    if (event.exception) {
      const error = event.exception.values?.[0]
      if (error?.value?.includes('password') || error?.value?.includes('token')) {
        error.value = '[FILTERED]'
      }
    }
    return event
  },
})
