/**
 * Tests for Runtime Environment Validation (lib/env.ts).
 *
 * Strategy:
 *   - The module caches validated env in an internal singleton (`_env`).
 *   - `resetEnv()` clears that cache between tests.
 *   - We import fresh each test to get a clean reference, then call resetEnv().
 *   - process.env is carefully saved/restored in afterEach.
 */

import { env, resetEnv, getEnvErrors } from '@/lib/env'

/**
 * Helper to set env vars that TypeScript considers read-only (e.g. NODE_ENV).
 * Uses delete + defineProperty to bypass the readonly restriction.
 */
function setEnvVar(name: string, value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>
  if (value === undefined) {
    delete env[name]
  } else {
    env[name] = value
  }
}

describe('env validation', () => {
  // Snapshot of env vars we touch
  const ENV_KEYS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'DATABASE_URL',
    'PORT',
    'NODE_ENV',
    'REDIS_URL',
    'OPENAI_API_KEY',
    'OPENAI_MODEL',
    'ENABLE_LOAD_ADAPTIVE_TEST',
    'DISABLE_RATE_LIMIT',
    'CI',
    'INNGEST_EVENT_KEY',
    'OTEL_SERVICE_NAME',
    'PORTAL_VERSION',
    'SENTRY_ORG',
    'SENTRY_PROJECT',
    'SENTRY_AUTH_TOKEN',
    'NEXT_PUBLIC_SENTRY_DSN',
    'SENTRY_DSN',
    'N8N_URL',
    'N8N_USER',
    'N8N_PASSWORD',
    'FLOWISE_URL',
    'NEXT_PUBLIC_FUXA_URL',
    'NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID',
    'RATE_LIMIT_IP_WHITELIST',
    'DISABLE_CORS',
    'ALLOWED_ORIGINS',
    'NOVU_API_KEY',
    'OTEL_EXPORTER_OTLP_ENDPOINT',
    'ENABLE_DB_TRACING',
    'SLOW_QUERY_THRESHOLD_MS',
    'VERCEL_ENV',
  ] as const

  const saved: Record<string, string | undefined> = {}

  beforeAll(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key]
    }
  })

  beforeEach(() => {
    // Ensure required Supabase vars are always set for every test
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      setEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    }
  })

  afterEach(() => {
    // Restore env vars via helper to handle readonly properties
    for (const key of ENV_KEYS) {
      setEnvVar(key, saved[key])
    }
    resetEnv()
  })

  it('provides defaults when no env vars are set', () => {
    for (const key of ENV_KEYS) {
      setEnvVar(key, undefined)
    }
    // Clear the DISABLE_RATE_LIMIT that setupTests.ts sets
    setEnvVar('DISABLE_RATE_LIMIT', undefined)
    // Set required Supabase values (superRefine enforces these)
    setEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321')
    setEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-anon-key')
    resetEnv()

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('http://127.0.0.1:54321')
    expect(env.PORT).toBe(3000)
    expect(env.NODE_ENV).toBe('development')
    expect(env.OTEL_SERVICE_NAME).toBe('arch-portal')
    expect(env.PORTAL_VERSION).toBe('1.0.0')
    expect(env.CI).toBe(false)
    expect(env.DISABLE_RATE_LIMIT).toBe(false)
  })

  it('picks up custom env var values', () => {
    setEnvVar('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co')
    setEnvVar('PORT', '8080')
    setEnvVar('NODE_ENV', 'production')
    setEnvVar('OTEL_SERVICE_NAME', 'my-custom-service')
    resetEnv()

    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe('https://example.supabase.co')
    expect(env.PORT).toBe(8080)
    expect(env.NODE_ENV).toBe('production')
    expect(env.OTEL_SERVICE_NAME).toBe('my-custom-service')
  })

  it('coerces PORT to a number', () => {
    setEnvVar('PORT', '4000')
    resetEnv()

    expect(env.PORT).toBe(4000)
    expect(typeof env.PORT).toBe('number')
  })

  it('transforms feature flag strings to booleans', () => {
    setEnvVar('ENABLE_LOAD_ADAPTIVE_TEST', 'true')
    setEnvVar('DISABLE_RATE_LIMIT', 'true')
    setEnvVar('CI', 'true')
    resetEnv()

    expect(env.ENABLE_LOAD_ADAPTIVE_TEST).toBe(true)
    expect(env.DISABLE_RATE_LIMIT).toBe(true)
    expect(env.CI).toBe(true)
  })

  it('treats non-true feature flags as false', () => {
    setEnvVar('ENABLE_LOAD_ADAPTIVE_TEST', '0')
    setEnvVar('DISABLE_RATE_LIMIT', 'FALSE')
    setEnvVar('CI', undefined)
    resetEnv()

    expect(env.ENABLE_LOAD_ADAPTIVE_TEST).toBe(false)
    expect(env.DISABLE_RATE_LIMIT).toBe(false)
    expect(env.CI).toBe(false)
  })

  it('resetEnv clears cached values so new env vars take effect', () => {
    setEnvVar('PORT', undefined)
    resetEnv()
    expect(env.PORT).toBe(3000)

    setEnvVar('PORT', '9999')
    resetEnv()

    expect(env.PORT).toBe(9999)
  })

  it('getEnvErrors returns null when validation passes', () => {
    resetEnv()
    // Access env to trigger parsing
    const _ = env.PORT
    expect(getEnvErrors()).toBeNull()
    void _
  })

  it('reads optional vars as undefined when not set', () => {
    setEnvVar('REDIS_URL', undefined)
    setEnvVar('OPENAI_API_KEY', undefined)
    resetEnv()

    expect(env.REDIS_URL).toBeUndefined()
    expect(env.OPENAI_API_KEY).toBeUndefined()
  })
})
