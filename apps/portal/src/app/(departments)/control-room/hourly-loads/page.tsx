import { createServerSupabaseClient } from '@repo/supabase/server'
import { GlassCard } from '@repo/ui/GlassCard'
import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { HourlyLoadsTable, type HourlyLoadRow } from './HourlyLoadsTable'

export const metadata: Metadata = {
  title: 'Hourly Loads | Arch OS',
  description: 'Hourly load tracking for all active machines.',
}

export default async function Page() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch hourly loads joined with machine, site, and its excavator assignments
  const { data: loads, error } = await supabase
    .from('hourly_loads')
    .select(
      `
      id,
      created_at,
      load_date,
      shift_type,
      material_type,
      hour_01, hour_02, hour_03, hour_04, hour_05, hour_06,
      hour_07, hour_08, hour_09, hour_10, hour_11, hour_12,
      total_loads,
      machines (
        id,
        name,
        machine_type,
        bin_factor,
        site:sites (
          id,
          name
        ),
        assignments:excavator_dumper_assignments (
          created_at,
          material_type,
          excavator_activity (
            machine:machines (
              id,
              name
            )
          )
        )
      )
    `
    )
    .eq('load_date', new Date().toISOString().split('T')[0])
    .order('shift_type')
    .limit(50)

  if (error) {
    throw new Error(`Failed to load hourly loads: ${error.message}`)
  }

  // Fetch active excavators for the reassignment dropdown
  const { data: excavators } = await supabase
    .from('machines')
    .select('id, name, machine_type, site_id')
    .in('machine_type', ['Excavator', 'Shovel'])
    .eq('active', true)

  // Fetch active sites for the inline dropdown selection
  const { data: sites } = await supabase
    .from('sites')
    .select('id, name')
    .eq('active', true)
    .order('name')

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto py-6">
      <div>
        <h2 className="text-2xl font-bold text-arch-text-primary">Hourly Loads & BCM Tracking</h2>
        <p className="text-arch-text-muted text-sm">
          Live load counts by shift hour and auto-calculated estimated BCM (Bank Cubic Meters).
          Click on any Machine_Id to open the actions menu.
        </p>
      </div>

      <GlassCard className="overflow-hidden">
        <HourlyLoadsTable
          initialLoads={(loads || []) as unknown as HourlyLoadRow[]}
          excavators={excavators || []}
          sites={sites || []}
        />
      </GlassCard>
    </div>
  )
}
