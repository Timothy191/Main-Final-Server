/**
 * @repo/supabase/client
 * Browser-safe Supabase client mock (SQLite fallback).
 */
import { SupabaseClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from "./kysely-shim";

export function createClient(): SupabaseClient<any, 'public', any> {
  return createMockSupabaseClient() as any;
}

export function createBrowserSupabaseClient(): SupabaseClient<any, 'public', any> {
  return createClient();
}
