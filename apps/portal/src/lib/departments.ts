export interface QuickAction {
  label: string
  href: string
}

export interface Department {
  name: string
  displayName: string
  icon: string
  description: string
  color: string
  type: 'standard' | 'control_room' | 'satellite' | 'safety'
  status?: 'active' | 'maintenance' | 'alert'
  gridSpan?: string
  stats?: {
    label: string
    value: string
  }
  trend?: number[]
  actions?: QuickAction[]
}

export const DEPARTMENTS: Department[] = [
  {
    name: 'drilling',
    displayName: 'Drilling',
    icon: 'Drill',
    description: 'Drill rig operations & bit depth telemetry',
    color: 'blue',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-2 xl:col-span-1',
    stats: { label: 'Depth', value: '1,240m' },
    trend: [1180, 1195, 1205, 1210, 1220, 1235, 1240, 1245],
    actions: [
      { label: 'View Logs', href: '/drilling/drilling-operations' },
      { label: 'Telemetry', href: '/drilling/machine-telemetry' },
    ],
  },
  {
    name: 'production',
    displayName: 'Production',
    icon: 'Factory',
    description: 'Coal yield, tonnage & extraction tracking',
    color: 'emerald',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-2',
    stats: { label: 'Yield', value: '85%' },
    trend: [78, 80, 79, 82, 83, 84, 85, 86],
    actions: [
      { label: 'Daily Log', href: '/production/daily-log' },
      { label: 'Reports', href: '/production/reports' },
    ],
  },
  {
    name: 'access-control',
    displayName: 'Access Control',
    icon: 'ShieldCheck',
    description: 'Site access, badging & security',
    color: 'blue',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'On-site', value: '142' },
    trend: [135, 138, 140, 139, 141, 142, 142, 143],
    actions: [
      { label: 'Access Logs', href: '/access-control/access-logs' },
      { label: 'Badges', href: '/access-control/badges' },
    ],
  },
  {
    name: 'access-card-actions',
    displayName: 'Access Card Actions',
    icon: 'CreditCard',
    description: 'Manage printed badges, print cards & QR generation',
    color: 'blue',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Cards', value: '0' },
    trend: [0, 0, 0, 0, 0, 0, 0, 0],
    actions: [
      { label: 'Print Cards', href: '/access-card-actions/print-cards' },
      { label: 'QR Codes', href: '/access-card-actions/qr-codes' },
    ],
  },
  {
    name: 'engineering',
    displayName: 'Engineering',
    icon: 'Wrench',
    description: 'Equipment specs, maintenance & CAD',
    color: 'violet',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Pending', value: '12' },
    trend: [8, 10, 9, 11, 12, 11, 12, 13],
    actions: [
      { label: 'Breakdowns', href: '/engineering/breakdowns' },
      { label: 'Tires', href: '/engineering/tire-management' },
    ],
  },
  {
    name: 'control-room',
    displayName: 'Control Room',
    icon: 'Monitor',
    description: 'SCADA systems & real-time monitoring',
    color: 'red',
    type: 'control_room',
    status: 'active',
    gridSpan: 'md:col-span-2 xl:col-span-1',
    stats: { label: 'Alerts', value: '0' },
    trend: [2, 1, 1, 0, 0, 0, 0, 0],
    actions: [
      { label: 'Hourly Loads', href: '/control-room/hourly-loads' },
      { label: 'Machine Ops', href: '/control-room/machine-operations' },
    ],
  },
  {
    name: 'safety',
    displayName: 'Safety',
    icon: 'HardHat',
    description: 'Incident logs, compliance & inspections',
    color: 'blue',
    type: 'safety',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'LTI-free', value: '450d' },
    trend: [445, 446, 447, 448, 449, 450, 450, 450],
    actions: [
      { label: 'Daily Log', href: '/safety/daily-log' },
      { label: 'Incidents', href: '/safety/daily-log' },
    ],
  },
  {
    name: 'training',
    displayName: 'Training',
    icon: 'GraduationCap',
    description: 'LMS, certifications & competency tracking',
    color: 'cyan',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Courses', value: '8' },
    trend: [6, 7, 7, 8, 8, 8, 8, 9],
    actions: [
      { label: 'Certifications', href: '/training/certifications' },
      { label: 'Schedules', href: '/training/schedules' },
    ],
  },
  {
    name: 'satellite-monitoring',
    displayName: 'Satellite Monitoring',
    icon: 'Satellite',
    description: 'SAR/InSAR, hyperspectral & high-resolution imagery',
    color: 'indigo',
    type: 'satellite',
    status: 'active',
    gridSpan: 'md:col-span-2 xl:col-span-1',
    stats: { label: 'Imagery', value: 'Latest' },
    trend: [3, 4, 4, 5, 5, 6, 6, 7],
    actions: [
      { label: 'SAR View', href: '/satellite-monitoring/sar' },
      { label: 'High-Res', href: '/satellite-monitoring/highres' },
    ],
  },
  {
    name: 'environment',
    displayName: 'Environment',
    icon: 'Leaf',
    description: 'Environmental monitoring & compliance (dust, water, noise, emissions)',
    color: 'emerald',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Compliance', value: '98%' },
    trend: [96, 97, 97, 98, 98, 98, 98, 98],
    actions: [
      { label: 'Readings', href: '/environment/readings' },
      { label: 'Compliance', href: '/environment/compliance' },
    ],
  },
  {
    name: 'logistics-fleet',
    displayName: 'Logistics & Fleet',
    icon: 'Truck',
    description: 'Fleet tracking, fuel consumption & site logistics',
    color: 'indigo',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Active', value: '118' },
    trend: [112, 114, 115, 116, 116, 117, 118, 118],
    actions: [
      { label: 'Fleet', href: '/logistics-fleet/fleet' },
      { label: 'Fuel', href: '/logistics-fleet/fuel' },
    ],
  },
  {
    name: 'geology',
    displayName: 'Geology & Survey',
    icon: 'Mountain',
    description: 'Survey measurements, mine blocks & geology data',
    color: 'violet',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Blocks', value: '24' },
    trend: [18, 20, 21, 22, 23, 24, 24, 25],
    actions: [
      { label: 'Survey', href: '/geology/survey' },
      { label: 'Mine Blocks', href: '/geology/blocks' },
    ],
  },
  {
    name: 'admin',
    displayName: 'Admin',
    icon: 'ShieldCheck',
    description: 'Personnel management, shift oversight & quotas',
    color: 'violet',
    type: 'standard',
    status: 'active',
    gridSpan: 'md:col-span-1 xl:col-span-1',
    stats: { label: 'Employees', value: '248' },
    trend: [240, 242, 243, 245, 246, 247, 248, 249],
    actions: [
      { label: 'Personnel', href: '/admin/personnel' },
      { label: 'Shifts', href: '/admin/shifts' },
    ],
  },
]

export const PRODUCTIVITY_TOOLS = [
  {
    name: 'tasks',
    displayName: 'Tasks',
    icon: 'CheckSquare',
    description: 'Manage your daily to-do list',
    color: 'emerald',
  },
  {
    name: 'documents',
    displayName: 'Documents',
    icon: 'FileText',
    description: 'Access shared files & templates',
    color: 'blue',
  },
  {
    name: 'schedule',
    displayName: 'Schedule',
    icon: 'Calendar',
    description: 'View site-wide shift calendar',
    color: 'blue',
  },
  {
    name: 'calculations',
    displayName: 'Calculations',
    icon: 'Calculator',
    description: 'Quick operational formulas',
    color: 'violet',
  },
  {
    name: 'notes',
    displayName: 'Notes',
    icon: 'StickyNote',
    description: 'Personal and shared site notes',
    color: 'cyan',
  },
]

export const DEPARTMENT_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'daily-log', label: 'Daily Log', icon: 'ClipboardList' },
  { name: 'machines', label: 'Machines', icon: 'Cpu' },
  { name: 'history', label: 'History', icon: 'History' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
  { name: 'tools', label: 'Tools', icon: 'Wrench' },
] as const

/** Production specific tabs - includes grade control and yield reconciliation. */
export const PRODUCTION_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'daily-log', label: 'Daily Log', icon: 'ClipboardList' },
  { name: 'grade-control', label: 'Grade Control', icon: 'TestTube' },
  { name: 'machines', label: 'Machines', icon: 'Cpu' },
  { name: 'history', label: 'History', icon: 'History' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
  { name: 'tools', label: 'Tools', icon: 'Wrench' },
] as const

/**
 * Control Room specific tabs - optimized for mining operations monitoring
 * with automation-focused design for operators
 * AGENT-TRACE: Removed 'operational-delays' tab as delay tracking is now integrated
 * into machine-operations page. The old operational_delays table was deprecated
 * in favor of delay_entries, which are managed within the Machine Ops interface.
 */
export const CONTROL_ROOM_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'hourly-loads', label: 'Hourly Loads', icon: 'Clock' },
  { name: 'machine-operations', label: 'Machine Ops', icon: 'Cpu' },
  { name: 'engineering-notes', label: 'Eng Notes', icon: 'ClipboardList' },
  { name: 'excavator-activity', label: 'Excavator', icon: 'Pickaxe' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

export const ENGINEERING_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'breakdowns', label: 'Breakdowns', icon: 'AlertTriangle' },
  { name: 'tire-management', label: 'Tire Management', icon: 'CircleDot' },
  { name: 'daily-log', label: 'Daily Log', icon: 'ClipboardList' },
  { name: 'machines', label: 'Machines', icon: 'Cpu' },
  { name: 'history', label: 'History', icon: 'History' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
  { name: 'tools', label: 'Tools', icon: 'Wrench' },
] as const

export const SATELLITE_MONITORING_TABS = [
  { name: 'dashboard', label: 'Overview', icon: 'BarChart2' },
  { name: 'sar', label: 'SAR / InSAR', icon: 'Radio' },
  { name: 'hyperspectral', label: 'Hyperspectral', icon: 'Layers' },
  { name: 'highres', label: 'High-Res', icon: 'ScanSearch' },
  { name: 'alerts', label: 'Alerts', icon: 'BellRing' },
] as const

/**
 * Drilling specific tabs - focused on rig operations and telemetry
 */
export const DRILLING_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'drilling-operations', label: 'Drill Operations', icon: 'Drill' },
  { name: 'blast-design', label: 'Blast Design', icon: 'Crosshair' },
  { name: 'machine-telemetry', label: 'Machine Telemetry', icon: 'Activity' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

/**
 * Access Control specific tabs - focused on security, badging, and site personnel
 */
export const ACCESS_CONTROL_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'access-logs', label: 'Access Logs', icon: 'ShieldCheck' },
  { name: 'visitors', label: 'Visitors', icon: 'Users' },
  { name: 'badges', label: 'Badges', icon: 'CreditCard' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

/**
 * Access Card Actions specific tabs - focused on badge printing and QR generation
 */
export const ACCESS_CARD_ACTIONS_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'card-actions', label: 'Card Actions', icon: 'CreditCard' },
  { name: 'print-cards', label: 'Print Cards', icon: 'Printer' },
  { name: 'print-history', label: 'Print History', icon: 'History' },
  { name: 'qr-codes', label: 'QR Codes', icon: 'QrCode' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

/**
 * Training specific tabs - focused on training programs, certifications, schedules, and LMS progress
 */
export const TRAINING_TABS = [
  { name: 'dashboard', label: 'Overview', icon: 'BarChart2' },
  { name: 'certifications', label: 'Certifications', icon: 'ShieldCheck' },
  { name: 'courses', label: 'Courses & LMS', icon: 'GraduationCap' },
  { name: 'trainees', label: 'Trainees', icon: 'Users' },
  { name: 'instructors', label: 'Instructors', icon: 'UserCheck' },
  { name: 'schedules', label: 'Schedules', icon: 'Clock' },
  { name: 'archive', label: 'Archived Docs', icon: 'Archive' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

export const SAFETY_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'daily-log', label: 'Daily Log', icon: 'ClipboardList' },
  { name: 'observations', label: 'Observations', icon: 'Eye' },
  { name: 'jsa', label: 'JSA', icon: 'FileCheck' },
  { name: 'audit-dashboard', label: 'Audit Logs', icon: 'ShieldCheck' },
  { name: 'archive', label: 'Archived Docs', icon: 'Archive' },
  { name: 'machines', label: 'Machines', icon: 'Cpu' },
  { name: 'history', label: 'History', icon: 'History' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
  { name: 'tools', label: 'Tools', icon: 'Wrench' },
] as const

/** Admin is not a department shell; tabs match hub actions + /admin root. */
export const ADMIN_TABS = [
  { name: 'dashboard', label: 'Dashboard', icon: 'BarChart2' },
  { name: 'personnel', label: 'Personnel', icon: 'Users' },
  { name: 'shifts', label: 'Shifts', icon: 'Clock' },
  { name: 'audit-trail', label: 'Audit Trail', icon: 'ShieldCheck' },
] as const

/** Environment specific tabs - focused on environmental monitoring & compliance. */
export const ENVIRONMENT_TABS = [
  { name: 'dashboard', label: 'Overview', icon: 'BarChart2' },
  { name: 'readings', label: 'Readings', icon: 'Activity' },
  { name: 'incidents', label: 'Incidents', icon: 'AlertTriangle' },
  { name: 'compliance', label: 'Compliance', icon: 'ShieldCheck' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

/** Logistics & Fleet specific tabs - focused on fleet tracking, fuel & logistics. */
export const LOGISTICS_FLEET_TABS = [
  { name: 'dashboard', label: 'Overview', icon: 'BarChart2' },
  { name: 'fleet', label: 'Fleet', icon: 'Truck' },
  { name: 'fuel', label: 'Fuel', icon: 'Fuel' },
  { name: 'maintenance', label: 'Maintenance', icon: 'Wrench' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

/** Geology & Survey specific tabs - focused on survey, mine blocks & geology data. */
export const GEOLOGY_TABS = [
  { name: 'dashboard', label: 'Overview', icon: 'BarChart2' },
  { name: 'survey', label: 'Survey', icon: 'Ruler' },
  { name: 'blocks', label: 'Mine Blocks', icon: 'Layers' },
  { name: 'survey-plans', label: 'Survey Plans', icon: 'ClipboardList' },
  { name: 'reports', label: 'Reports', icon: 'FileText' },
] as const

/**
 * Get tabs for a specific department
 * Control Room gets specialized tabs, others get standard tabs
 */
export function getDepartmentTabs(departmentName: string) {
  if (departmentName === 'control-room') {
    return CONTROL_ROOM_TABS
  }
  if (departmentName === 'access-control') {
    return ACCESS_CONTROL_TABS
  }
  if (departmentName === 'access-card-actions') {
    return ACCESS_CARD_ACTIONS_TABS
  }
  if (departmentName === 'satellite-monitoring') {
    return SATELLITE_MONITORING_TABS
  }
  if (departmentName === 'engineering') {
    return ENGINEERING_TABS
  }
  if (departmentName === 'drilling') {
    return DRILLING_TABS
  }
  if (departmentName === 'training') {
    return TRAINING_TABS
  }
  if (departmentName === 'safety') {
    return SAFETY_TABS
  }
  if (departmentName === 'admin') {
    return ADMIN_TABS
  }
  if (departmentName === 'environment') {
    return ENVIRONMENT_TABS
  }
  if (departmentName === 'logistics-fleet') {
    return LOGISTICS_FLEET_TABS
  }
  if (departmentName === 'geology') {
    return GEOLOGY_TABS
  }
  if (departmentName === 'production') {
    return PRODUCTION_TABS
  }
  return DEPARTMENT_TABS
}
