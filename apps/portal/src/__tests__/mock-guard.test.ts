import fs from 'fs'
import path from 'path'

describe('Testing Mock Guard', () => {
  const portalSrc = path.join(__dirname, '..')

  function getAllTestFiles(dir: string, filesList: string[] = []): string[] {
    const files = fs.readdirSync(dir)
    for (const file of files) {
      const name = path.join(dir, file)
      if (fs.statSync(name).isDirectory()) {
        getAllTestFiles(name, filesList)
      } else if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) {
        filesList.push(name)
      }
    }
    return filesList
  }

  it('prohibits local overrides of globally mocked core packages', () => {
    const testFiles = getAllTestFiles(portalSrc)
    const violations: string[] = []

    // Whitelist pre-existing files to avoid breaking existing codebase tests
    const whitelist = new Set([
      '__tests__/mock-guard.test.ts',
      'app/api/health/cache/route.test.ts',
      'app/api/metrics/route.test.ts',
      'app/api/telemetry/push/route.test.ts',
      'lib/api/rate-limit-middleware.test.ts',
    ])

    const bannedMocksRegex = /jest\.mock\s*\(\s*['"`]@repo\/redis['"`]\s*([),])/

    for (const filePath of testFiles) {
      const relativePath = path.relative(portalSrc, filePath)
      if (whitelist.has(relativePath)) {
        continue
      }

      const content = fs.readFileSync(filePath, 'utf8')
      if (bannedMocksRegex.test(content)) {
        violations.push(relativePath)
      }
    }

    if (violations.length > 0) {
      throw new Error(
        `Local mock overrides of '@repo/redis' detected in the following files:\n` +
          violations.map((v) => ` - ${v}`).join('\n') +
          `\n\nRule: Do not call 'jest.mock("@repo/redis")' locally. '@repo/redis' is already globally mocked in 'setupTests.ts'. To stub specific redis/cache behaviors, use Jest spies (e.g. 'jest.spyOn(cache, "get")') or use the global mock directly. Overriding globally mocked packages causes module mock pollution and Jest worker memory leaks / OOM crashes.`
      )
    }
  })
})
