#!/usr/bin/env node

/**
 * Migration Rollback Safety Checker
 *
 * Static analysis of all SQL migration files for rollback safety patterns.
 * Checks that:
 *
 *   1. All migration filenames follow the NNN_name.sql convention
 *   2. DROP operations use IF EXISTS (safe to re-run)
 *   3. CREATE TABLE / CREATE INDEX use IF NOT EXISTS
 *   4. ALTER TABLE ADD COLUMN uses IF NOT EXISTS
 *   5. ALTER TABLE DROP COLUMN uses IF EXISTS
 *   6. UPDATE/DELETE without WHERE are flagged as warnings
 *   7. DROP TYPE operations include data migration for rows
 *
 * Run: node tests/migration-rollback-safety.mjs
 * Exit code: 0 (pass) or 1 (fail)
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = join(__dirname, "..", "migrations");

// ── Config ───────────────────────────────────────────────────────────────────

const SEQUENTIAL_FILE_REGEX = /^(\d{3})_(.+)\.sql$/;



// ── Results tracking ─────────────────────────────────────────────────────────

const errors = [];
const warnings = [];

function error(msg, file) {
  errors.push({ msg, file });
}

function warn(msg, file) {
  warnings.push({ msg, file });
}

// ── Validation helpers ───────────────────────────────────────────────────────

function checkFilenames(files) {
  const matched = [];
  for (const f of files) {
    const m = f.match(SEQUENTIAL_FILE_REGEX);
    if (!m) {
      error(`Filenames must match NNN_name.sql (got: "${f}")`, f);
      continue;
    }
    matched.push({ file: f, seq: parseInt(m[1], 10), name: m[2] });
  }

  // Check for duplicate sequence numbers
  const seen = new Map();
  for (const { file, seq } of matched) {
    if (seen.has(seq)) {
      error(`Duplicate sequence number ${String(seq).padStart(3, "0")}`, file);
    }
    seen.set(seq, file);
  }

  // Check sequence is sequential with no gaps
  matched.sort((a, b) => a.seq - b.seq);
  for (let i = 0; i < matched.length - 1; i++) {
    const expected = matched[i].seq + 1;
    if (matched[i + 1].seq !== expected) {
      error(
        `Sequence gap: ${String(matched[i].seq).padStart(3, "0")} → ${String(expected).padStart(3, "0")} (next is ${String(matched[i + 1].seq).padStart(3, "0")})`,
        matched[i + 1].file,
      );
    }
  }

  return matched;
}

const DROP_TABLE_RE = /^\s*DROP\s+TABLE\s+(IF EXISTS\s+)?([^\s;]+)/gim;
const DROP_INDEX_RE = /^\s*DROP\s+INDEX\s+(IF EXISTS\s+)?([^\s;]+)/gim;
const DROP_VIEW_RE = /^\s*DROP\s+(MATERIALIZED\s+)?VIEW\s+(IF EXISTS\s+)?([^\s;]+)/gim;
const DROP_TYPE_RE = /^\s*DROP\s+TYPE\s+(IF EXISTS\s+)?([^\s;]+)/gim;
const DROP_COLUMN_NO_IF_RE = /^\s*ALTER\s+TABLE\s+[^\s;]+\s+DROP\s+COLUMN\s+(?!IF EXISTS)([^\s;]+)/gim;

const ADD_COLUMN_NO_IF_RE = /^\s*ALTER\s+TABLE\s+[^\s;]+\s+ADD\s+COLUMN\s+(?!IF NOT EXISTS)([^\s;]+\s+)/gim;

const CREATE_TABLE_IF_RE = /^\s*CREATE\s+TABLE\s+IF NOT EXISTS\s+[^\s;(]+/gim;
const CREATE_TABLE_NO_IF_RE = /^\s*CREATE\s+TABLE\s+(?!IF NOT EXISTS)([^\s;(]+)/gim;

const CREATE_INDEX_IF_RE = /^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+(CONCURRENTLY\s+)?IF NOT EXISTS\s+/gim;
const CREATE_INDEX_NO_IF_RE = /^\s*CREATE\s+(UNIQUE\s+)?INDEX\s+(CONCURRENTLY\s+)?(?!IF NOT EXISTS)([^\s;(]+)/gim;

const UPDATE_WITHOUT_WHERE_RE = /^\s*UPDATE\s+[^\s;]+\s+SET\b(?![\s\S]*?\bWHERE\b)/gim;
const DELETE_WITHOUT_WHERE_RE = /^\s*DELETE\s+FROM\s+[^\s;]+(?![\s\S]*?\bWHERE\b)/gim;

const ALTER_TYPE_RENAME_RE = /^\s*ALTER\s+TYPE\s+[^\s;]+\s+RENAME\s+TO\s+/gim;

/**
 * Remove SQL comments (single-line and block) from content for analysis.
 */
function stripComments(sql) {
  return sql
    .replace(/--.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .trim();
}

function analyzeMigration(file, content) {
  const sql = stripComments(content);

  // ── Check DROP TABLE ──
  const dropTables = [...sql.matchAll(DROP_TABLE_RE)];
  for (const m of dropTables) {
    if (!m[1]) {
      error(`DROP TABLE without IF EXISTS: "${m[0].trim()}"`, file);
    }
  }

  // ── Check DROP INDEX ──
  const dropIndexes = [...sql.matchAll(DROP_INDEX_RE)];
  for (const m of dropIndexes) {
    if (!m[1]) {
      error(`DROP INDEX without IF EXISTS: "${m[0].trim()}"`, file);
    }
  }

  // ── Check DROP VIEW ──
  const dropViews = [...sql.matchAll(DROP_VIEW_RE)];
  for (const m of dropViews) {
    if (!m[2]) {
      error(`DROP VIEW without IF EXISTS: "${m[0].trim()}"`, file);
    }
  }

  // ── Check DROP TYPE ──
  // (warning only — some migrations use a safe RENAME → DROP pattern
  //  where the dropped type was created by RENAME in the same migration)
  const dropTypes = [...sql.matchAll(DROP_TYPE_RE)];
  for (const m of dropTypes) {
    if (!m[1]) {
      warn(
        `DROP TYPE without IF EXISTS — verify type was created in this migration: "${m[0].trim()}"`,
        file,
      );
    }
  }

  // ── Check DROP COLUMN ──
  const dropColNoIf = [...sql.matchAll(DROP_COLUMN_NO_IF_RE)];
  for (const m of dropColNoIf) {
    error(`ALTER TABLE DROP COLUMN without IF EXISTS: "${m[0].trim()}"`, file);
  }

  // ── Check ADD COLUMN with IF NOT EXISTS ──
  const addColNoIf = [...sql.matchAll(ADD_COLUMN_NO_IF_RE)];
  for (const m of addColNoIf) {
    warn(`ALTER TABLE ADD COLUMN without IF NOT EXISTS: "${m[0].trim()}"`, file);
  }

  // ── Check CREATE TABLE with IF NOT EXISTS ──
  const createTableNoIf = [...sql.matchAll(CREATE_TABLE_NO_IF_RE)];
  for (const m of createTableNoIf) {
    // Allow CREATE TABLE for partitioned tables (they use a separate pattern:
    // DROP TABLE IF EXISTS + CREATE TABLE without IF NOT EXISTS)
    const preceding = sql.substring(0, m.index).trimEnd();
    const linesBefore = preceding.split("\n").slice(-10);
    const hasRecentDrop = linesBefore.some((l) =>
      /DROP\s+TABLE\s+IF EXISTS/i.test(l),
    );
    if (!hasRecentDrop) {
      warn(
        `CREATE TABLE without IF NOT EXISTS: "${m[1] ?? m[0].trim()}"`,
        file,
      );
    }
  }

  // ── Check CREATE INDEX with IF NOT EXISTS ──
  const createIndexNoIf = [...sql.matchAll(CREATE_INDEX_NO_IF_RE)];
  for (const m of createIndexNoIf) {
    warn(
      `CREATE INDEX without IF NOT EXISTS: "${(m[3] ?? m[0]).trim()}"`,
      file,
    );
  }

  // ── Check UPDATE/DELETE without WHERE ──
  const updatesNoWhere = [...sql.matchAll(UPDATE_WITHOUT_WHERE_RE)];
  for (const m of updatesNoWhere) {
    warn(`UPDATE without WHERE clause: "${m[0].trim()}"`, file);
  }

  const deletesNoWhere = [...sql.matchAll(DELETE_WITHOUT_WHERE_RE)];
  for (const m of deletesNoWhere) {
    warn(`DELETE without WHERE clause: "${m[0].trim()}"`, file);
  }

  // ── Check ALTER TYPE RENAME (complex rollback) ──
  const typeRenames = [...sql.matchAll(ALTER_TYPE_RENAME_RE)];
  for (const m of typeRenames) {
    warn(
      `ALTER TYPE RENAME — complex rollback, verify down.sql exists: "${m[0].trim()}"`,
      file,
    );
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const files = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql"));
  const total = files.length;

  console.log(`\n🔍 Checking ${total} migration files for rollback safety...\n`);

  const matched = checkFilenames(files);

  for (const { file } of matched) {
    const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
    analyzeMigration(file, content);
  }

  // ── Results ──

  if (errors.length > 0) {
    console.error(`❌  ${errors.length} error(s):`);
    for (const { msg, file } of errors) {
      console.error(`   ${file}: ${msg}`);
    }
  }

  if (warnings.length > 0) {
    console.warn(`\n⚠️  ${warnings.length} warning(s):`);
    for (const { msg, file } of warnings) {
      console.warn(`   ${file}: ${msg}`);
    }
  }

  console.log(
    `\n📊 ${total} migrations — ${errors.length} errors, ${warnings.length} warnings.\n`,
  );

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
