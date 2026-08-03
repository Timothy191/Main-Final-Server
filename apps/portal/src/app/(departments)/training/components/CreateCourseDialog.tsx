'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createCourse } from '../actions'
import { BookOpen, Plus } from 'lucide-react'

export function CreateCourseDialog({ deptId }: { deptId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    validityMonths: 24,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await createCourse({
          departmentId: deptId,
          title: formData.title,
          code: formData.code,
          description: formData.description || undefined,
          validityMonths: formData.validityMonths,
        })

        if (res.success) {
          toast.success('New course created successfully!')
          setIsOpen(false)
          setFormData({ title: '', code: '', description: '', validityMonths: 24 })
          router.refresh()
        }
      } catch (err: unknown) {
        toast.error((err as Error).message || 'Failed to create course')
      }
    })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-medium transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        New Course
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-arch-surface-secondary border border-arch-border p-5 rounded-xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-400">
                <BookOpen className="w-5 h-5" />
                <h3 className="text-base font-semibold text-arch-text-primary">
                  Create New Course
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
                  Course Title *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Advanced Excavator Safety"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. SAF-401"
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-arch-text-muted mb-1">
                    Validity (Months)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={formData.validityMonths}
                    onChange={(e) =>
                      setFormData({ ...formData, validityMonths: parseInt(e.target.value) || 24 })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-arch-border text-sm text-arch-text-primary focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-arch-text-muted mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Course curriculum overview..."
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
                  {isPending ? 'Creating...' : 'Save Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
