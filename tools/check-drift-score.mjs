#!/usr/bin/env node
// check-drift-score.mjs - Checks if drift score is below threshold
//
// Reads the latest drift score from .agents/AGENT_TRACER.md
// Expects a line like: "DRIFT SCORE: 0.42"
// Exits with code 1 if score >= threshold, 0 otherwise
//
// Usage: node tools/check-drift-score.mjs [THRESHOLD]
//   THRESHOLD optional, default 0.1 (temperature 0.1 = fully aligned)

import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const tracerFile = resolve(root, '.agents/AGENT_TRACER.md')

const args = process.argv.slice(2)
const threshold = args.length > 0 ? parseFloat(args[0]) : 0.1

if (isNaN(threshold) || threshold < 0 || threshold > 1) {
  console.error('Error: Threshold must be a number between 0 and 1')
  process.exit(1)
}

try {
  const content = readFileSync(tracerFile, 'utf8')
  
  // Extract the latest drift score line (format: "DRIFT SCORE: 0.42")
  const scoreLines = content.split('\n').filter(line => 
    line.trim().toUpperCase().startsWith('DRIFT SCORE:')
  )
  
  if (scoreLines.length === 0) {
    console.log(`No drift score found in ${tracerFile}`)
    console.log(`Threshold: ${threshold}`)
    console.log('PASS: No drift detected')
    process.exit(0)
  }
  
  const latestScoreLine = scoreLines[scoreLines.length - 1]
  const scoreMatch = latestScoreLine.match(/[0-9]+(?:\.[0-9]+)?/)
  
  if (!scoreMatch) {
    console.error(`Could not parse drift score from line: ${latestScoreLine}`)
    process.exit(1)
  }
  
  const score = parseFloat(scoreMatch[0])
  
  if (isNaN(score)) {
    console.error(`Invalid drift score value: ${scoreMatch[0]}`)
    process.exit(1)
  }
  
  console.log(`Drift score: ${score}`)
  console.log(`Threshold: ${threshold}`)
  
  if (score >= threshold) {
    console.error(`FAIL: Drift score ${score} >= threshold ${threshold}`)
    process.exit(1)
  } else {
    console.log(`PASS: Drift score ${score} < threshold ${threshold}`)
    process.exit(0)
  }
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log(`No agent tracer file found at ${tracerFile}`)
    console.log(`Threshold: ${threshold}`)
    console.log('PASS: No drift detected (no tracer file)')
    process.exit(0)
  }
  console.error(`Error reading ${tracerFile}:`, error.message)
  process.exit(1)
}
