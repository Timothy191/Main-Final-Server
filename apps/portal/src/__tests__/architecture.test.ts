import fs from 'fs'
import path from 'path'
import { DEPARTMENT_ROUTE_SLUGS } from '@repo/acl'

describe('Architectural Boundary & Layering Tests', () => {
  const rootDir = path.resolve(__dirname, '../../../../')
  const portalSrcDir = path.resolve(__dirname, '../')

  // Helper to recursively walk directories
  function walkDir(dir: string, fileCallback: (filePath: string) => void) {
    const list = fs.readdirSync(dir)
    for (const file of list) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      if (stat.isDirectory()) {
        walkDir(filePath, fileCallback)
      } else {
        fileCallback(filePath)
      }
    }
  }

  it('verifies folder structure under apps/portal/src/app/(departments) aligns with @repo/acl slugs', () => {
    const deptFolder = path.join(portalSrcDir, 'app', '(departments)')
    const items = fs.readdirSync(deptFolder)

    const folders = items.filter((item) => {
      return fs.statSync(path.join(deptFolder, item)).isDirectory()
    })

    const allowedSlugs = new Set<string>([...DEPARTMENT_ROUTE_SLUGS, '[department]'])

    for (const folder of folders) {
      expect(allowedSlugs.has(folder)).toBe(true)
    }
  })

  it('enforces the Two-Layer Policy: no product code imports agent infrastructure', () => {
    const agentImportPattern = /from\s+['"].*(\.agents|\.cursor|\.claude|\.gemini).*['"]/i
    const agentRequirePattern =
      /require\s*\(\s*['"].*(\.agents|\.cursor|\.claude|\.gemini).*['"]\s*\)/i

    const violations: string[] = []

    walkDir(portalSrcDir, (filePath) => {
      // Only check source typescript/javascript files
      if (!/\.(ts|tsx|js|jsx)$/.test(filePath)) return
      // Skip test files, backups, and config files
      if (
        filePath.includes('.test.') ||
        filePath.includes('.backup') ||
        filePath.includes('node_modules')
      )
        return

      const content = fs.readFileSync(filePath, 'utf8')
      if (agentImportPattern.test(content) || agentRequirePattern.test(content)) {
        violations.push(path.relative(rootDir, filePath))
      }
    })

    expect(violations).toEqual([])
  })

  it('enforces that client components do not import server-only packages directly', () => {
    const serverOnlyPattern = /import\s+['"]server-only['"]/
    const supabaseServerPattern = /import\s+.*from\s+['"]@repo\/supabase\/server['"]/

    const violations: string[] = []

    walkDir(portalSrcDir, (filePath) => {
      if (!/\.(ts|tsx)$/.test(filePath)) return
      if (filePath.includes('.test.') || filePath.includes('.spec.')) return

      const content = fs.readFileSync(filePath, 'utf8')

      // If the file declares "use client" at the top
      if (content.trim().startsWith("'use client'") || content.trim().startsWith('"use client"')) {
        if (serverOnlyPattern.test(content) || supabaseServerPattern.test(content)) {
          violations.push(path.relative(rootDir, filePath))
        }
      }
    })

    expect(violations).toEqual([])
  })
})
