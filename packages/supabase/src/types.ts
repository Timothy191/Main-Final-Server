/**
 * @repo/supabase/types — type-only re-exports
 *
 * Use this subpath for generated Database types and row helpers.
 * Runtime clients should import from @repo/supabase/server, /client, etc.
 */
import type { Database } from './database.types'

export type { Database }
export type { SupabaseClient } from '@supabase/supabase-js'

export type PersonnelRow = Database['public']['Tables']['personnel']['Row']
export type BadgesRow = Database['public']['Tables']['badges']['Row']
export type IssuedCardsRow = Database['public']['Tables']['badges']['Row']
export type PersonnelDetail = Database['public']['Tables']['personnel']['Row'] & {
  badges?: Database['public']['Tables']['badges']['Row'][]
  issued_cards?: Database['public']['Tables']['badges']['Row'][]
}
export type ExpiringCard = Database['public']['Tables']['badges']['Row']
export type Department = Database['public']['Tables']['departments']['Row']
