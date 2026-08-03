/**
 * @module query-builder
 * Type-safe repository objects for common database queries.
 *
 * Each repository exposes a small set of frequently-used queries
 * (getAll, getById, create, etc.) with fully-typed row results.
 */
import { db } from './index'
import type { DepartmentRow, EmployeeRow, MachineRow, DailyLogRow, MachineHoursRow } from './types'

/**
 * Type-safe query functions for the `departments` table.
 */
export const departmentRepository = {
  /** Fetch every department row. */
  async getAll(): Promise<DepartmentRow[]> {
    return db.query('SELECT * FROM departments').execute()
  },

  /** Fetch a single department by its primary key. */
  async getById(id: string): Promise<DepartmentRow | null> {
    return db.query('SELECT * FROM departments WHERE id = $1').execute(id)
  },

  /** Insert a new department row and return the created record. */
  async create(dept: Omit<DepartmentRow, 'id' | 'created_at'>): Promise<DepartmentRow> {
    return db
      .query(
        'INSERT INTO departments (name, display_name, icon, description, color) VALUES ($1, $2, $3, $4, $5) RETURNING *'
      )
      .execute(dept.name, dept.display_name, dept.icon, dept.description, dept.color)
      .execute()
  },
}

/**
 * Type-safe query functions for the `employees` table.
 */
export const employeeRepository = {
  /** Look up an employee by their Supabase Auth user ID. */
  async getByAuthId(authId: string): Promise<EmployeeRow | null> {
    return db.query('SELECT * FROM employees WHERE auth_id = $1').execute(authId)
  },

  /** List all employees belonging to a department. */
  async getByDepartment(deptId: string): Promise<EmployeeRow[]> {
    return db.query('SELECT * FROM employees WHERE department_id = $1').execute(deptId)
  },

  /** Update the role of an employee identified by auth ID. */
  async updateRole(authId: string, newRole: string): Promise<void> {
    await db.query('UPDATE employees SET role = $1 WHERE auth_id = $2').execute(newRole, authId)
  },
}

/**
 * Type-safe query functions for the `machines` table.
 */
export const machineRepository = {
  /** List active machines for a given department. */
  async getActiveByDepartment(deptId: string): Promise<MachineRow[]> {
    return db
      .query('SELECT * FROM machines WHERE department_id = $1 AND active = true')
      .execute(deptId)
  },

  /** Fetch a single machine by its primary key. */
  async getById(machineId: string): Promise<MachineRow | null> {
    return db.query('SELECT * FROM machines WHERE id = $1').execute(machineId)
  },
}

/**
 * Type-safe query functions for the `daily_logs` table.
 */
export const dailyLogRepository = {
  /** Fetch daily logs within an inclusive date range (YYYY-MM-DD strings). */
  async getByDateRange(startDate: string, endDate: string): Promise<DailyLogRow[]> {
    return db
      .query('SELECT * FROM daily_logs WHERE log_date BETWEEN $1 AND $2')
      .execute(startDate, endDate)
  },

  /** Fetch all daily logs for a department. */
  async getByDepartment(deptId: string): Promise<DailyLogRow[]> {
    return db.query('SELECT * FROM daily_logs WHERE department_id = $1').execute(deptId)
  },
}

/**
 * Type-safe query functions for the `machine_hours` table.
 */
export const machineHoursRepository = {
  /** Fetch all machine-hour entries for a specific machine. */
  async getHoursByMachine(machineId: string): Promise<MachineHoursRow[]> {
    return db.query('SELECT * FROM machine_hours WHERE machine_id = $1').execute(machineId)
  },

  /** Fetch all machine-hour entries linked to a specific daily log. */
  async getByDailyLog(dailyLogId: string): Promise<MachineHoursRow[]> {
    return db.query('SELECT * FROM machine_hours WHERE daily_log_id = $1').execute(dailyLogId)
  },
}
