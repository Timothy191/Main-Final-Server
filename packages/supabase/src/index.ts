/**
 * @repo/supabase — re-exports for convenience
 * For tree-shaking prefer the sub-path imports:
 *   import { createClient } from "@repo/supabase/client";
 *   import { createAdminClient } from "@repo/supabase/server";
 */
export { createClient, createBrowserSupabaseClient } from './client'
export { createAdminClient, createServerSupabaseClient, getUserSafely } from './server'
export type { SupabaseClient } from '@supabase/supabase-js'

// Legacy type exports for compatibility — prefer typed alternatives from @repo/database
/** @deprecated Use typed row from @repo/database */
export type PersonnelRow = any
/** @deprecated Use typed row from @repo/database */
export type BadgesRow = any
/** @deprecated Use typed row from @repo/database */
export type IssuedCardsRow = any
/** @deprecated Use typed row from @repo/database */
export type PersonnelDetail = any
/** @deprecated Use typed row from @repo/database */
export type ExpiringCard = any
/** @deprecated Use {@link import("@repo/database").Departments} instead */
export type Department = any
