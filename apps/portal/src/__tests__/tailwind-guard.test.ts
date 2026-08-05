import fs from 'fs'
import path from 'path'

// Helper to recursively list files in directory
function getFilesRecursively(dir: string): string[] {
  let results: string[] = []
  const list = fs.readdirSync(dir)
  list.forEach((file) => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat && stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '__tests__' && !file.startsWith('.')) {
        results = results.concat(getFilesRecursively(filePath))
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(filePath)
    }
  })
  return results
}

const nonColorSuffixes = new Set([
  't',
  'b',
  'l',
  'r',
  'x',
  'y',
  '0',
  '1',
  '2',
  '4',
  '8',
  'solid',
  'dashed',
  'dotted',
  'double',
  'none',
  'collapse',
  'separate',
  'spacing',
])

function getBorderColorTarget(cls: string): string | null {
  if (!cls.startsWith('border-')) return null

  // Exclude common Tailwind utilities that aren't colors
  const parts = cls.split('-')
  const lastPart = parts[parts.length - 1]?.split('/')[0] || ''

  if (nonColorSuffixes.has(lastPart)) return null

  const secondPart = parts[1] || ''
  if (parts.length === 2 && nonColorSuffixes.has(secondPart)) return null

  // E.g. border-t-2, border-b-0
  const thirdPart = parts[2] || ''
  if (
    parts.length === 3 &&
    ['t', 'b', 'l', 'r', 'x', 'y'].includes(secondPart) &&
    nonColorSuffixes.has(thirdPart)
  ) {
    return null
  }

  // Determine which side this color is applied to
  let dir = 'all'
  if (secondPart === 't') dir = 'top'
  else if (secondPart === 'b') dir = 'bottom'
  else if (secondPart === 'l') dir = 'left'
  else if (secondPart === 'r') dir = 'right'
  else if (secondPart === 'x') dir = 'x'
  else if (secondPart === 'y') dir = 'y'

  return dir
}

describe('Tailwind Conflict Guard', () => {
  it('detects multiple border color declarations on the same element', () => {
    const srcDir = path.resolve(__dirname, '..')
    const files = getFilesRecursively(srcDir)
    const conflicts: string[] = []

    // Matches patterns like: className="..." or className={`...`}
    const classNameRegex = /className=(?:["']([^"']*)["']|\{`([^`]*)`\})/g

    files.forEach((file) => {
      // Skip test files
      if (file.endsWith('.test.ts') || file.endsWith('.test.tsx')) return

      const content = fs.readFileSync(file, 'utf8')
      let match: RegExpExecArray | null = null

      // Reset regex index
      classNameRegex.lastIndex = 0

      // Simple line counting helper
      const getLineNumber = (index: number) => {
        return content.substring(0, index).split('\n').length
      }

      while ((match = classNameRegex.exec(content)) !== null) {
        const classString = match[1] || match[2] || ''
        if (!classString) continue

        // Strip template literal interpolations to avoid matching conditional class expressions
        const cleanString = classString.replace(/\$\{[^}]*\}/g, '')

        const classes = cleanString.split(/\s+/).filter(Boolean)
        const borderTargets = new Map<string, string[]>()

        classes.forEach((cls) => {
          // Remove leftover quotes from split JS strings
          const cleanCls = cls.replace(/['"`]/g, '')
          const dir = getBorderColorTarget(cleanCls)
          if (dir) {
            const list = borderTargets.get(dir) || []
            list.push(cleanCls)
            borderTargets.set(dir, list)
          }
        })

        const matchIndex = match.index

        // Check for direction conflicts
        borderTargets.forEach((list, dir) => {
          if (list.length > 1) {
            const line = getLineNumber(matchIndex)
            conflicts.push(
              `${path.relative(srcDir, file)}:L${line} - Multiple border colors for target "${dir}": [${list.join(', ')}]`
            )
          }
        })
      }
    })

    expect(conflicts).toEqual([])
  })
})
