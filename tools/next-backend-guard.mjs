import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '..')

let errorsFound = 0

function logError(message, file = '') {
  errorsFound++
  console.error(`\x1b[31m[Next.js Backend Guard]\x1b[0m ${message} ${file ? `(at ${file})` : ''}`)
}

// 1. Check that no middleware.ts / middleware.js files exist (single proxy.ts rule)
function checkMiddlewareExistence() {
  const possiblePaths = [
    path.join(REPO_ROOT, 'apps/portal/src/middleware.ts'),
    path.join(REPO_ROOT, 'apps/portal/src/middleware.js'),
    path.join(REPO_ROOT, 'apps/portal/middleware.ts'),
    path.join(REPO_ROOT, 'apps/portal/middleware.js'),
  ]

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      logError(`Forbidden file detected: Use proxy.ts at the edge instead of middleware.ts/js.`, p)
    }
  }
}

// Helper to recursively traverse a directory
function walkDir(dir, callback) {
  if (!fs.existsSync(dir)) return
  const files = fs.readdirSync(dir)
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(filePath, callback)
      }
    } else {
      callback(filePath)
    }
  }
}

// Scan files for specific rules
function scanSourceFiles() {
  const srcDir = path.join(REPO_ROOT, 'apps/portal/src')

  walkDir(srcDir, (filePath) => {
    const ext = path.extname(filePath)
    if (ext !== '.ts' && ext !== '.tsx' && ext !== '.js' && ext !== '.jsx') return

    const content = fs.readFileSync(filePath, 'utf8')

    // 2. Open Redirect checks in route.ts and proxy.ts
    const isRouteOrProxy = filePath.endsWith('route.ts') || filePath.endsWith('route.js') || filePath.endsWith('proxy.ts') || filePath.endsWith('proxy.js')
    if (isRouteOrProxy) {
      if (content.includes('redirect(') || content.includes('NextResponse.redirect(')) {
        // Must contain check for origin or relative path check (e.g. startsWith('/') or origin check)
        const hasRedirectSafety = content.includes('origin') || content.includes("startsWith('/')") || content.includes("starts-with") || content.includes("host")
        if (!hasRedirectSafety) {
          logError(`Possible Open Redirect vulnerability: redirect call found without same-origin validation.`, filePath)
        }
      }

      // 3. No Direct Request Header Passthrough
      if (content.includes('headers: request.headers') || content.includes('headers: req.headers')) {
        logError(`Security Alert: Passing incoming request headers directly to client response is forbidden.`, filePath)
      }
    }

    // 5. Restrict direct edge /docs/md/... requests check in proxy.ts
    const isProxyFile = filePath.endsWith('proxy.ts') || filePath.endsWith('proxy.js')
    if (isProxyFile) {
      const hasDocsMdCheck = content.includes("startsWith('/docs/md/')") && content.includes("'x-routing-header'")
      if (!hasDocsMdCheck) {
        logError(`Architecture Alert: Edge proxy.ts must restrict direct requests to /docs/md/... unless routing headers match.`, filePath)
      }
    }

    // 4. Server Component data fetching best practice
    // If not a client component and under src/app/ (except api/ folder)
    const isUnderAppDir = filePath.includes(path.join('apps/portal/src/app'))
    const isApiRoute = filePath.includes(path.join('apps/portal/src/app/api'))
    const isClientComponent = content.includes('"use client"') || content.includes("'use client'")

    if (isUnderAppDir && !isApiRoute && !isClientComponent) {
      // Server Component should not fetch from local route handlers (/api/)
      // Look for fetch('/api/...') or fetch(`${baseUrl}/api/...`)
      const hasLocalApiFetch = /fetch\(\s*['"`](\/api|.*\/api\/)/.test(content)
      if (hasLocalApiFetch) {
        logError(`Performance/Architecture Alert: Fetching from Route Handlers inside Server Components is forbidden. Query the data source directly instead.`, filePath)
      }
    }
  })
}

function runGuard() {
  console.log('Running Next.js Backend-For-Frontend architecture guard...')
  checkMiddlewareExistence()
  scanSourceFiles()

  if (errorsFound > 0) {
    console.error(`\x1b[31mFAIL:\x1b[0m Next.js Backend-For-Frontend Guard failed with ${errorsFound} issues.`)
    process.exit(1)
  } else {
    console.log('\x1b[32mPASS:\x1b[0m Next.js Backend-For-Frontend Guard passed successfully.')
  }
}

runGuard()
