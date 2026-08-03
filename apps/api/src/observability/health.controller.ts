import { Controller, Get, Inject, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { Public } from '../auth/decorators/public.decorator'
import { REDIS_CLIENT } from '../redis/redis.constants'
import type { Redis } from 'ioredis'
import { db } from '@repo/database'

@ApiTags('observability')
@Controller('health')
export class HealthController {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get aggregated system health' })
  async getHealth() {
    const startedAt = Date.now()
    const checks: Record<string, any> = {}
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'

    // 1. Database Check
    try {
      await db.selectFrom('employees').select('id').limit(1).execute()
      checks.database = { status: 'healthy' }
    } catch (err: any) {
      checks.database = { status: 'unhealthy', error: err.message }
      status = 'unhealthy'
    }

    // 2. Redis Check
    try {
      const isReady = this.redis.status === 'ready'
      let redisConnected = isReady
      if (!isReady) {
        const pong = await this.redis.ping()
        redisConnected = pong === 'PONG'
      }
      checks.redis = {
        status: redisConnected ? 'healthy' : 'degraded',
        connected: redisConnected,
      }
      if (!redisConnected && status !== 'unhealthy') {
        status = 'degraded'
      }
    } catch (err: any) {
      checks.redis = { status: 'unhealthy', error: err.message }
      status = 'unhealthy'
    }

    return {
      status,
      timestamp: new Date().toISOString(),
      latencyMs: Date.now() - startedAt,
      checks,
    }
  }

  @Get('live')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Liveness probe' })
  getLive() {
    return { status: 'alive' }
  }

  @Get('ready')
  @Public()
  @ApiOperation({ summary: 'Readiness probe' })
  async getReady() {
    // Both database and redis must be healthy for readiness
    try {
      await db.selectFrom('employees').select('id').limit(1).execute()
    } catch {
      return { status: 'not_ready', reason: 'database' }
    }

    try {
      const isReady = this.redis.status === 'ready'
      if (!isReady) {
        const pong = await this.redis.ping()
        if (pong !== 'PONG') {
          return { status: 'not_ready', reason: 'redis' }
        }
      }
    } catch {
      return { status: 'not_ready', reason: 'redis' }
    }

    return { status: 'ready' }
  }
}
