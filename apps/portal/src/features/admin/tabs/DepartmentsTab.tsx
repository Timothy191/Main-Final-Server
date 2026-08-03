'use client'

import { useState } from 'react'
import { useSupabaseClient, useAdminData } from '@/hooks/useAdminData'
import { GlassCard } from '@repo/ui/GlassCard'
import { Edit2, Trash2, Plus } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog'
import { Input } from '@repo/ui/components/ui/input'
import { logError } from '@/lib/errors/error-logger'

interface Department {
  id: string
  name: string
  display_name: string
  icon: string
  description: string
  color: string
  created_at: string
}

const COLORS = ['blue', 'emerald', 'blue', 'violet', 'red', 'cyan', 'indigo']

const ICONS = [
  'Drill',
  'Factory',
  'Shield',
  'Wrench',
  'Monitor',
  'HeartPulse',
  'GraduationCap',
  'Satellite',
]

export function DepartmentsTab() {
  const {
    data: departments,
    loading,
    reload,
  } = useAdminData<Department>(async (supabase) =>
    supabase.from('departments').select('*').order('display_name')
  )
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const supabase = useSupabaseClient()

  const handleEdit = (dept: Department) => {
    setEditingDept(dept)
    setShowEditDialog(true)
  }

  const handleCreate = () => {
    setEditingDept(null)
    setShowEditDialog(true)
  }

  const handleSave = async (formData: {
    name: string
    display_name: string
    icon: string
    color: string
    description: string
  }) => {
    if (editingDept) {
      const { error } = await supabase.from('departments').update(formData).eq('id', editingDept.id)
      if (error)
        logError(new Error(error.message), {
          context: 'departments_tab_update',
        })
    } else {
      const { error } = await supabase.from('departments').insert(formData)
      if (error)
        logError(new Error(error.message), {
          context: 'departments_tab_create',
        })
    }
    setShowEditDialog(false)
    setEditingDept(null)
    reload()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) logError(new Error(error.message), { context: 'departments_tab_delete' })
    reload()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-arch-text-primary">Departments</h2>
        <Button
          onClick={handleCreate}
          className="bg-arch-accent-green hover:bg-arch-accent-green text-[var(--bg-void)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-arch-border-default">
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Slug
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Icon
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Color
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Description
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider text-right"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-arch-text-muted">
                    Loading...
                  </td>
                </tr>
              ) : departments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-arch-text-muted">
                    No departments found.
                  </td>
                </tr>
              ) : (
                departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-arch-surface-tertiary transition-colors">
                    <td className="px-6 py-4 text-arch-text-primary text-sm font-medium">
                      {dept.display_name}
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm font-mono">
                      {dept.name}
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm">{dept.icon}</td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="default"
                        className={`bg-${dept.color}-500/10 text-${dept.color}-400 border-${dept.color}-500/20`}
                      >
                        {dept.color}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm max-w-xs truncate">
                      {dept.description}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(dept)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-accent-red hover:text-accent-red/80"
                          onClick={() => handleDelete(dept.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-arch-surface-primary border-arch-border-default">
          <DialogHeader>
            <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
          </DialogHeader>
          <DepartmentForm
            department={editingDept}
            onSubmit={handleSave}
            onCancel={() => {
              setShowEditDialog(false)
              setEditingDept(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DepartmentForm({
  department,
  onSubmit,
  onCancel,
}: {
  department: Department | null
  onSubmit: (_data: {
    name: string
    display_name: string
    icon: string
    color: string
    description: string
  }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(department?.name || '')
  const [displayName, setDisplayName] = useState(department?.display_name || '')
  const [icon, setIcon] = useState(department?.icon || 'Building2')
  const [color, setColor] = useState(department?.color || 'blue')
  const [description, setDescription] = useState(department?.description || '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ name, display_name: displayName, icon, color, description })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-medium text-arch-text-secondary mb-2"
        >
          Display Name
        </label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="bg-arch-surface-secondary border-arch-border-default"
          required
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-arch-text-secondary mb-2">
          Slug (URL-friendly name)
        </label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
          className="bg-arch-surface-secondary border-arch-border-default"
          required
        />
      </div>

      <div>
        <label htmlFor="icon" className="block text-sm font-medium text-arch-text-secondary mb-2">
          Icon
        </label>
        <select
          id="icon"
          value={icon}
          onChange={(e) => setIcon(e.target.value)}
          className="w-full px-3 py-2 bg-arch-surface-secondary border-arch-border-default rounded text-arch-text-primary"
        >
          {ICONS.map((iconName) => (
            <option key={iconName} value={iconName}>
              {iconName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="color" className="block text-sm font-medium text-arch-text-secondary mb-2">
          Color
        </label>
        <select
          id="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-full px-3 py-2 bg-arch-surface-secondary border-arch-border-default rounded text-arch-text-primary"
        >
          {COLORS.map((colorName) => (
            <option key={colorName} value={colorName}>
              {colorName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-arch-text-secondary mb-2"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Brief description of the department"
          className="w-full px-3 py-2 bg-arch-surface-secondary border-arch-border-default rounded text-arch-text-primary"
        />
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-arch-accent-green hover:bg-arch-accent-green text-[var(--bg-void)]"
        >
          {department ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}
