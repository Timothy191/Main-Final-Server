import { NextResponse } from 'next/server'
import { serverLogger } from '@repo/logger'

const logger = serverLogger()

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { level, msg, timestamp, data } = body

    // Server-side logging of client-side events
    const clientLogPrefix = '[CLIENT]'

    switch (level) {
      case 'error':
        logger.error({ clientTimestamp: timestamp, ...data }, `${clientLogPrefix} ${msg}`)
        break
      case 'warn':
        logger.warn({ clientTimestamp: timestamp, ...data }, `${clientLogPrefix} ${msg}`)
        break
      case 'info':
        logger.info({ clientTimestamp: timestamp, ...data }, `${clientLogPrefix} ${msg}`)
        break
      default:
        logger.debug({ clientTimestamp: timestamp, ...data }, `${clientLogPrefix} ${msg}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to parse client log payload')
    return NextResponse.json({ success: false }, { status: 400 })
  }
}
