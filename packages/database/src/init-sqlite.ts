import Database from 'better-sqlite3'
import crypto from 'crypto'

async function main() {
  const dbPath = process.env.SQLITE_DB_PATH || 'arch.db'
  console.log(`Initializing SQLite database at: ${dbPath}...`)

  const db = new Database(dbPath)

  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Create tables
  console.log('Creating tables...')

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      auth_id TEXT UNIQUE NOT NULL,
      department_id TEXT,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL,
      accessible_departments TEXT, -- JSON string array of UUIDs
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      operator_id TEXT,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (operator_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS machines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      department_id TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS engineering_notes (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id),
      FOREIGN KEY (author_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS control_room_shifts (
      id TEXT PRIMARY KEY,
      shift_date TEXT NOT NULL,
      shift_type TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS control_room_activities (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (shift_id) REFERENCES control_room_shifts(id)
    );

    CREATE TABLE IF NOT EXISTS badges (
      id TEXT PRIMARY KEY,
      employee_id TEXT NOT NULL,
      badge_number TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (employee_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS personnel (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      department_id TEXT NOT NULL,
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      purpose TEXT NOT NULL,
      check_in_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS machine_operations (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS excavator_activity (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      excavator_id TEXT NOT NULL,
      tonnage REAL NOT NULL,
      FOREIGN KEY (shift_id) REFERENCES control_room_shifts(id),
      FOREIGN KEY (excavator_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS dozer_rolls (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      value REAL NOT NULL,
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS ai_usage_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      tokens INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES employees(id)
    );

    CREATE TABLE IF NOT EXISTS breakdowns (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      description TEXT NOT NULL,
      reported_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS hourly_loads (
      id TEXT PRIMARY KEY,
      shift_id TEXT NOT NULL,
      hour INTEGER NOT NULL,
      load REAL NOT NULL,
      FOREIGN KEY (shift_id) REFERENCES control_room_shifts(id)
    );

    CREATE TABLE IF NOT EXISTS drill_operations (
      id TEXT PRIMARY KEY,
      drill_id TEXT NOT NULL,
      depth REAL NOT NULL,
      rate REAL NOT NULL,
      FOREIGN KEY (drill_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS machine_telemetry (
      id TEXT PRIMARY KEY,
      machine_id TEXT NOT NULL,
      temperature REAL NOT NULL,
      pressure REAL NOT NULL,
      timestamp TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (machine_id) REFERENCES machines(id)
    );

    CREATE TABLE IF NOT EXISTS safety_incidents (
      id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      reported_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (department_id) REFERENCES departments(id)
    );
  `)

  console.log('Database schema successfully generated.')

  // Seeding default departments
  console.log('Seeding departments...')
  const depts = [
    { id: 'a73d8275-e0d7-4aa2-bd98-2b6c5bf6847b', name: 'drilling', display_name: 'Drilling' },
    { id: 'e94c810d-18e0-41e4-a374-eb1605ed9073', name: 'production', display_name: 'Production' },
    {
      id: '2545eeef-d1e5-49fa-90fd-27a097513be6',
      name: 'access-control',
      display_name: 'Access Control',
    },
    {
      id: '739286da-7170-43e7-bd82-748fda43ad66',
      name: 'engineering',
      display_name: 'Engineering',
    },
    {
      id: '05134c33-b1b6-479f-a125-fb9647d40df4',
      name: 'control-room',
      display_name: 'Control Room',
    },
    { id: 'c3f1981b-9cfa-475a-8422-f966e739ba55', name: 'safety', display_name: 'Safety' },
    { id: 'fa5a9dea-8c83-4171-a2fc-ab43d1743ba8', name: 'training', display_name: 'Training' },
    {
      id: '1faaafe4-ed67-4e85-9af8-50b29e6c1a13',
      name: 'satellite-monitoring',
      display_name: 'Satellite Monitoring',
    },
    { id: 'ff63676b-2b14-47a5-b3ab-96883dcc7797', name: 'admin', display_name: 'Admin' },
    {
      id: 'b7800380-997c-480c-a24f-e6c87931a4d2',
      name: 'access-card-actions',
      display_name: 'Access Card Actions',
    },
    {
      id: '7c4a1f2e-9b3d-4c8e-a1f2-0d3e4f5a6b7c',
      name: 'environment',
      display_name: 'Environment',
    },
    {
      id: '8d5b2f3e-ac4e-4d9f-b2f3-1e4f5a6b7c8d',
      name: 'logistics-fleet',
      display_name: 'Logistics & Fleet',
    },
    {
      id: '9e6c3f4e-bd5f-4eaf-c3f4-2f5a6b7c8d9e',
      name: 'geology',
      display_name: 'Geology & Survey',
    },
  ]

  const insertDept = db.prepare(
    'INSERT OR IGNORE INTO departments (id, name, display_name) VALUES (?, ?, ?)'
  )
  for (const d of depts) {
    insertDept.run(d.id, d.name, d.display_name)
  }

  // Seeding default users
  console.log('Seeding employees...')

  // Custom simple scrypt hash function for password authentication
  const salt = 'arch_systems_salt_2026'
  const hashPassword = (password: string) => {
    return crypto.scryptSync(password, salt, 64).toString('hex')
  }

  const users = [
    {
      id: crypto.randomUUID(),
      auth_id: '193539af-996f-4cd3-873b-6dd15f1990be', // Admin UUID
      department_id: null,
      full_name: 'System Administrator',
      role: 'admin',
      accessible_departments: JSON.stringify(depts.map((d) => d.id)),
      email: 'timothyoniel558@gmail.com',
      password_hash: hashPassword('Yugioh@123#'),
    },
    {
      id: crypto.randomUUID(),
      auth_id: '8a4dd959-f1c9-48b1-9a6e-e64aba70da7c', // Control Operator UUID
      department_id: '05134c33-b1b6-479f-a125-fb9647d40df4',
      full_name: 'Control Operator 01',
      role: 'control_room_operator',
      accessible_departments: JSON.stringify([
        '05134c33-b1b6-479f-a125-fb9647d40df4',
        'a73d8275-e0d7-4aa2-bd98-2b6c5bf6847b',
        'e94c810d-18e0-41e4-a374-eb1605ed9073',
        '739286da-7170-43e7-bd82-748fda43ad66',
      ]),
      email: 'control01@plantcor.os',
      password_hash: hashPassword('Yugioh@123#'),
    },
  ]

  const insertEmp = db.prepare(`
    INSERT OR IGNORE INTO employees 
    (id, auth_id, department_id, full_name, role, accessible_departments, email, password_hash) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const u of users) {
    insertEmp.run(
      u.id,
      u.auth_id,
      u.department_id,
      u.full_name,
      u.role,
      u.accessible_departments,
      u.email,
      u.password_hash
    )
  }

  console.log('Database seed successfully executed.')
  db.close()
}

main().catch(console.error)
