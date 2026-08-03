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
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import type { Database } from './types.js'

/**
 * Shared Kysely database instance configured via `PG_*` env vars.
 * Uses a `pg.Pool` under the hood for connection pooling.
 */
export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT || '5432'),
      database: process.env.PG_DATABASE || 'coal_mine',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'postgres',
    }),
  }),
})

/** Re-export of the full database schema and the {@link Json} helper type. */
export type { Database, Json } from './types.js'
