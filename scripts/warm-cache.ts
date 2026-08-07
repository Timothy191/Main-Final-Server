import { cacheSet } from '../packages/redis/src/cache.js'
import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') })
dotenv.config({ path: resolve(process.cwd(), '.env.local') })

async function warmCache() {
  console.log('🔥 Starting cache pre-warming script...')

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    console.warn(
      '⚠️  REDIS_URL not set. In-memory L1 cache will be warmed, but L2 Redis will be skipped.'
    )
  }

  try {
    // 1. Warm up weather metadata
    const mockWeatherData = {
      temp: 24,
      condition: 'Clear',
      humidity: 45,
      updatedAt: new Date().toISOString(),
    }
    await cacheSet('weather:current', mockWeatherData, 900) // 15 mins
    console.log('✓ Warmed key: weather:current')

    // 2. Warm up system status info
    const mockSystemStatus = {
      status: 'nominal',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    }
    await cacheSet('system:status', mockSystemStatus, 300) // 5 mins
    console.log('✓ Warmed key: system:status')

    // 3. Warm up department list metadata
    const depts = [
      'drilling',
      'production',
      'access-control',
      'engineering',
      'control-room',
      'safety',
      'training',
      'satellite-monitoring',
      'environment',
      'logistics-fleet',
      'geology',
    ]
    await cacheSet('metadata:departments', depts, 86400) // 24 hours
    console.log('✓ Warmed key: metadata:departments')

    console.log('🚀 Cache pre-warming completed successfully!')
    process.exit(0)
  } catch (error) {
    const err = error as Error
    console.error('❌ Cache warming failed:', err.message)
    process.exit(1)
  }
}

warmCache()
