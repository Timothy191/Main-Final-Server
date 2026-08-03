'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { enrollEmployee } from '../actions'
import { UserPlus } from 'lucide-react'

export function EnrollEmployeeDialog({ scheduleId }: { scheduleId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [employeeId, setEmployeeId] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!employeeId.trim()) return

    startTransition(async () => {
      try {
        const res = await enrollEmployee({ scheduleId, employeeId })
        if (res.success) {
          toast.success('Employee enrolled in training session!')
          setIsOpen(false)
          setEmployeeId('')
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to enroll employee')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
      >
        <UserPlus className="w-3.5 h-3.5" />
        Enroll
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-arch-surface-secondary border border-arch-border p-5 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <UserPlus className="w-5 h-5" />
                <h3 className="text-base font-semibold text-arch-text-primary">Enroll Employee</h3>
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
                  Employee ID / Badge Code *
                </label>
                <input
                  type="text"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. EMP-9021"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-arch-text-muted hover:text-arch-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium text-xs transition-colors disabled:opacity-50"
                >
                  {isPending ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
