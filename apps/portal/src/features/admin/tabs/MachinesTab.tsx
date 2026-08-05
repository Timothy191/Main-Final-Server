'use client'

/**
 * MachinesTab — Admin-only machine onboarding.
 *
 * Inserts a new machine (or updates an existing one by name) into the Admin
 * department's `machines` table. For dumpers (articulated / rigid) it prompts
 * for a Bin Factor; for all machines it captures Current SMR and Machine Hours.
 * Current SMR seeds the next shift's start SMR (see get_machine_previous_close_smr).
 *
 * AGENT-TRACE: machines are onboarded under the `admin` department so they are
 * the single managed inventory; department-specific machines (control-room
 * dumpers etc.) remain seeded separately. The `machine_category` enum drives
 * the conditional bin-factor prompt.
 */

import { useState } from 'react'
import { useAdminData, useSupabaseClient } from '@/hooks/useAdminData'
import { GlassCard } from '@repo/ui/GlassCard'
import { Button } from '@repo/ui/components/ui/button'
import { Input } from '@repo/ui/components/ui/input'
import { Save, Plus } from 'lucide-react'
import { logError } from '@/lib/errors/error-logger'
import { recordAdminAuditEvent } from '@/lib/audit'

const MACHINE_CATEGORIES = [
  { value: 'excavator', label: 'Excavator' },
  { value: 'articulated_dumper', label: 'Articulated Dumper' },
  { value: 'rigid_dumper', label: 'Rigid Dumper' },
  { value: 'haul_truck', label: 'Haul Truck' },
  { value: 'dozer', label: 'Dozer' },
  { value: 'water_cart', label: 'Water Cart' },
  { value: 'grader', label: 'Grader' },
  { value: 'other', label: 'Other' },
] as const

const DUMPER_CATEGORIES = new Set(['articulated_dumper', 'rigid_dumper'])

export function MachinesTab() {
  const supabase = useSupabaseClient()
  const { data: adminDepts, loading: deptLoading } = useAdminData<{ id: string; name: string }>(
    async (sb) => sb.from('departments').select('id, name').eq('name', 'admin')
  )

  const [name, setName] = useState('')
  const [serial, setSerial] = useState('')
  const [category, setCategory] = useState<string>('excavator')
  const [binFactor, setBinFactor] = useState<string>('')
  const [currentSmr, setCurrentSmr] = useState<string>('')
  const [machineHours, setMachineHours] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const isDumper = DUMPER_CATEGORIES.has(category)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!name.trim()) {
      setMsg({ kind: 'err', text: 'Machine name is required.' })
      return
    }
    const adminDept = adminDepts?.[0]
    if (!adminDept) {
      setMsg({ kind: 'err', text: 'Admin department not found.' })
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        department_id: adminDept.id,
        name: name.trim(),
        machine_type:
          category === 'articulated_dumper'
            ? 'Articulated Dumper'
            : category === 'rigid_dumper'
              ? 'Rigid Dumper'
              : MACHINE_CATEGORIES.find((c) => c.value === category)?.label ?? category,
        machine_category: category,
        serial_number: serial.trim() || null,
        active: true,
        current_smr: currentSmr ? Number(currentSmr) : null,
      }
      if (isDumper) {
        payload.bin_factor = binFactor ? Number(binFactor) : null
      }

      // Create, or update an existing machine with the same name in admin dept.
      const { data: existing } = await supabase
        .from('machines')
        .select('id')
        .eq('department_id', adminDept.id)
        .eq('name', name.trim())
        .maybeSingle()

      let machineId: string | null = null
      if (existing) {
        const { error } = await supabase.from('machines').update(payload).eq('id', existing.id)
        if (error) throw new Error(error.message)
        machineId = existing.id
      } else {
        const { data: created, error } = await supabase
          .from('machines')
          .insert(payload)
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        machineId = created?.id ?? null
      }

      // Seed an initial machine_hours row if hours supplied and none exists.
      if (machineHours && machineId) {
        const { data: hoursRow } = await supabase
          .from('machine_hours')
          .select('id')
          .eq('machine_id', machineId)
          .maybeSingle()
        if (!hoursRow) {
          await supabase.from('machine_hours').insert({
            machine_id: machineId,
            hours: Number(machineHours),
          })
        }
      }

      await recordAdminAuditEvent({
        action: 'machine.onboarded',
        entityType: 'machines',
        entityId: machineId,
        details: payload,
      }).catch((err) => logError(err instanceof Error ? err : new Error(String(err)), { context: 'machines_tab_audit' }))

      setMsg({ kind: 'ok', text: `Machine "${name.trim()}" saved.` })
      setName('')
      setSerial('')
      setBinFactor('')
      setCurrentSmr('')
      setMachineHours('')
      setCategory('excavator')
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : 'Failed to save machine.' })
    } finally {
      setSaving(false)
    }
  }
