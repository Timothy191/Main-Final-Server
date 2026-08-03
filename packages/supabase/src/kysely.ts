import { Kysely, PostgresDialect, type Generated, type ColumnType } from 'kysely'
import { Pool } from 'pg'

// AGENT-TRACE: Simple APIError class for package-level use
// Removed unused options parameter to fix ESLint warnings preventing git push
// This class is intentionally simple - errors are thrown internally within the package
class APIError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'APIError'
  }
}

// Mirror key tables from Database for type-safe complex queries.
// Add more tables as needed — Kysely validates at compile time only.
export interface KyselyDatabase {
  daily_logs: {
    id: Generated<string>
    department_id: string
    shift: string
    date: string
    created_at: ColumnType<string, never, never>
    [key: string]: unknown
  }
  machines: {
    id: Generated<string>
    fleet_id: string
    machine_type: string
    department_id: string
    status: string
    [key: string]: unknown
  }
  hourly_loads: {
    id: Generated<string>
    machine_operation_id: string
    load_time: string
    material_type: string
    tonnes: number
    [key: string]: unknown
  }
  production_logs: {
    id: Generated<string>
    department_id: string
    shift: string
    date: string
    coal_tonnes: number
    waste_tonnes: number
    [key: string]: unknown
  }
  memory_embeddings: {
    id: Generated<string>
    session_id: string
    user_id: string | null
    content: string
    embedding: string
    metadata: Record<string, unknown>
    memory_type: string
    created_at: ColumnType<string, never, string>
    updated_at: string
  }
}

/**
 * Create a Kysely instance pointed at the Supabase Postgres database.
 *
 * Requires `DATABASE_URL` env var (Supabase connection pool string).
 * Use for complex queries (aggregations, multi-table joins, CTEs)
 * that are awkward or impossible with the Supabase JS client.
 *
 * @example
 * ```ts
 * import { createKyselyClient } from "@repo/supabase/kysely";
 *
 * const db = createKyselyClient();
 * const result = await db
 *   .selectFrom("daily_logs")
 *   .select(db.fn.sum<number>("tonnes").as("total"))
 *   .where("department_id", "=", deptId)
 *   .execute();
 * ```
 */
export function createKyselyClient() {
  const url = process.env.DATABASE_URL ?? process.env.SUPABASE_DATABASE_URL

  if (!url) {
    throw new APIError(
      'Missing DATABASE_URL. Set it in your env (Supabase connection pool string).'
    )
  }

  const dialect = new PostgresDialect({
    pool: new Pool({ connectionString: url, max: 10 }),
  })

  return new Kysely<KyselyDatabase>({ dialect })
}
