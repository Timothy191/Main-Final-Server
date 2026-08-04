#!/usr/bin/env node

/**
 * Doctrine Compliance Enforcement Hook Script
 * Enforces "No emojis in commits, comments, or professional output" rule.
 */

const fs = require('fs');
const { execSync } = require('child_process');

const args = process.argv.slice(2);

// Standard emoji pattern including emoticons, symbols, flags, and pictographs
const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{27BF}]|[\u{1F1E6}-\u{1F1FF}]/u;

if (args[0] === '--commit-msg') {
  const commitMsgFile = args[1];
  if (!commitMsgFile || !fs.existsSync(commitMsgFile)) {
    console.error('❌ Error: Commit message file not found.');
    process.exit(1);
  }
  const commitMsg = fs.readFileSync(commitMsgFile, 'utf8');
  if (emojiRegex.test(commitMsg)) {
    console.error('❌ FAIL: Commit message contains emojis (violates Doctrine Professional Communication rule).');
    console.error(`  Message: "${commitMsg.trim()}"`);
    process.exit(1);
  }
  process.exit(0);
}

console.log('=== Doctrine Compliance Checks ===');

try {
  const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  let emojiFound = false;

  for (const file of stagedFiles) {
    if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(file)) {
      const addedLines = execSync(`git diff --cached "${file}"`, { encoding: 'utf8' })
        .split('\n')
        .filter(line => line.startsWith('+') && !line.startsWith('+++'))
        .map(line => line.slice(1))
        .join('\n');

      if (addedLines) {
        // Extract comment lines
        const commentLines = addedLines.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*');
        });

        for (const line of commentLines) {
          if (emojiRegex.test(line)) {
            console.error(`❌ FAIL: Emojis detected in added comments inside file: ${file}`);
            console.error(`  Line: ${line.trim()}`);
            emojiFound = true;
          }
        }
      }
    }
  }

  if (emojiFound) {
    process.exit(1);
  }

  console.log('  ✓ PASS: No emojis detected in staged comments or code.');
} catch (error) {
  console.error('❌ Error running compliance check:', error.message);
  process.exit(1);
}
