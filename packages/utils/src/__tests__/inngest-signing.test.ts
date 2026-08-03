/* eslint-env jest */

// Capture the constructor options passed to Inngest so we can assert the
// signing-key wiring without invoking the real (heavy) client / serve handler.
const capturedOptions: Record<string, unknown>[] = []
jest.mock('inngest', () => {
  const MockInngest = jest.fn((opts: Record<string, unknown>) => {
    capturedOptions.push(opts)
    return { send: jest.fn() }
  })
  return { Inngest: MockInngest }
})

describe('Inngest client signing-key wiring', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    capturedOptions.length = 0
    jest.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterAll(() => {
    process.env = ORIGINAL_ENV
  })

  it('uses the signing key and disables dev mode when NODE_ENV=production', () => {
    process.env.NODE_ENV = 'production'
    process.env.INNGEST_SIGNING_KEY = 'sign-key-123'

    jest.isolateModules(() => {
      require('../inngest')
    })

    expect(capturedOptions).toHaveLength(1)
    const opts = capturedOptions[0] as Record<string, unknown>
    expect(opts.signingKey).toBe('sign-key-123')
    // isDev=false => serve requires a valid signature (cloud mode).
    expect(opts.isDev).toBe(false)
  })

  it('stays in dev mode (unsigned allowed) only when no signing key and not production', () => {
    process.env.NODE_ENV = 'development'
    delete process.env.INNGEST_SIGNING_KEY

    jest.isolateModules(() => {
      require('../inngest')
    })

    const opts = capturedOptions[0] as Record<string, unknown>
    expect(opts.signingKey).toBeUndefined()
    expect(opts.isDev).toBe(true)
  })

  it('stays in cloud mode (signature required) even in development when a signing key is set', () => {
    process.env.NODE_ENV = 'development'
    process.env.INNGEST_SIGNING_KEY = 'sign-key-456'

    jest.isolateModules(() => {
      require('../inngest')
    })

    const opts = capturedOptions[0] as Record<string, unknown>
    expect(opts.signingKey).toBe('sign-key-456')
    expect(opts.isDev).toBe(false)
  })
})
