// tools/ignore-sync-guard.mjs
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const ROOT = resolve(process.cwd());

const CRITICAL_PATTERNS = [
  '.kilo',
  '.kilocode',
  '.turbo',
  '.cocoindex_code/',
  '.eslintignore',
  '.agents/rules/code-auto-collection.md'
];

const files = {
  '.gitignore': null,
  '.claudeignore': null,
};

for (const f of Object.keys(files)) {
  const path = resolve(ROOT, f);
  if (existsSync(path)) {
    files[f] = readFileSync(path, 'utf8').split(/\r?\n/);
  } else {
    console.error(`❌ Required ignore file ${f} not found.`);
    process.exit(1);
  }
}

let missing = [];
for (const pattern of CRITICAL_PATTERNS) {
  if (!files['.gitignore'].some(line => line.trim() === pattern)) {
    missing.push(`.gitignore: "${pattern}"`);
  }
  if (!files['.claudeignore'].some(line => line.trim() === pattern)) {
    missing.push(`.claudeignore: "${pattern}"`);
  }
}

if (missing.length > 0) {
  console.error('❌ Critical ignore patterns are out of sync:');
  for (const m of missing) {
    console.error(`   - ${m}`);
  }
  process.exit(1);
} else {
  console.log('✅ .gitignore and .claudeignore are synchronised on critical paths.');
}
