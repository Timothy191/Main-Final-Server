'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { reportSafetyIncident } from '../actions'
import { AlertTriangle, Plus } from 'lucide-react'

export function ReportIncidentDialog({ deptId }: { deptId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'low' as 'low' | 'medium' | 'high' | 'critical',
    location: '',
    shiftType: 'day' as 'day' | 'night',
    injuredParties: 0,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await reportSafetyIncident({
          departmentId: deptId,
          title: formData.title,
          description: formData.description,
          severity: formData.severity,
          location: formData.location || undefined,
          shiftType: formData.shiftType,
          injuredParties: formData.injuredParties,
        })

        if (res.success) {
          toast.success('Safety incident reported successfully!')
          setIsOpen(false)
          setFormData({
            title: '',
            description: '',
            severity: 'low',
            location: '',
            shiftType: 'day',
            injuredParties: 0,
          })
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to report safety incident')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 transition-colors text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Report Incident
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-arch-surface-secondary border border-arch-border p-6 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-lg font-semibold text-arch-text-primary">
                  Report Safety Incident
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-arch-text-muted hover:text-arch-text-primary text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Incident Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Minor oil spill near generator"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-red-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of what occurred..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-red-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        severity: e.target.value as 'low' | 'medium' | 'high' | 'critical',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-red-400"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Shift
                  </label>
                  <select
                    value={formData.shiftType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        shiftType: e.target.value as 'day' | 'night',
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-red-400"
                  >
                    <option value="day">Day</option>
                    <option value="night">Night</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Pit B North"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-red-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Injured Parties
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.injuredParties}
                    onChange={(e) =>
                      setFormData({ ...formData, injuredParties: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-red-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm text-arch-text-muted hover:text-arch-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium text-sm transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Submitting...' : 'Submit Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
