/**
 * @module database
 * @repo/database — Kysely-backed PostgreSQL connection singleton.
 *
 * Provides a type-safe query builder (`db`) and re-exports the full
 * {@link Database} schema type for use across the monorepo.
 *
 * Connection parameters are read from `PG_*` environment variables with
 * sensible localhost defaults for local development.
 *
 * @example
 * ```ts
 * import { db } from "@repo/database";
 * const rows = await db.selectFrom("departments").selectAll().execute();
 * ```
 */
import { Kysely, SqliteDialect } from 'kysely'
import Database from 'better-sqlite3'
import type { Database as DatabaseSchema } from './types.js'

/**
 * Shared Kysely database instance configured to use a local SQLite file database.
 * Uses a `better-sqlite3` instance under the hood.
 */
export const db = new Kysely<DatabaseSchema>({
  dialect: new SqliteDialect({
    database: new Database(process.env.SQLITE_DB_PATH || 'arch.db'),
  }),
})

/** Re-export of the full database schema and the {@link Json} helper type. */
export type { Database, Json } from './types.js'
