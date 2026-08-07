import { createPubSubClient } from './client.js'

export interface AlarmNotification {
  id: string
  equipmentId: string
  severity: 'critical' | 'high' | 'warning'
  message: string
  value?: number
  timestamp: string
}

/**
 * Publish an alarm event to the Redis pub/sub channels.
 * Routes to alarms:all and alarms:<severity>.
 */
export async function publishAlarm(alarm: AlarmNotification): Promise<boolean> {
  const pubsub = await createPubSubClient()
  if (!pubsub) {
    console.warn('[AlarmPubSub] Redis pubsub client not available, skipping publish')
    return false
  }

  const channel = `alarms:${alarm.severity}`
  const payload = JSON.stringify(alarm)

  try {
    await pubsub.publisher.publish(channel, payload)
    await pubsub.publisher.publish('alarms:all', payload)
    return true
  } catch (error) {
    console.error('[AlarmPubSub] Publish error:', error)
    return false
  }
}

/**
 * Subscribe to alarm channels.
 * @param channelPattern e.g., 'alarms:all', 'alarms:critical', 'alarms:*'
 * @param onMessage Callback when a message is received
 * @returns Unsubscribe function, or null if client is unavailable
 */
export async function subscribeToAlarms(
  channelPattern: string,
  onMessage: (channel: string, alarm: AlarmNotification) => void
): Promise<(() => void) | null> {
  const pubsub = await createPubSubClient()
  if (!pubsub) {
    console.warn('[AlarmPubSub] Redis pubsub client not available, skipping subscription')
    return null
  }

  const subscriber = pubsub.subscriber

  try {
    if (subscriber.status !== 'ready' && subscriber.status !== 'connecting') {
      await subscriber.connect()
    }

    const handleMessage = (channel: string, message: string) => {
      try {
        const alarm = JSON.parse(message) as AlarmNotification
        onMessage(channel, alarm)
      } catch (e) {
        console.error('[AlarmPubSub] Failed to parse message payload:', e)
      }
    }

    const handlePMessage = (_pattern: string, channel: string, message: string) => {
      try {
        const alarm = JSON.parse(message) as AlarmNotification
        onMessage(channel, alarm)
      } catch (e) {
        console.error('[AlarmPubSub] Failed to parse pmessage payload:', e)
      }
    }

    if (channelPattern.includes('*')) {
      await subscriber.psubscribe(channelPattern)
      subscriber.on('pmessage', handlePMessage)
    } else {
      await subscriber.subscribe(channelPattern)
      subscriber.on('message', handleMessage)
    }

    return () => {
      try {
        if (channelPattern.includes('*')) {
          subscriber.punsubscribe(channelPattern)
          subscriber.off('pmessage', handlePMessage)
        } else {
          subscriber.unsubscribe(channelPattern)
          subscriber.off('message', handleMessage)
        }
      } catch (e) {
        // ignore unsubscribe failures during cleanup
      }
    }
  } catch (error) {
    console.error('[AlarmPubSub] Subscription setup error:', error)
    return null
  }
}
