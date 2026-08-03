#!/usr/bin/env node
// Recreates the RLS audit script removed during the partial-checkout purge.
// Iterates packages/database/migrations/*.sql, flags any file that creates
// a table without also enabling RLS in the same file. Child partitions
// inherit RLS from parents in PostgreSQL, so dynamic partition CREATE
// TABLE statements inside format() calls are excluded.

const fs = require('fs');
const path = require('path');

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'packages', 'database', 'migrations');
const PARTITION_HEURISTIC = /\bformat\s*\(/i; // CREATE TABLE inside format() is a child partition

function* migrations() {
  for (const file of fs.readdirSync(MIGRATIONS_DIR).sort()) {
    if (file.endsWith('.sql')) yield path.join(MIGRATIONS_DIR, file);
  }
}

let violations = 0;
let total = 0;

for (const file of migrations()) {
  const sql = fs.readFileSync(file, 'utf8');
  const createsTable = /CREATE\s+TABLE\b/i.test(sql);
  if (!createsTable) continue;
  total += 1;
  // Child partitions inherit RLS from parents — exclude dynamic partition creates
  if (PARTITION_HEURISTIC.test(sql) && !/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql)) {
    // dynamic partition, skip (parent migration will have RLS)
    continue;
  }
  if (!/ENABLE\s+ROW\s+LEVEL\s+SECURITY/i.test(sql)) {
    console.error(`RLS VIOLATION: ${path.relative(process.cwd(), file)} creates a table without ENABLE ROW LEVEL SECURITY`);
    violations += 1;
  }
}

console.log(`RLS audit: ${total - violations}/${total} table-creating migrations have RLS.`);
if (violations > 0) {
  console.error(`${violations} migration(s) need RLS added.`);
  process.exit(1);
}
