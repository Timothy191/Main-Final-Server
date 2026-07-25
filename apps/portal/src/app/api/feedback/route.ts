import { NextResponse } from 'next/server'
import { serverLogger } from '@repo/logger'
import { requireAuth } from '@/lib/api/auth'

const logger = serverLogger()

export async function POST(req: Request) {
  const auth = await requireAuth()
  if ('error' in auth) return auth.error

  try {
    const body = await req.json()
    const { type, message, userEmail, metadata } = body

    logger.info(
      { userEmail, metadata, userId: auth.user.id },
      `[FEEDBACK] Type: ${type} - ${message}`
    )

    return NextResponse.json({ success: true, ticketId: 'TKT-1234' })
  } catch (error) {
    logger.error({ error }, 'Failed to process feedback submission')
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
