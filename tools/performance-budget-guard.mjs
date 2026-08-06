import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

console.log('Running Performance Budget & Server Isolation Guard...')

let violations = 0

// 1. Audit Server Action files under apps/portal/src/app/(departments)
const departmentsDir = path.join(rootDir, 'apps/portal/src/app/(departments)')

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanDirectory(fullPath)
    } else if (entry.isFile() && (entry.name === 'actions.ts' || entry.name.endsWith('-action.ts'))) {
      const content = fs.readFileSync(fullPath, 'utf8')
      if (content.includes('import') && content.includes('server-only')) {
        // Direct server-only import inside actions file is safe, but verify heavy bundle imports
        if (content.includes('@react-pdf/renderer')) {
          console.error(`❌ Heavy PDF renderer import found in Server Action file: ${path.relative(rootDir, fullPath)}`)
          violations++
        }
      }
    }
  }
}

scanDirectory(departmentsDir)

if (violations > 0) {
  console.error(`Performance Budget Guard failed with ${violations} violations.`)
  process.exit(1)
} else {
  console.log('PASS: Performance Budget & Server Isolation Guard passed cleanly.')
  process.exit(0)
}
