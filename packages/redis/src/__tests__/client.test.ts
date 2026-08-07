/**
 * Tests for @repo/redis/client — connection pooling, retry strategy, health checks.
 *
 * These tests run without an actual Redis server by manipulating environment
 * variables and testing exported utility functions directly.
 *
 * All tests that depend on environment variables use jest.isolateModules()
 * to ensure the module is loaded fresh with each env configuration.
 */

import { describe, it, expect, jest, test } from '@jest/globals'

import { retryStrategy, getRedisConnectionInfo, closeRedis, getClientIfOpen } from '../client'

describe('retryStrategy', () => {
  it('returns a delay for attempt 1 (first retry)', () => {
    const result = retryStrategy(1)
    expect(result).toBeGreaterThanOrEqual(100) // 200ms ± 100ms jitter
    expect(result).toBeLessThanOrEqual(300)
  })

  it('returns a delay for attempt 2', () => {
    const result = retryStrategy(2)
    expect(result).toBeGreaterThanOrEqual(300) // 400ms ± 100ms jitter
    expect(result).toBeLessThanOrEqual(500)
  })

  it('returns a delay for attempt 3', () => {
    const result = retryStrategy(3)
    expect(result).toBeGreaterThanOrEqual(700) // 800ms ± 100ms jitter
    expect(result).toBeLessThanOrEqual(900)
  })

  it('caps delay at 2000ms for large attempt numbers', () => {
    const result = retryStrategy(5)
    expect(result).toBeGreaterThanOrEqual(1900) // 2000ms ± 100ms jitter
    expect(result).toBeLessThanOrEqual(2100)
  })

  it('returns null after 6 attempts (maxReconnectAttempts exhausted)', () => {
    const result = retryStrategy(7)
    expect(result).toBeNull()
  })
})

describe('getRedisConnectionInfo', () => {
  it('returns all required fields', () => {
    const info = getRedisConnectionInfo()
    expect(info).toHaveProperty('connected')
    expect(info).toHaveProperty('status')
    expect(info).toHaveProperty('connectionAttempts')
    expect(info).toHaveProperty('nativeFallback')
  })

  it('returns nativeFallback=true in test environment (no REDIS_URL)', () => {
    jest.isolateModules(() => {
      const { getRedisConnectionInfo: info } = require('../client') as {
        getRedisConnectionInfo: typeof getRedisConnectionInfo
      }
      const result = info()
      expect(result.nativeFallback).toBe(true)
      expect(result.connected).toBe(false)
    })
  })

  it('returns nativeFallback=true when USE_NATIVE_CACHE is true', () => {
    // isolateModules ensures the module is loaded with the specific env
    jest.isolateModules(() => {
      process.env.REDIS_URL = 'redis://localhost:6379'
      process.env.USE_NATIVE_CACHE = 'true'
      process.env.NODE_ENV = 'test'

      const { getRedisConnectionInfo: info } = require('../client') as {
        getRedisConnectionInfo: typeof getRedisConnectionInfo
      }
      const result = info()
      expect(result.nativeFallback).toBe(true)
    })
  })
})

describe('getClientIfOpen', () => {
  it('returns a client (native fallback in test mode)', () => {
    jest.isolateModules(() => {
      const { getClientIfOpen: getClient } = require('../client') as {
        getClientIfOpen: () => any
      }
      const client = getClient()
      expect(client).toBeTruthy()
      expect(typeof client?.get).toBe('function')
      expect(typeof client?.set).toBe('function')
    })
  })
})

describe('closeRedis', () => {
  it('resolves without error when no client is connected', async () => {
    await expect(closeRedis()).resolves.toBeUndefined()
  })
})

describe('startHealthCheck / stopHealthCheck', () => {
  it('stopHealthCheck does not throw when no active timer', () => {
    jest.isolateModules(() => {
      const { stopHealthCheck: stop } = require('../client') as {
        stopHealthCheck: () => void
      }
      expect(() => stop()).not.toThrow()
    })
  })

  it('startHealthCheck starts a timer without error', () => {
    jest.isolateModules(() => {
      const { startHealthCheck: start, stopHealthCheck: stop } = require('../client') as {
        startHealthCheck: (client: any) => void
        stopHealthCheck: () => void
      }
      const mockClient = {
        status: 'ready',
        ping: jest.fn().mockResolvedValue('PONG'),
      }
      expect(() => start(mockClient)).not.toThrow()
      stop()
    })
  })

  it('startHealthCheck with null client does not throw', () => {
    jest.isolateModules(() => {
      const { startHealthCheck: start, stopHealthCheck: stop } = require('../client') as {
        startHealthCheck: (client: any) => void
        stopHealthCheck: () => void
      }
      expect(() => start(null)).not.toThrow()
      stop()
    })
  })
})
