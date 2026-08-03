/**
 * @repo/supabase — re-exports for convenience
 * For tree-shaking prefer the sub-path imports:
 *   import { createClient } from "@repo/supabase/client";
 *   import { createAdminClient } from "@repo/supabase/server";
 */
import type { Database } from './database.types'

export { createClient, createBrowserSupabaseClient } from './client'
export { createAdminClient, createServerSupabaseClient, getUserSafely } from './server'
export type { SupabaseClient } from '@supabase/supabase-js'
export type { Database }

export type PersonnelRow = Database['public']['Tables']['personnel']['Row']
export type BadgesRow = Database['public']['Tables']['badges']['Row']
export type IssuedCardsRow = Database['public']['Tables']['badges']['Row']
export type PersonnelDetail = Database['public']['Tables']['personnel']['Row'] & {
  badges?: Database['public']['Tables']['badges']['Row'][]
  issued_cards?: Database['public']['Tables']['badges']['Row'][]
}
export type ExpiringCard = Database['public']['Tables']['badges']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
