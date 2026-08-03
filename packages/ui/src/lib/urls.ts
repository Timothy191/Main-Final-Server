/**
 * @module ui/urls
 * Service URL resolution for external tool integrations (n8n, Flowise, etc.).
 * Reads from `NEXT_PUBLIC_*` env vars with localhost dev fallbacks.
 */

/** Resolved URLs for the portal's external service dependencies. */
export type ServiceUrls = {
  api: string
  portal: string
}

/** Resolve the current API and portal URLs from environment variables. */
export const getServiceUrls = (): ServiceUrls => ({
  api:
    process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_N8N_URL ?? 'http://localhost:5678',
  portal:
    process.env.NEXT_PUBLIC_PORTAL_URL ??
    process.env.NEXT_PUBLIC_FLOWISE_URL ??
    'http://localhost:3001',
})
