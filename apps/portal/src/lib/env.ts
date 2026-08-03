/**
 * Runtime Environment Validation — Zod-powered env var schema.
 *
 * Validates required and optional environment variables at module load time.
 * Fails fast with descriptive messages for missing critical config.
 *
 * Usage:
 *   import { env } from "@/lib/env";
 *   const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
 *
 * NOTE: Public vars (NEXT_PUBLIC_*) are validated but never contain secrets.
 *       Server-only vars are never exposed to the client bundle.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const baseEnvSchema = z.object({
  // ── Public (embedded in client bundle) ───────────────────────────────
  //
  // IMPORTANT:
  // Never ship placeholder Supabase credentials. Missing values should fail
  // fast so the app can't run against dummy/local instances unintentionally.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),

  // ── Server-side required ──────────────────────────────────────────────
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),

  // ── Server — optional with defaults ───────────────────────────────────
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // ── Redis (optional, used only when configured) ──────────────────────
  REDIS_URL: z.string().optional(),

  // ── LLM / AI providers (optional) ─────────────────────────────────────
  OLLAMA_URL: z.string().url().default('http://localhost:11434'),
  OLLAMA_API_KEY: z.string().optional(),
  OLLAMA_DEFAULT_MODEL: z.string().default('gemma4:latest'),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_FREE_MODEL: z.string().default('gemini-2.0-flash-exp'),
  AI_DISPLAY_PROVIDER: z.string().default('google'),
  AI_DISPLAY_MODEL: z.string().default('gemini-2.0-flash-exp'),
  AI_BACKEND_STRATEGY: z.enum(['ollama', 'gemini', 'router', 'omni']).default('ollama'),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  AI_ROUTER_URL: z.string().url().optional(),
  AI_ROUTER_KEY: z.string().optional(),
  AI_EMBEDDING_PROVIDER: z.enum(['local', 'router', 'ollama', 'openai']).default('local'),

  // ── Inference.net Catalyst (optional observability) ───────────────────
  INFERENCE_GATEWAY_ENABLED: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  INFERENCE_API_KEY: z.string().optional(),
  INFERENCE_TASK_ID: z.string().default('arch-portal'),
  INFERENCE_ENVIRONMENT: z.string().default('development'),
  CATALYST_OTLP_TOKEN: z.string().optional(),
  CATALYST_OTLP_ENDPOINT: z.string().url().optional(),
  CATALYST_SERVICE_NAME: z.string().default('portal-ui'),

  // ── Sentry (optional) ─────────────────────────────────────────────────
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),

  // ── External services (optional) ─────────────────────────────────────
  N8N_URL: z.string().url().optional(),
  NEXT_PUBLIC_N8N_URL: z.string().url().optional(),
  N8N_USER: z.string().optional(),
  N8N_PASSWORD: z.string().optional(),
  NEXT_PUBLIC_FUXA_URL: z.string().url().optional(),
  NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID: z.string().optional(),

  // ── Backend NestJS API (optional — defaults to dev orchestration port) ─
  API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_API_URL: z.string().url().optional(),

  // ── Feature flags ─────────────────────────────────────────────────────
  ENABLE_LOAD_ADAPTIVE_TEST: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  DISABLE_RATE_LIMIT: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  // ── Rate limiting ─────────────────────────────────────────────────────
  RATE_LIMIT_IP_WHITELIST: z.string().optional(),
  DISABLE_CORS: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  ALLOWED_ORIGINS: z.string().optional(),

  // ── Inngest / Background jobs ─────────────────────────────────────────
  INNGEST_EVENT_KEY: z.string().optional(),

  // ── Novu (notifications) ──────────────────────────────────────────────
  NOVU_API_KEY: z.string().optional(),

  // ── Observability ─────────────────────────────────────────────────────
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_SERVICE_NAME: z.string().default('arch-portal'),
  ENABLE_DB_TRACING: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
  SLOW_QUERY_THRESHOLD_MS: z.coerce.number().int().positive().default(500),

  // ── Version ────────────────────────────────────────────────────────────
  PORTAL_VERSION: z.string().default('1.0.0'),
  VERCEL_ENV: z.string().optional(),
  CI: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),
})

// Enforce real creds: fail fast if public supabase config is missing.
const envSchema = baseEnvSchema.superRefine((val, ctx) => {
  if (!val.NEXT_PUBLIC_SUPABASE_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Missing NEXT_PUBLIC_SUPABASE_URL',
      path: ['NEXT_PUBLIC_SUPABASE_URL'],
    })
  }
  if (!val.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Missing NEXT_PUBLIC_SUPABASE_ANON_KEY',
      path: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
    })
  }

  // Production safety constraints (explicitly disallow placeholder values).
  if (val.NODE_ENV === 'production') {
    if (val.NEXT_PUBLIC_SUPABASE_URL === 'http://127.0.0.1:54321') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Production must not use localhost Supabase URL',
        path: ['NEXT_PUBLIC_SUPABASE_URL'],
      })
    }
    if (val.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'dummy-anon-key') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Production must not use the dummy anon key',
        path: ['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
      })
    }
  }
})

// ---------------------------------------------------------------------------
// Parsed result (cached singleton)
// ---------------------------------------------------------------------------

type EnvVars = z.infer<typeof baseEnvSchema>

let _env: EnvVars | null = null
let _envError: z.ZodError | null = null

/**
 * Returns validated environment variables.
 * Fails fast if Supabase public credentials are missing/invalid (including dev/test).
 */
function parseEnv(): EnvVars {
  const raw = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,

    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV,

    REDIS_URL: process.env.REDIS_URL,

    OLLAMA_URL: process.env.OLLAMA_URL,
    OLLAMA_API_KEY: process.env.OLLAMA_API_KEY,
    OLLAMA_DEFAULT_MODEL: process.env.OLLAMA_DEFAULT_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_FREE_MODEL: process.env.GEMINI_FREE_MODEL,
    AI_DISPLAY_PROVIDER: process.env.AI_DISPLAY_PROVIDER,
    AI_DISPLAY_MODEL: process.env.AI_DISPLAY_MODEL,
    AI_BACKEND_STRATEGY: process.env.AI_BACKEND_STRATEGY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    AI_ROUTER_URL: process.env.AI_ROUTER_URL,
    AI_ROUTER_KEY: process.env.AI_ROUTER_KEY,
    AI_EMBEDDING_PROVIDER: process.env.AI_EMBEDDING_PROVIDER,

    INFERENCE_GATEWAY_ENABLED: process.env.INFERENCE_GATEWAY_ENABLED,
    INFERENCE_API_KEY: process.env.INFERENCE_API_KEY,
    INFERENCE_TASK_ID: process.env.INFERENCE_TASK_ID,
    INFERENCE_ENVIRONMENT: process.env.INFERENCE_ENVIRONMENT,
    CATALYST_OTLP_TOKEN: process.env.CATALYST_OTLP_TOKEN,
    CATALYST_OTLP_ENDPOINT: process.env.CATALYST_OTLP_ENDPOINT,
    CATALYST_SERVICE_NAME: process.env.CATALYST_SERVICE_NAME,

    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,

    N8N_URL: process.env.N8N_URL,
    NEXT_PUBLIC_N8N_URL: process.env.NEXT_PUBLIC_N8N_URL,
    N8N_USER: process.env.N8N_USER,
    N8N_PASSWORD: process.env.N8N_PASSWORD,
    NEXT_PUBLIC_FUXA_URL: process.env.NEXT_PUBLIC_FUXA_URL,
    NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID: process.env.NEXT_PUBLIC_HIGHLIGHT_PROJECT_ID,

    API_BASE_URL: process.env.API_BASE_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,

    ENABLE_LOAD_ADAPTIVE_TEST: process.env.ENABLE_LOAD_ADAPTIVE_TEST,
    DISABLE_RATE_LIMIT: process.env.DISABLE_RATE_LIMIT,
    RATE_LIMIT_IP_WHITELIST: process.env.RATE_LIMIT_IP_WHITELIST,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    NOVU_API_KEY: process.env.NOVU_API_KEY,

    DISABLE_CORS: process.env.DISABLE_CORS,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,

    OTEL_EXPORTER_OTLP_ENDPOINT: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
    ENABLE_DB_TRACING: process.env.ENABLE_DB_TRACING,
    SLOW_QUERY_THRESHOLD_MS: process.env.SLOW_QUERY_THRESHOLD_MS,

    PORTAL_VERSION: process.env.PORTAL_VERSION,
    VERCEL_ENV: process.env.VERCEL_ENV,
    CI: process.env.CI,
  }

  const result = envSchema.safeParse(raw)

  if (!result.success) {
    _envError = result.error

    const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`)

    // Always fail fast because this file is used at module load time and the
    // portal can't operate safely with placeholder Supabase creds.
    throw new Error('[env] Invalid environment variables:\n  ' + messages.join('\n  '))
  }

  return result.data
}

/**
 * Validated environment variables singleton.
 */
export const env: Readonly<EnvVars> = new Proxy<EnvVars>({} as EnvVars, {
  get(_target, prop: string | symbol) {
    if (!_env) {
      _env = parseEnv()
    }
    return (_env as Record<string, unknown>)[prop as string]
  },
  ownKeys() {
    if (!_env) _env = parseEnv()
    return Object.keys(_env)
  },
  getOwnPropertyDescriptor() {
    return { configurable: true, enumerable: true }
  },
})

/**
 * Returns the parse errors for debugging (null if valid).
 */
export function getEnvErrors(): z.ZodError | null {
  if (!_env) parseEnv()
  return _envError
}

/**
 * Resets the cached env (useful in tests).
 */
export function resetEnv(): void {
  _env = null
  _envError = null
}

/** Returns the validated env singleton (lazy-parsed). */
export function getEnv(): Readonly<EnvVars> {
  if (!_env) {
    _env = parseEnv()
  }
  return _env
}
