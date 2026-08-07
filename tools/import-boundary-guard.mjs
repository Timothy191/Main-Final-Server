// tools/import-boundary-guard.mjs
import { readFileSync, existsSync } from 'fs';
import { join, relative, resolve } from 'path';
import { globSync } from 'glob';

// --- Configuration: list directories that contain client-side code ---
const CLIENT_DIRS = [
  'apps/portal/src/hooks',
  'apps/portal/src/components',
  'packages/ui/src',
  'packages/departments/ui/src'
];

const FORBIDDEN_PACKAGES = ['@repo/redis', '@repo/database', '@repo/supabase/server'];

const ROOT = resolve(process.cwd());
const JS_GLOB = '**/*.{ts,tsx,js,jsx}';

function checkFile(filePath) {
  // Exclude unit tests, mock setup files, and server component files in components dir
  if (filePath.includes('.test.') || filePath.includes('.spec.') || filePath.includes('setupTests.ts')) {
    return [];
  }
  const content = readFileSync(filePath, 'utf8');
  
  // If a component does not have "use client" and is NOT inside a client hooks folder,
  // we treat it as a Server Component and skip boundary checks
  if (filePath.includes('/components/') && !content.includes("'use client'") && !content.includes('"use client"')) {
    return [];
  }

  const importRegex = new RegExp(
    `(?:from\\s+|require\\()['"](${FORBIDDEN_PACKAGES.map(p => p.replace('/', '\\/')).join('|')})['"]`,
    'gm'
  );
  const matches = content.match(importRegex);
  return matches ? [...new Set(matches)] : [];
}

let violations = [];
for (const dir of CLIENT_DIRS) {
  const absDir = join(ROOT, dir);
  if (!existsSync(absDir)) {
    console.warn(`⚠️  Directory ${dir} not found, skipping.`);
    continue;
  }
  const files = globSync(JS_GLOB, { cwd: absDir, absolute: true });
  for (const file of files) {
    const findings = checkFile(file);
    for (const finding of findings) {
      violations.push({
        file: relative(ROOT, file),
        import: finding,
      });
    }
  }
}

if (violations.length > 0) {
  console.error('❌ Import boundary violations detected:');
  for (const v of violations) {
    console.error(`   ${v.file} – ${v.import}`);
  }
  process.exit(1);
} else {
  console.log('✅ All client import boundaries respected.');
}
