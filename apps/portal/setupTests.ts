import '@testing-library/jest-dom'
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = global.TextEncoder || TextEncoder
global.TextDecoder = global.TextDecoder || (TextDecoder as unknown as typeof globalThis.TextDecoder)

// StructuredClone polyfill for jsdom (required by fake-indexeddb v6+)
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))
}

// Mock HTMLCanvasElement.prototype.getContext
if (typeof window !== 'undefined' && typeof window.HTMLCanvasElement !== 'undefined') {
  window.HTMLCanvasElement.prototype.getContext = jest.fn((contextId: string) => {
    if (contextId === '2d') {
      return {
        fillRect: jest.fn(),
        clearRect: jest.fn(),
        getImageData: jest.fn(),
        putImageData: jest.fn(),
        createImageData: jest.fn(),
        setTransform: jest.fn(),
        drawImage: jest.fn(),
        save: jest.fn(),
        restore: jest.fn(),
        scale: jest.fn(),
        rotate: jest.fn(),
        translate: jest.fn(),
        transform: jest.fn(),
        beginPath: jest.fn(),
        moveTo: jest.fn(),
        lineTo: jest.fn(),
        fill: jest.fn(),
        stroke: jest.fn(),
        clip: jest.fn(),
        quadraticCurveTo: jest.fn(),
        bezierCurveTo: jest.fn(),
        arc: jest.fn(),
        rect: jest.fn(),
        fillText: jest.fn(),
        measureText: jest.fn(),
        strokeText: jest.fn(),
        createLinearGradient: jest.fn(),
        createRadialGradient: jest.fn(),
        createPattern: jest.fn(),
      } as unknown as CanvasRenderingContext2D
    }
    return null
  }) as HTMLCanvasElement['getContext']
}

// Override environment variables to prevent local development .env from polluting tests
process.env.DISABLE_RATE_LIMIT = 'false'
process.env.NEXT_PUBLIC_FUXA_URL = 'http://localhost:1881'
// Empty strings fail Zod .url().optional() — delete so they resolve as undefined
delete process.env.NEXT_PUBLIC_SENTRY_DSN
delete process.env.OTEL_EXPORTER_OTLP_ENDPOINT
process.env.NEXT_PUBLIC_SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key'
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-anon-key'
process.env.SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test-service-key'

// Jest setup file — provide Web API globals that Next.js server modules expect

// but jsdom may not define in all versions.

global.Request =
  global.Request ||
  class Request {
    url: string
    constructor(input: string | Request) {
      this.url = typeof input === 'string' ? input : input.url
    }
  }

global.Response =
  global.Response ||
  class Response {
    status: number
    constructor(_body?: BodyInit | null, _init?: ResponseInit) {
      this.status = _init?.status ?? 200
    }
  }

// Global mock for redis to avoid database connection timeout/hangs in tests
jest.mock('@repo/redis', () => {
  const actual = jest.requireActual('@repo/redis')
  const mockCache = new Map<string, string>()
  const mockRedisClient = {
    get: jest.fn(async (key: string) => mockCache.get(key) ?? null),
    set: jest.fn(async (key: string, value: string) => {
      mockCache.set(key, value)
    }),
    del: jest.fn(async (key: string) => {
      mockCache.delete(key)
    }),
    incr: jest.fn(async (key: string) => {
      const val = parseInt(mockCache.get(key) || '0', 10) + 1
      mockCache.set(key, val.toString())
      return val
    }),
    // AGENT-TRACE: Mock expire function - parameters prefixed with underscore to fix ESLint warnings
    // These are unused in the mock implementation but required for interface compatibility
    expire: jest.fn(async (_key: string, _seconds: number) => {
      return true
    }),
    // AGENT-TRACE: Align flushDb name with actual client type
    flushDb: jest.fn(async () => {
      mockCache.clear()
    }),
    isOpen: true,
  }
  return {
    ...actual,
    getRedisClient: jest.fn(async () => mockRedisClient),
    closeRedis: jest.fn(async () => {}),
  }
})

// Mock window.matchMedia and IntersectionObserver only if running in a browser-like environment (jsdom)
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // Deprecated
      removeListener: jest.fn(), // Deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })

  // Mock IntersectionObserver
  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | Document | null = null
    readonly rootMargin: string = '0px'
    readonly thresholds: ReadonlyArray<number> = [0]
    observe = jest.fn()
    disconnect = jest.fn()
    unobserve = jest.fn()
    takeRecords = jest.fn<IntersectionObserverEntry[], []>(() => [])
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  })

  global.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver
}
