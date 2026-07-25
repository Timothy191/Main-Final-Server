import { NextResponse } from 'next/server'
import { serverLogger } from '@repo/logger'
import { requireAuth } from '@/lib/api/auth'

const logger = serverLogger()

export async function POST(req: Request) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  try {
    const body = await req.json()
    const { level, msg, timestamp, data } = body

    const clientLogPrefix = '[CLIENT]'

    switch (level) {
      case 'error':
        logger.error(
          { clientTimestamp: timestamp, userId: auth.user.id, ...data },
          `${clientLogPrefix} ${msg}`
        )
        break
      case 'warn':
        logger.warn(
          { clientTimestamp: timestamp, userId: auth.user.id, ...data },
          `${clientLogPrefix} ${msg}`
        )
        break
      case 'info':
        logger.info(
          { clientTimestamp: timestamp, userId: auth.user.id, ...data },
          `${clientLogPrefix} ${msg}`
        )
        break
      default:
        logger.debug(
          { clientTimestamp: timestamp, userId: auth.user.id, ...data },
          `${clientLogPrefix} ${msg}`
        )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error({ error }, 'Failed to parse client log payload')
    return NextResponse.json({ success: false }, { status: 400 })
  }
}
