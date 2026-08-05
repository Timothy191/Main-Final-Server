# @repo/database — Specification

Kysely-backed PostgreSQL connection singleton, local SQLite development dialect, master database schema types, and type-safe repository objects.

## 1. Overview & Architecture

`@repo/database` provides compile-time safe database access. It exposes the `db` Kysely instance configured with `better-sqlite3` for local development or PostgreSQL for production, alongside full schema typings matching Supabase database tables and RLS policies.

- **Exported Subpaths:**
  - `.` (`db` instance, `Database` interface, `Json` helper type)
  - `./types` (Master `Database` schema and 50+ table interfaces)
  - `./query-builder` (Type-safe repositories)

---

## 2. Exported Specification

### 2.1 Core Instance (`src/index.ts`)

```typescript
export const db: Kysely<DatabaseSchema>
```

Kysely singleton connected to SQLite (`process.env.SQLITE_DB_PATH || 'arch.db'`) or PostgreSQL.

### 2.2 Master Database Schema Types (`src/types.ts`)

Contains 1:1 table column mappings for all platform entities:

- `auth.users` -> `AuthUsers`
- `departments` -> `Departments`
- `employees` -> `Employees`
- `machines` -> `Machines`
- `daily_logs` -> `DailyLogs`
- `machine_hours` -> `MachineHours`
- `webhook_endpoints`, `webhook_delivery_logs`, `audit_logs`, `access_logs`, `control_room_shifts`, `badges`, `personnel`, `visitors`, `hourly_loads`, `safety_incidents`, `dozer_rolls`, `drill_operations`, etc.

### 2.3 Repositories (`src/query-builder.ts`)

- `departmentRepository`: `getAll()`, `getById(id)`, `create(dept)`
- `employeeRepository`: `getByAuthId(authId)`, `getByDepartment(deptId)`, `updateRole(authId, newRole)`
- `machineRepository`: `getActiveByDepartment(deptId)`, `getById(machineId)`
- `dailyLogRepository`: `getByDateRange(startDate, endDate)`, `getByDepartment(deptId)`
- `machineHoursRepository`: `getHoursByMachine(machineId)`, `getByDailyLog(dailyLogId)`

---

## 3. Dependencies

- `dependencies`: `better-sqlite3` (`^13.0.1`), `kysely` (`^0.29.3`), `pg` (`^8.13.1`)
- `devDependencies`: `@types/better-sqlite3`, `@types/pg`
