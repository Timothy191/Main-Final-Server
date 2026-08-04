/**
 * Next.js Instrumentation — Sentry + OpenTelemetry + Catalyst
 *
 * Registers server-side Sentry configuration for Agent Tracing.
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing/
 */

import type { Instrumentation } from 'next'
import * as Sentry from '@sentry/nextjs'

export async function register() {
  // ── Sentry Server Registration ──────────────────────────────────────────
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }

  // ── OpenTelemetry (Vercel/Catalyst) ────────────────────────────────────
  try {
    const { registerOTel } = await import('@vercel/otel')
    registerOTel({
      serviceName:
        process.env.CATALYST_SERVICE_NAME ?? process.env.OTEL_SERVICE_NAME ?? 'portal-ui',
    })
  } catch {
    // @vercel/otel not installed — silently skip
  }

  // ── Catalyst tracing (optional) ────────────────────────────────────────
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.CATALYST_OTLP_TOKEN) {
    try {
      const tracingModule = ['@inference/tracing'].join('')
      const { setup } = await import(/* webpackIgnore: true */ tracingModule)
      await setup({ autoInstrument: true })
    } catch {
      // Module not installed or failed to load — silently skip (expected in local dev)
    }
  }
}

// ── Sentry Error Handler ────────────────────────────────────────────────
export const onRequestError: Instrumentation.onRequestError = Sentry.captureRequestError
