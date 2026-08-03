import { opsClient } from '../ops-client.js'
import { Logger } from '../logger.js'
import { config } from '../config.js'

const logger = new Logger('health-poller')

export type HealthStatus = 'healthy' | 'degraded' | 'unreachable'

export interface PolledHealth {
  status: HealthStatus
  summary: Record<string, unknown>
  timestamp: string
}

let latestHealth: PolledHealth | null = null

export function getLatestHealth(): PolledHealth | null {
  return latestHealth
}

export async function pollHealth(): Promise<void> {
  try {
    const summary = await opsClient.getSystemSummary()
    const status: HealthStatus = summary.healthy ? 'healthy' : 'degraded'
    latestHealth = {
      status,
      summary: summary as unknown as Record<string, unknown>,
      timestamp: new Date().toISOString(),
    }
    logger.debug(`Health: ${status}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.warn(`Health poll failed: ${message}`)
    latestHealth = {
      status: 'unreachable',
      summary: { error: message },
      timestamp: new Date().toISOString(),
    }
  }
}

export function startHealthPoller(): void {
  logger.info(`Starting health poller (interval: ${config.healthPollIntervalMs}ms)`)

  // Immediate first poll
  pollHealth().catch((e) =>
    logger.error(`Initial health poll failed: ${e instanceof Error ? e.message : String(e)}`)
  )

  setInterval(() => {
    pollHealth().catch((e) =>
      logger.error(`Health poll cycle failed: ${e instanceof Error ? e.message : String(e)}`)
    )
  }, config.healthPollIntervalMs)
}
