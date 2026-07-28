/**
 * @repo/supabase/service-role
 * Service-role Supabase client mock (SQLite fallback).
 */
import 'server-only'
import { SupabaseClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from "./kysely-shim";

export function createServiceRoleClient(): SupabaseClient<any, 'public', any> {
  return createMockSupabaseClient() as any;
}
