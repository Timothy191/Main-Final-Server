import { NextResponse } from 'next/server'
import { serverLogger } from '@repo/logger'

const logger = serverLogger()

// In a real-world scenario, this would import a Zendesk/Jira SDK
// import { zendesk } from '@integrations/zendesk';

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { type, message, userEmail, metadata } = body

    // 1. Log the feedback locally
    logger.info({ userEmail, metadata }, `[FEEDBACK] Type: ${type} - ${message}`)

    // 2. Push to Customer Support Platform (e.g., Zendesk, Jira Service Desk)
    /*
    await zendesk.tickets.create({
      subject: `[App Feedback] ${type}`,
      comment: { body: message },
      requester: { email: userEmail },
      custom_fields: [{ id: 12345, value: metadata.browser }]
    });
    */

    // 3. If it's a bug, maybe send a slack alert
    if (type === 'bug') {
      // await slack.send({ channel: '#bugs', text: `New bug reported: ${message}` });
    }

    return NextResponse.json({ success: true, ticketId: 'TKT-1234' })
  } catch (error) {
    logger.error({ error }, 'Failed to process feedback submission')
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
