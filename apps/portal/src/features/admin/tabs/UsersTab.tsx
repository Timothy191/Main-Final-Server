'use client'

import { useState } from 'react'
import { useAdminData, useSupabaseClient } from '@/hooks/useAdminData'
import { GlassCard } from '@repo/ui/GlassCard'
import { Search, UserPlus, Edit2, Trash2 } from 'lucide-react'
import { Button } from '@repo/ui/components/ui/button'
import { Badge } from '@repo/ui/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/components/ui/dialog'
import { Input } from '@repo/ui/components/ui/input'
import { logError } from '@/lib/errors/error-logger'

interface Employee {
  id: string
  full_name: string
  role: string
  department_id: string | null
  accessible_departments: string[] | null
  created_at: string
  departments?: {
    display_name: string
  }
}

export function UsersTab() {
  const {
    data: employees,
    loading: empsLoading,
    reload: reloadEmployees,
  } = useAdminData<Employee>(async (supabase) =>
    supabase
      .from('employees')
      .select('*, departments(display_name)')
      .order('created_at', { ascending: false })
  )

  const {
    data: departments,
    loading: deptsLoading,
    reload: reloadDepartments,
  } = useAdminData<{ id: string; display_name: string }>(async (supabase) =>
    supabase.from('departments').select('id, display_name')
  )

  const loading = empsLoading || deptsLoading
  const supabase = useSupabaseClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee)
    setShowEditDialog(true)
  }

  const handleUpdate = async (formData: {
    role: string
    department_id: string | null
    accessible_departments: string[]
  }) => {
    if (!editingEmployee) return

    const { error } = await supabase
      .from('employees')
      .update({
        role: formData.role,
        department_id: formData.department_id,
        accessible_departments: formData.accessible_departments,
      })
      .eq('id', editingEmployee.id)

    if (error) {
      logError(new Error(error.message), {
        context: 'users_tab_update_employee',
      })
      return
    }

    setShowEditDialog(false)
    setEditingEmployee(null)
    reloadEmployees()
    reloadDepartments()
  }

  const filteredEmployees = employees.filter((emp) =>
    emp.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const deptMap = new Map(departments.map((d) => [d.id, d.display_name]))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-arch-text-muted" />
          <Input
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-arch-surface-secondary border-arch-border-default"
          />
        </div>
        <Button className="bg-arch-accent-green hover:bg-arch-accent-green text-[var(--bg-void)]">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
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
                  Role
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Department
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Accessible Depts
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-xs font-medium text-arch-text-muted uppercase tracking-wider"
                >
                  Created
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
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-arch-text-muted">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-arch-surface-tertiary transition-colors">
                    <td className="px-6 py-4 text-arch-text-primary text-sm font-medium">
                      {emp.full_name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant="outline"
                        className={
                          emp.role === 'admin'
                            ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
                            : emp.role === 'supervisor'
                              ? 'bg-accent-blue/10 text-accent-blue border-accent-blue/20'
                              : ''
                        }
                      >
                        {emp.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm">
                      {emp.department_id ? deptMap.get(emp.department_id) : 'Unassigned'}
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm">
                      {emp.accessible_departments?.length || 0} departments
                    </td>
                    <td className="px-6 py-4 text-arch-text-muted text-sm">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(emp)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-accent-red hover:text-accent-red/80"
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
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <EditEmployeeForm
            employee={editingEmployee}
            departments={departments}
            onSubmit={handleUpdate}
            onCancel={() => {
              setShowEditDialog(false)
              setEditingEmployee(null)
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function EditEmployeeForm({
  employee,
  departments,
  onSubmit,
  onCancel,
}: {
  employee: Employee | null
  departments: { id: string; display_name: string }[]
  onSubmit: (_data: {
    role: string
    department_id: string | null
    accessible_departments: string[]
  }) => void
  onCancel: () => void
}) {
  const [role, setRole] = useState(employee?.role || 'operator')
  const [departmentId, setDepartmentId] = useState(employee?.department_id || '')
  const [accessibleDepts, setAccessibleDepts] = useState<string[]>(
    employee?.accessible_departments || []
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      role,
      department_id: departmentId || null,
      accessible_departments: accessibleDepts,
    })
  }

  const toggleAccessibleDept = (deptId: string) => {
    setAccessibleDepts((prev) =>
      prev.includes(deptId) ? prev.filter((d) => d !== deptId) : [...prev, deptId]
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-arch-text-secondary mb-2">
          Role
        </label>
        <select
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 bg-arch-surface-secondary border-arch-border-default rounded text-arch-text-primary"
        >
          <option value="operator">Operator</option>
          <option value="supervisor">Supervisor</option>
          <option value="admin">Admin</option>
          <option value="control_room_operator">Control Room Operator</option>
        </select>
      </div>

      <div>
        <label
          htmlFor="department"
          className="block text-sm font-medium text-arch-text-secondary mb-2"
        >
          Primary Department
        </label>
        <select
          id="department"
          value={departmentId}
          onChange={(e) => setDepartmentId(e.target.value)}
          className="w-full px-3 py-2 bg-arch-surface-secondary border-arch-border-default rounded text-arch-text-primary"
        >
          <option value="">Select department</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.display_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-arch-text-secondary mb-2">
          Accessible Departments
        </label>
        <div className="grid grid-cols-2 gap-2">
          {departments.map((dept) => (
            <button
              key={dept.id}
              type="button"
              onClick={() => toggleAccessibleDept(dept.id)}
              className={`text-left px-3 py-2 rounded border text-sm ${
                accessibleDepts.includes(dept.id)
                  ? 'bg-arch-accent-green border-arch-accent-green text-[var(--bg-void)]'
                  : 'bg-arch-surface-secondary border-arch-border-default text-arch-text-secondary'
              }`}
            >
              {dept.display_name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-arch-accent-green hover:bg-arch-accent-green text-[var(--bg-void)]"
        >
          Save Changes
        </Button>
      </div>
    </form>
  )
}
