import { runAuditCheck } from '../src/poller/audit-poller.js'

async function testAudit() {
  try {
    console.log('Running DB Audit...')
    const result = await runAuditCheck()
    console.log('Audit Result:', JSON.stringify(result, null, 2))
  } catch (err) {
    console.error('Audit failed:', err)
  }
}

testAudit()
