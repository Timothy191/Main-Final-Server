import fs from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Usage: node scripts/export-roadmap.mjs <temp-repo-dir> [output-filename]')
  console.error('Example: node scripts/export-roadmap.mjs /tmp/reverse-engineer/shadcn-ui')
  process.exit(1)
}

const targetDir = path.resolve(args[0])
if (!fs.existsSync(targetDir)) {
  console.error(`Error: Directory does not exist: ${targetDir}`)
  process.exit(1)
}

const repoBasename = path.basename(targetDir)
const outputFileName = args[1] || `${repoBasename}-roadmap.md`
const knowledgeArchDir = path.resolve(process.cwd(), '.agents/knowledge/architecture')
const outputPath = path.join(knowledgeArchDir, outputFileName)
const indexMdPath = path.resolve(process.cwd(), '.agents/knowledge/index.md')

// Read package.json if available
let packageInfo = { name: repoBasename, version: '0.0.0', dependencies: {}, devDependencies: {} }
const pkgPath = path.join(targetDir, 'package.json')
if (fs.existsSync(pkgPath)) {
  try {
    packageInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
  } catch {
    // Ignore JSON parse errors
  }
}

// Find component/utility files
function walkDir(dir, maxDepth = 4, currentDepth = 0) {
  if (currentDepth > maxDepth) return []
  let results = []
  try {
    const list = fs.readdirSync(dir)
    for (const file of list) {
      if (['node_modules', '.git', '.next', 'dist', 'build', '.turbo'].includes(file)) continue
      const fullPath = path.join(dir, file)
      const stat = fs.statSync(fullPath)
      if (stat.isDirectory()) {
        results = results.concat(walkDir(fullPath, maxDepth, currentDepth + 1))
      } else if (/\.(tsx|ts|jsx|js|css)$/.test(file)) {
        results.push(path.relative(targetDir, fullPath))
      }
    }
  } catch {
    // Ignore read errors
  }
  return results
}

const allFiles = walkDir(targetDir)
const uiCandidates = allFiles.filter((f) => /components|ui|views|primitives/i.test(f))
const utilCandidates = allFiles.filter((f) => /utils|helpers|lib|hooks/i.test(f))
const schemaCandidates = allFiles.filter((f) => /schema|contract|dto|types|zod/i.test(f))

const now = new Date().toISOString().split('T')[0]

const markdownContent = `---
title: Addition Roadmap — ${packageInfo.name || repoBasename}
tags: [reverse-engineer, roadmap, extraction, ${repoBasename}]
updated: ${now}
source_agent: reverse-engineer
status: active
---

# Addition Roadmap: ${packageInfo.name || repoBasename}

Extracted from \`${targetDir}\` via \`pnpm ai export-roadmap\`.

## 1. Overview & Stack Summary

- **Repository**: \`${packageInfo.name || repoBasename}\`
- **Detected Files**: ${allFiles.length} source file(s)
- **Top Dependencies**: ${
  Object.keys(packageInfo.dependencies || {})
    .slice(0, 10)
    .join(', ') || 'N/A'
}

## 2. Monorepo Addition Candidates

### A. Candidate UI Primitives (\`@repo/ui\`)
${
  uiCandidates.length > 0
    ? uiCandidates
        .slice(0, 15)
        .map((f) => `- \`${f}\``)
        .join('\n')
    : '- No explicit UI components detected.'
}

### B. Candidate Utilities & Hooks (\`@repo/utils\`)
${
  utilCandidates.length > 0
    ? utilCandidates
        .slice(0, 15)
        .map((f) => `- \`${f}\``)
        .join('\n')
    : '- No explicit utility files detected.'
}

### C. Candidate Validation Schemas & Types (\`@repo/contract\`)
${
  schemaCandidates.length > 0
    ? schemaCandidates
        .slice(0, 15)
        .map((f) => `- \`${f}\``)
        .join('\n')
    : '- No explicit schema files detected.'
}

## 3. Integration & Porting Strategy

1. **Extraction**: Copy target source file into matching \`@repo/*\` package directory.
2. **Design Token Alignment**: Replace custom styling with \`@repo/theme\` Tailwind preset & CSS variables.
3. **Type Safety**: Ensure strict TypeScript 5.7+ compliance without \`any\` or \`@ts-ignore\`.
`

fs.mkdirSync(knowledgeArchDir, { recursive: true })
fs.writeFileSync(outputPath, markdownContent, 'utf8')
console.log(`Generated roadmap at: ${outputPath}`)

// Update .agents/knowledge/index.md if needed
if (fs.existsSync(indexMdPath)) {
  let indexContent = fs.readFileSync(indexMdPath, 'utf8')
  const entryLink = `- [Addition Roadmap: ${packageInfo.name || repoBasename}](architecture/${outputFileName}) — extraction candidates from ${repoBasename}.`
  if (!indexContent.includes(outputFileName)) {
    indexContent = indexContent.replace('## Architecture\n', `## Architecture\n\n${entryLink}\n`)
    fs.writeFileSync(indexMdPath, indexContent, 'utf8')
    console.log(`Updated ${indexMdPath} with link to ${outputFileName}`)
  }
}
