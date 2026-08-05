import { chromium } from 'playwright'
import { join } from 'path'

async function run() {
  console.log('🚀 Launching Chromium...')
  const browser = await chromium.launch({
    executablePath: '/usr/bin/chromium',
    headless: true,
  })

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  })

  const page = await context.newPage()

  const logs: { type: string; text: string }[] = []
  page.on('console', (msg) => {
    logs.push({ type: msg.type(), text: msg.text() })
    console.log(`[Browser Console] [${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err) => {
    logs.push({ type: 'error', text: err.message })
    console.error(`[Browser PageError] ${err.message}`)
  })

  console.log('🌐 Navigating to http://localhost:3000/login...')
  try {
    await page.goto('http://localhost:3000/login', {
      waitUntil: 'networkidle',
      timeout: 10000,
    })
  } catch (err) {
    console.warn('⚠️ Navigation timeout or warning:', err)
  }

  // Wait extra time for animations and any late-loading scripts/CSP logs
  console.log('⏳ Waiting for page stability...')
  await page.waitForTimeout(5000)

  const screenshotPath =
    '/home/timothy/.gemini/antigravity-cli/brain/446b0e30-5b38-42ed-a2e6-615dd40156d5/login_screenshot.png'
  console.log(`📸 Taking screenshot and saving to: ${screenshotPath}`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  console.log('🏁 Closing browser...')
  await browser.close()

  console.log('\n========================================')
  console.log('📊 DEVTOOLS CONSOLE LOG SUMMARY:')
  console.log('========================================')
  if (logs.length === 0) {
    console.log('✅ Console is completely clean! No warnings or errors found.')
  } else {
    let warningCount = 0
    let errorCount = 0
    for (const log of logs) {
      if (log.type === 'error') {
        errorCount++
      } else if (log.type === 'warning' || log.type === 'warn') {
        warningCount++
      }
    }
    console.log(`Total Logs: ${logs.length} (Errors: ${errorCount}, Warnings: ${warningCount})`)
  }
}

run().catch(console.error)
