import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@repo/supabase/server'
import { runApiGuards } from '@/lib/api/api-guard'
import { syncResultSchema } from '@repo/contract'
import type { SyncResult } from '@repo/contract'

/**
 * API route that triggers the SharePoint/Power Apps employee sync.
 *
 * Calls the Supabase Edge Function `sync-sharepoint-employees` which uses
 * Microsoft Graph API to fetch users and upsert them into the `employees` table.
 *
 * Required env vars (see .env.example):
 *   - SP_CLIENT_ID
 *   - SP_CLIENT_SECRET
 *   - SP_TENANT_ID
 *
 * Optional env vars:
 *   - SHAREPOINT_SITE_ID, SHAREPOINT_LIST_ID (for SharePoint list fallback)
 */
export async function POST(req: NextRequest) {
  // 1. Rate limit + SSRF guard
  await runApiGuards(req)

  // 2. Auth check — only admins can trigger sync
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: no user session' }, { status: 401 })
  }

  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select('role')
    .eq('auth_id', user.id)
    .single()

  if (empError || !employee || employee.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized: admin role required' }, { status: 403 })
  }

  // 3. Trigger the edge function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase configuration not available' }, { status: 500 })
  }

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/sync-sharepoint-employees`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
    })

    const rawResult = await response.json()

    // 4. Validate the response using the shared Zod schema
    let result: SyncResult
    try {
      result = syncResultSchema.parse(rawResult)
    } catch (parseError) {
      console.error('SharePoint sync response validation failed:', parseError)
      return NextResponse.json(
        { error: 'Invalid response from sync function', detail: rawResult },
        { status: 502 }
      )
    }

    return NextResponse.json(
      {
        success: response.ok,
        synced: result,
      },
      { status: response.ok ? 200 : 500 }
    )
  } catch (err) {
    console.error('SharePoint sync trigger failed:', err)
    return NextResponse.json(
      {
        error: 'Failed to trigger sync',
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    )
  }
}
