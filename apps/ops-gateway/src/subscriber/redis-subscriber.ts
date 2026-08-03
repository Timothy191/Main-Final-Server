import { createClient, type RedisClientType } from 'redis'
import { config } from '../config.js'
import { Logger } from '../logger.js'

const logger = new Logger('redis-subscriber')

export interface Triggerevent {
  id: string
  triggerType: string
  severity: string
  context: Record<string, unknown>
  source?: string
  timestamp: string
}

export type eventCallback = (event: Triggerevent) => void | Promise<void>

let subscriber: RedisClientType | null = null
let onevent: eventCallback | null = null

export function seteventHandler(callback: eventCallback): void {
  onevent = callback
}

export async function startRedisSubscriber(): Promise<void> {
  logger.info('Connecting to Redis for trigger stream...')

  subscriber = createClient({ url: config.redisUrl })
  subscriber.on('error', (err: Error) => {
    logger.error(`Redis error: ${err.message}`)
  })

  await subscriber.connect()
  logger.info('Connected to Redis')

  // Create consumer group (idempotent — errors if exists, which we ignore)
  try {
    await subscriber.xGroupCreate(config.triggerStreamKey, config.triggerConsumerGroup, '0', {
      MKSTREAM: true,
    })
    logger.info(`Created consumer group: ${config.triggerConsumerGroup}`)
  } catch {
    logger.debug('Consumer group already exists')
  }

  // Start the polling loop
  pollStream().catch((e) =>
    logger.error(`Stream polling crashed: ${e instanceof Error ? e.message : String(e)}`)
  )
}

async function pollStream(): Promise<void> {
  if (!subscriber) {
    logger.error('Redis subscriber not connected')
    return
  }

  logger.info(
    `Listening on stream '${config.triggerStreamKey}' as consumer '${config.triggerConsumerName}'`
  )

  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const results = await subscriber.xReadGroup(
        subscriber.commandOptions({ isolated: true }),
        config.triggerConsumerGroup,
        config.triggerConsumerName,
        [
          {
            key: config.triggerStreamKey,
            id: '>',
          },
        ],
        {
          COUNT: 10,
          BLOCK: 5000,
        }
      )

      if (results === null) continue

      for (const stream of results) {
        for (const message of stream.messages) {
          await processMessage(message.id, message.message)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      logger.warn(`Stream read error: ${message}`)
      // Wait before retry on error
      await sleep(1000)
    }
  }
}

async function processMessage(id: string, fields: Record<string, string>): Promise<void> {
  try {
    const payloadRaw = fields['payload']
    if (!payloadRaw) {
      logger.warn(`Message ${id} has no payload field`)
      await ack(id)
      return
    }

    const payload = JSON.parse(payloadRaw) as Record<string, unknown>
    const event: Triggerevent = {
      id,
      triggerType: String(payload['triggerType'] ?? 'UNKNOWN'),
      severity: String(payload['severity'] ?? 'info'),
      context: (payload['context'] as Record<string, unknown>) ?? {},
      source: String(payload['source'] ?? 'unknown'),
      timestamp: String(payload['timestamp'] ?? new Date().toISOString()),
    }

    logger.info(`event: ${event.severity}/${event.triggerType} (${id})`)

    // Notify the incident engine
    if (onevent) {
      await onevent(event)
    }

    await ack(id)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`Failed to process message ${id}: ${message}`)
    // Acknowledge to avoid blocking the stream on malformed messages
    await ack(id)
  }
}

async function ack(messageId: string): Promise<void> {
  if (!subscriber) return
  try {
    await subscriber.xAck(config.triggerStreamKey, config.triggerConsumerGroup, messageId)
  } catch {
    // Non-fatal
  }
}

function sleep(ms: number): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>()
  setTimeout(resolve, ms)
  return promise
}

export async function stopRedisSubscriber(): Promise<void> {
  if (subscriber) {
    await subscriber.disconnect()
    subscriber = null
    logger.info('Redis subscriber disconnected')
  }
}
