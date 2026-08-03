import type { Instrumentation } from 'next'
import { registerOTel } from '@vercel/otel'

export async function register() {
  registerOTel({
    serviceName: process.env.CATALYST_SERVICE_NAME ?? process.env.OTEL_SERVICE_NAME ?? 'portal-ui',
  })

  // Catalyst tracing — only in Node.js runtime when token is present (optional dependency)
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.CATALYST_OTLP_TOKEN) {
    try {
      // Dynamic path prevents Turbopack/Webpack from statically resolving (and warning about) the optional dep
      const tracingModule = ['@inference/tracing'].join('')
      const { setup } = await import(/* webpackIgnore: true */ tracingModule)
      await setup({
        autoInstrument: true,
      })
    } catch (_error) {
      // Module not installed or failed to load — silently skip (expected in local dev)
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const message = err instanceof Error ? err.message : String(err)
  const digest =
    typeof err === 'object' && err !== null && 'digest' in err
      ? String((err as { digest?: string }).digest)
      : undefined

  if (process.env.NODE_ENV === 'development') {
    console.error(
      `[Server Error] Path: ${request.path} | Method: ${request.method} | Message: ${message}`,
      { digest, context }
    )
  }
}
