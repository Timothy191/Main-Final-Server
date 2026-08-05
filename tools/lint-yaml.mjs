import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const ignoredDirs = [
  'node_modules',
  '.next',
  '.turbo',
  'dist',
  'coverage',
  'packages/rust-bindings',
  '.git',
  '.cocoindex_code',
];

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      const relPath = path.relative(rootDir, filePath);
      if (ignoredDirs.some(ignored => relPath === ignored || relPath.startsWith(ignored + path.sep))) {
        continue;
      }
      results = results.concat(walk(filePath));
    } else {
      if (file.endsWith('.yml') || file.endsWith('.yaml')) {
        results.push(filePath);
      }
    }
  }
  return results;
}

console.log('Linting YAML files...');
const files = walk(rootDir);
let errorCount = 0;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  try {
    yaml.loadAll(content);
    console.log(`✓ ${path.relative(rootDir, file)}`);
  } catch (e) {
    console.error(`✗ ${path.relative(rootDir, file)}: ${e.message}`);
    errorCount++;
  }
}

if (errorCount > 0) {
  console.error(`YAML Lint failed with ${errorCount} error(s).`);
  process.exit(1);
} else {
  console.log('YAML Lint passed successfully.');
}
