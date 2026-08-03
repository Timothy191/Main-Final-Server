/**
 * Typed wrapper for admin-only Supabase RPC functions and tables
 * that are not present in the auto-generated Database types.
 *
 * ROOT CAUSE: The Supabase server client (`createServerSupabaseClient`) is created
 * without a Database type parameter, so `.rpc()` and `.from()` don't know about
 * admin-only functions like `exec_sql`, `run_db_audit`, `repair_table`, or the
 * `audit_logs` table. This wrapper centralizes the type assertion into ONE place
 * with a clear interface, so route handlers never use `as never` directly.
 *
 * We use `unknown` as the supabase parameter type and cast internally to avoid
 * cross-package SupabaseClient version mismatches.
 *
 * If new admin RPC functions are needed, add them here — not in route handlers.
 */

/** Arguments for the repair_table RPC function */
export interface RepairTableArgs {
  p_table_name: string
  p_issue_category: string
}

/** Minimal structural type for the Supabase operations we need */
interface AdminSupabaseOps {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{
    data: unknown
    error: { message: string } | null
  }>
  from: (table: string) => {
    select: (columns: string) => {
      order: (
        column: string,
        opts: { ascending: boolean }
      ) => {
        limit: (n: number) => Promise<{
          data: Record<string, unknown>[] | null
          error: { message: string } | null
        }>
      }
    }
  }
}

function asAdminOps(supabase: unknown): AdminSupabaseOps {
  return supabase as AdminSupabaseOps
}

/**
 * Execute a read-only SQL query via the exec_sql RPC function.
 * Admin-only — caller must verify admin role before invoking.
 */
export async function execAdminSql(
  supabase: unknown,
  sql: string
): Promise<{ data: unknown; error: { message: string } | null }> {
  const ops = asAdminOps(supabase)
  return ops.rpc('exec_sql', { sql })
}

/**
 * Run the database integrity audit via the run_db_audit RPC function.
 * Admin-only.
 */
export async function runDbAudit(
  supabase: unknown
): Promise<{ data: unknown; error: { message: string } | null }> {
  const ops = asAdminOps(supabase)
  return ops.rpc('run_db_audit')
}

/**
 * Execute a predefined repair operation via the repair_table RPC function.
 * Admin-only.
 */
export async function repairTable(
  supabase: unknown,
  args: RepairTableArgs
): Promise<{ data: unknown; error: { message: string } | null }> {
  const ops = asAdminOps(supabase)
  return ops.rpc('repair_table', args as unknown as Record<string, unknown>)
}

/**
 * Query the audit_logs table.
 * Returns a query builder that can be further chained (.limit(), etc.)
 */
export function queryAuditLogs(supabase: unknown) {
  const ops = asAdminOps(supabase)
  return ops.from('audit_logs').select('*').order('created_at', { ascending: false })
}
