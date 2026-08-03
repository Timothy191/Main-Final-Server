'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { startShift, logProductionEntry, recordDelay } from '../actions'
import { AlertCircle, Clock, Factory, Plus } from 'lucide-react'

export function ShiftControls({ deptId }: { deptId: string }) {
  const [activeModal, setActiveModal] = useState<'start' | 'entry' | 'delay' | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  // Start Shift state
  const [shiftType, setShiftType] = useState<'day' | 'night'>('day')
  const [supervisorId, setSupervisorId] = useState('')

  // Log Production Entry state
  const [shiftId, setShiftId] = useState('')
  const [tonnage, setTonnage] = useState<number>(100)
  const [materialType, setMaterialType] = useState('Coal')

  // Record Delay state
  const [reasonCode, setReasonCode] = useState('Equipment Wait')
  const [durationMinutes, setDurationMinutes] = useState(15)
  const [delayNotes, setDelayNotes] = useState('')

  const handleStartShift = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await startShift({
          departmentId: deptId,
          shiftType,
          supervisorId: supervisorId || 'SUP-01',
        })
        if (res.success) {
          toast.success('Production shift started successfully!')
          setActiveModal(null)
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to start shift')
      }
    })
  }

  const handleLogEntry = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await logProductionEntry({
          shiftId: shiftId || 'latest',
          tonnage,
          materialType,
        })
        if (res.success) {
          toast.success(`Logged ${tonnage}t of ${materialType}`)
          setActiveModal(null)
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to log production entry')
      }
    })
  }

  const handleRecordDelay = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await recordDelay({
          shiftId: shiftId || 'latest',
          reasonCode,
          durationMinutes,
          notes: delayNotes,
        })
        if (res.success) {
          toast.warning(`Delay recorded (${durationMinutes} mins)`)
          setActiveModal(null)
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to record delay')
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setActiveModal('start')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 text-xs font-medium transition-colors"
      >
        <Factory className="w-3.5 h-3.5" />
        Start Shift
      </button>

      <button
        onClick={() => setActiveModal('entry')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Log Tonnage
      </button>

      <button
        onClick={() => setActiveModal('delay')}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
      >
        <Clock className="w-3.5 h-3.5" />
        Record Delay
      </button>

      {/* Start Shift Modal */}
      {activeModal === 'start' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-arch-surface-secondary border border-arch-border p-5 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400">
                <Factory className="w-5 h-5" />
                <h3 className="text-base font-semibold text-arch-text-primary">
                  Start Production Shift
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-arch-text-muted hover:text-arch-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartShift} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Shift Type
                </label>
                <select
                  value={shiftType}
                  onChange={(e) => setShiftType(e.target.value as 'day' | 'night')}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-emerald-400"
                >
                  <option value="day">Day Shift</option>
                  <option value="night">Night Shift</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Supervisor ID / Code
                </label>
                <input
                  type="text"
                  required
                  value={supervisorId}
                  onChange={(e) => setSupervisorId(e.target.value)}
                  placeholder="e.g. SUP-104"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-arch-text-muted hover:text-arch-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Starting...' : 'Start Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Tonnage Modal */}
      {activeModal === 'entry' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-arch-surface-secondary border border-arch-border p-5 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <Plus className="w-5 h-5" />
                <h3 className="text-base font-semibold text-arch-text-primary">
                  Log Production Entry
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-arch-text-muted hover:text-arch-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleLogEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Material
                  </label>
                  <select
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                  >
                    <option value="Coal">Coal</option>
                    <option value="Waste Overburden">Waste Overburden</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Tonnage (Tonnes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tonnage}
                    onChange={(e) => setTonnage(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Daily Log / Shift ID
                </label>
                <input
                  type="text"
                  value={shiftId}
                  onChange={(e) => setShiftId(e.target.value)}
                  placeholder="Optional (defaults to latest active shift)"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-arch-text-muted hover:text-arch-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Saving...' : 'Log Tonnage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Delay Modal */}
      {activeModal === 'delay' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-arch-surface-secondary border border-arch-border p-5 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-base font-semibold text-arch-text-primary">
                  Record Operational Delay
                </h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-arch-text-muted hover:text-arch-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordDelay} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Reason
                  </label>
                  <select
                    value={reasonCode}
                    onChange={(e) => setReasonCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-amber-400"
                  >
                    <option value="Equipment Wait">Equipment Wait</option>
                    <option value="Weather Delay">Weather Delay</option>
                    <option value="Blasting Hold">Blasting Hold</option>
                    <option value="Unplanned Maintenance">Unplanned Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Duration (Mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Delay Description / Notes
                </label>
                <textarea
                  rows={2}
                  value={delayNotes}
                  onChange={(e) => setDelayNotes(e.target.value)}
                  placeholder="e.g. Waiting for dumper unit #4 to clear haul road..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-arch-text-muted hover:text-arch-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Recording...' : 'Record Delay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
