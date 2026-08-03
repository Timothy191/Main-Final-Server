/**
 * @module database/types
 * Type-safe database schema definitions for the PostgreSQL native migration.
 *
 * Each interface maps 1-to-1 to a database table column set.
 * The top-level {@link Database} interface is consumed by Kysely to
 * provide compile-time query validation.
 */

/** Arbitrary JSON value storable in `jsonb` columns. */
export type Json = Record<string, unknown> | unknown[]

/** Authenticated user row from the `auth.users` table. */
export interface AuthUsers {
  id: string
  email: string
  encrypted_password: string
  email_confirmed_at: Date | null
  invited_at: Date | null
  confirmation_sent_at: Date | null
  recovery_sent_at: Date | null
  last_sign_in_at: Date | null
  role: string | null
  updated_at: Date
  created_at: Date
  is_super_admin: boolean
  banned_until: Date | null
  phone: string | null
  raw_user_meta_data: Json | null
  raw_app_meta_data: Json | null
}

/** Department definition — maps to the `departments` table. */
export interface Departments {
  id: string
  name: string
  display_name: string
  icon: string
  description: string | null
  color: string
  created_at: Date
}

/** Employee record linked to an auth user — maps to the `employees` table. */
export interface Employees {
  id: string
  auth_id: string
  department_id: string | null
  full_name: string
  role: string
  accessible_departments: string[] | null
  created_at: Date
}

/** Machine / equipment record — maps to the `machines` table. */
export interface Machines {
  id: string
  department_id: string
  name: string
  machine_type: string
  serial_number: string | null
  active: boolean
  created_at: Date
  report_exempt?: boolean
}

/** Daily shift log entry — maps to the `daily_logs` table. */
export interface DailyLogs {
  id: string
  department_id: string
  log_date: string // DATE type
  shift: 'day' | 'night'
  notes: string | null
  created_at: Date
}

/** Hours worked by a machine within a daily log — maps to `machine_hours`. */
export interface MachineHours {
  id: string
  daily_log_id: string
  machine_id: string
  hours_worked: number
  created_at: Date
}

/** Webhook endpoint configuration — maps to `webhook_endpoints`. */
export interface WebhookEndpoints {
  id?: string
  url: string
  description: string | null
  event_types: string[]
  department_id: string | null
  active: boolean | null
  deleted_at: string | null
  created_at?: Date
  updated_at: Date | null
}

/** Webhook delivery attempt log — maps to `webhook_delivery_logs`. */
export interface WebhookDeliveryLogs {
  id: string
  webhook_endpoint_id: string
  delivery_status: string
  payload: Json
  response: Json | null
  created_at: Date
  error_message: string | null
}

/** Audit trail entry — maps to `audit_logs`. */
export interface AuditLogs {
  id?: string
  action: string
  table_name: string
  record_id: string
  old_values: Json | null
  new_values: Json | null
  user_id: string | null
  created_at?: Date
}

/** Site access log entry — maps to `access_logs`. */
export interface AccessLogs {
  id?: string
  badge_id: string | null
  access_type: string
  direction: 'IN' | 'OUT'
  gate_location: string
  access_granted?: boolean
  denial_reason: string | null
  scanned_at?: Date
  department_id?: string | null
}

/** Control room shift record — maps to `control_room_shifts`. */
export interface ControlRoomShifts {
  id: string
  department_id: string
  shift_date: string
  shift_type: 'day' | 'night'
  crew_size: number
  notes: string | null
  created_at: Date
}

/** Activity recorded during a control room shift — maps to `control_room_activities`. */
export interface ControlRoomActivities {
  id: string
  shift_id: string
  activity_type: string
  description: string
  recorded_by: string
  created_at: Date
}

/** Minimal interfaces for tables used in services */

/** Security badge (QR / RFID) — maps to `badges`. */
export interface Badges {
  id?: string
  qr_code: string
  entity_type: 'personnel' | 'visitor'
  personnel_id: string | null
  visitor_id: string | null
  is_active?: boolean
  issued_at?: Date
  revoked_at?: Date | null
}

/** Site personnel record — maps to `personnel`. */
export interface Personnel {
  id: string
  first_name: string
  surname: string
  status: string
  department_id: string | null
  created_at: Date
}

/** Visitor record — maps to `visitors`. */
export interface Visitors {
  id: string
  name: string
  status: string
  company: string | null
  created_at: Date
}

/** Machine operation summary — maps to `machine_operations`. */
export interface MachineOperations {
  id: string
  machine_id: string
  shift_date: string
  shift_type: 'day' | 'night'
  hours_operated: number
  total_loads: number
  created_at: Date
}

/** Excavator activity record — maps to `excavator_activity`. */
export interface ExcavatorActivity {
  id: string
  excavator_id: string
  activity_date: string
  shift_type: 'day' | 'night'
  hours_worked: number
  loads_count: number
  created_at: Date
}

/** Dozer roll count — maps to `dozer_rolls`. */
export interface DozerRolls {
  id: string
  dozer_id: string
  roll_date: string
  shift_type: 'day' | 'night'
  rolls_count: number
  created_at: Date
}

// ── Additional table interfaces ─────────────────────────────────────────────

/** AI model usage tracking — maps to `ai_usage_logs`. */
export interface AiUsageLogs {
  id: string
  model: string
  tokens: number
  created_at: Date
}

/** Machine breakdown record — maps to `breakdowns`. */
export interface Breakdowns {
  id: string
  machine_id: string
  delay_category_id: string
  duration_minutes: number
  created_at: Date
}

/** Cache anomaly detection record — maps to `cache_anomalies`. */
export interface CacheAnomalies {
  id: string
  cache_key: string
  anomaly_type: string
  created_at: Date
}

/** Cache event log — maps to `cache_events`. */
export interface CacheEvents {
  id: string
  event_type: string
  payload: Json
  created_at: Date
}

/** Delay category lookup — maps to `delay_categories`. */
export interface DelayCategories {
  id: string
  name: string
  category: string
  created_at: Date
}

/** Document record — maps to `documents`. */
export interface Documents {
  id: string
  title: string
  content: string
  created_at: Date
}

/** Document version history — maps to `document_versions`. */
export interface DocumentVersions {
  id: string
  document_id: string
  version: number
  content: string
  created_at: Date
}

/** Archived dozer rolls — maps to `dozer_rolls_archive`. */
export interface DozerRollsArchive {
  id: string
  dozer_id: string
  roll_date: string
  shift_type: string
  rolls_count: number
  created_at: Date
}

/** Drill operation record — maps to `drill_operations`. */
export interface DrillOperations {
  id: string
  machine_id: string
  shift_date: string
  shift_type: 'day' | 'night'
  meters_drilled: number
  created_at: Date
}

/** Archived drill operations — maps to `drill_operations_archive`. */
export interface DrillOperationsArchive {
  id: string
  machine_id: string
  shift_date: string
  shift_type: string
  meters_drilled: number
  created_at: Date
}

/** Embedding cache entry — maps to `embedding_cache`. */
export interface EmbeddingCache {
  id: string
  model: string
  input_hash: string
  embedding: number[]
  created_at: Date
}

/** Engineering note — maps to `engineering_notes`. */
export interface EngineeringNotes {
  id: string
  title: string
  content: string
  created_at: Date
}

/** Archived engineering note — maps to `engineering_notes_archive`. */
export interface EngineeringNotesArchive {
  id: string
  title: string
  content: string
  created_at: Date
}

/** Equipment record — maps to `equipment`. */
export interface Equipment {
  id: string
  name: string
  type: string
  department_id: string | null
  created_at: Date
}

/** Excavator-to-dumper assignment — maps to `excavator_dumper_assignments`. */
export interface ExcavatorDumperAssignments {
  id: string
  excavator_id: string
  dumper_id: string
  shift_date: string
  shift_type: 'day' | 'night'
  created_at: Date
}

/** Archived excavator-dumper assignment — maps to `excavator_dumper_assignments_archive`. */
export interface ExcavatorDumperAssignmentsArchive {
  id: string
  excavator_id: string
  dumper_id: string
  shift_date: string
  shift_type: string
  created_at: Date
}

/** Fleet vehicle record — maps to `fleet`. */
export interface Fleet {
  id: string
  name: string
  department_id: string | null
  created_at: Date
}

/** Fuel consumption log — maps to `fuel_logs`. */
export interface FuelLogs {
  id: string
  machine_id: string
  liters: number
  created_at: Date
}

/** Generated report record — maps to `generated_reports`. */
export interface GeneratedReports {
  id: string
  template_id: string
  generated_by: string
  output_path: string
  created_at: Date
}

/** Hourly load counts per machine — maps to `hourly_loads`. */
export interface HourlyLoads {
  id: string
  department_id: string
  machine_id: string
  load_date: string
  shift_type: 'day' | 'night'
  hour_01: number
  hour_02: number
  hour_03: number
  hour_04: number
  hour_05: number
  hour_06: number
  hour_07: number
  hour_08: number
  hour_09: number
  hour_10: number
  hour_11: number
  hour_12: number
  total_loads: number
  created_at: Date
  updated_at: Date
  created_by?: string | null
  updated_by?: string | null
}

/** Machine configuration key-value — maps to `machine_configurations`. */
export interface MachineConfigurations {
  id: string
  machine_id: string
  config_key: string
  config_value: Json
  created_at: Date
}

/** Archived machine operations — maps to `machine_operations_archive`. */
export interface MachineOperationsArchive {
  id: string
  machine_id: string
  shift_date: string
  shift_type: string
  hours_operated: number
  total_loads: number
  created_at: Date
}

/** Machine telemetry data point — maps to `machine_telemetry`. */
export interface MachineTelemetry {
  id: string
  machine_id: string
  timestamp: Date
  data: Json
  created_at: Date
}

/** Archived machine telemetry — maps to `machine_telemetry_archive`. */
export interface MachineTelemetryArchive {
  id: string
  machine_id: string
  timestamp: Date
  data: Json
  created_at: Date
}

/** Materialized view refresh audit log — maps to `materialized_view_refresh_log`. */
export interface MaterializedViewRefreshLog {
  id: string
  view_name: string
  status: string
  duration_ms: number
  created_at: Date
}

/** AI memory embedding record — maps to `memory_embeddings`. */
export interface MemoryEmbeddings {
  id: string
  content_hash: string
  embedding: number[]
  created_at: Date
}

/** Mine block / section — maps to `mine_blocks`. */
export interface MineBlocks {
  id: string
  name: string
  site_id: string | null
  created_at: Date
}

/** Operational delay entry — maps to `operational_delays`. */
export interface OperationalDelays {
  id: string
  machine_id: string
  delay_category_id: string
  duration_minutes: number
  created_at: Date
}

/** Archived operational delay — maps to `operational_delays_archive`. */
export interface OperationalDelaysArchive {
  id: string
  machine_id: string
  delay_category_id: string
  duration_minutes: number
  created_at: Date
}

/** Machine operator record — maps to `operators`. */
export interface Operators {
  id: string
  name: string
  employee_id: string | null
  created_at: Date
}

/** Production log entry — maps to `production_logs`. */
export interface ProductionLogs {
  id: string
  machine_id: string
  shift_date: string
  shift_type: 'day' | 'night'
  production_data: Json
  created_at: Date
}

/** Report template definition — maps to `report_templates`. */
export interface ReportTemplates {
  id: string
  name: string
  template: string
  created_at: Date
}

/** Safety incident category lookup — maps to `safety_incident_categories`. */
export interface SafetyIncidentCategories {
  id: string
  name: string
  description: string | null
  created_at: Date
}

/** Safety incident record — maps to `safety_incidents`. */
export interface SafetyIncidents {
  id: string
  category_id: string
  severity_id: string
  description: string
  reported_by: string
  created_at: Date
}

/** Safety severity level lookup — maps to `safety_severities`. */
export interface SafetySeverities {
  id: string
  name: string
  level: number
  created_at: Date
}

/** Shift handover note — maps to `shift_notes`. */
export interface ShiftNotes {
  id: string
  shift_id: string
  note: string
  created_by: string
  created_at: Date
}

/** Shift status tracking — maps to `shift_status`. */
export interface ShiftStatus {
  id: string
  shift_id: string
  status: string
  updated_at: Date
}

/** Mine site record — maps to `sites`. */
export interface Sites {
  id: string
  name: string
  location: string | null
  created_at: Date
}

/** Table sync watermark — maps to `sync_watermarks`. */
export interface SyncWatermarks {
  id: string
  table_name: string
  last_synced_at: Date
  created_at: Date
}

/** Vector search result cache — maps to `vector_search_cache`. */
export interface VectorSearchCache {
  id: string
  query_hash: string
  results: Json
  created_at: Date
}

/** Vector search performance log — maps to `vector_search_performance`. */
export interface VectorSearchPerformance {
  id: string
  query: string
  duration_ms: number
  created_at: Date
}

/** Row type aliases consumed by the query-builder repository objects. */
export type DepartmentRow = Departments
export type EmployeeRow = Employees
export type MachineRow = Machines
export type DailyLogRow = DailyLogs
export type MachineHoursRow = MachineHours

/**
 * Master database interface — maps every table name to its row type.
 * Consumed by Kysely `<Database>` generic for compile-time query safety.
 */
export interface Database {
  access_logs: AccessLogs
  access_logs_archive: AccessLogs
  ai_usage_logs: AiUsageLogs
  audit_logs: AuditLogs
  badges: Badges
  breakdowns: Breakdowns
  cache_anomalies: CacheAnomalies
  cache_events: CacheEvents
  daily_logs: DailyLogs
  delay_categories: DelayCategories
  departments: Departments
  documents: Documents
  document_versions: DocumentVersions
  dozer_rolls: DozerRolls
  dozer_rolls_archive: DozerRollsArchive
  drill_operations: DrillOperations
  drill_operations_archive: DrillOperationsArchive
  embedding_cache: EmbeddingCache
  employees: Employees
  engineering_notes: EngineeringNotes
  engineering_notes_archive: EngineeringNotesArchive
  equipment: Equipment
  excavator_activity: ExcavatorActivity
  excavator_activity_archive: ExcavatorActivity
  excavator_dumper_assignments: ExcavatorDumperAssignments
  excavator_dumper_assignments_archive: ExcavatorDumperAssignmentsArchive
  fleet: Fleet
  fuel_logs: FuelLogs
  generated_reports: GeneratedReports
  hourly_loads: HourlyLoads
  machine_configurations: MachineConfigurations
  machine_hours: MachineHours
  machine_operations: MachineOperations
  machine_operations_archive: MachineOperationsArchive
  machines: Machines
  machine_telemetry: MachineTelemetry
  machine_telemetry_archive: MachineTelemetryArchive
  materialized_view_refresh_log: MaterializedViewRefreshLog
  memory_embeddings: MemoryEmbeddings
  mine_blocks: MineBlocks
  operational_delays: OperationalDelays
  operational_delays_archive: OperationalDelaysArchive
  operators: Operators
  personnel: Personnel
  production_logs: ProductionLogs
  report_templates: ReportTemplates
  safety_incident_categories: SafetyIncidentCategories
  safety_incidents: SafetyIncidents
  safety_severities: SafetySeverities
  shift_notes: ShiftNotes
  shift_status: ShiftStatus
  sites: Sites
  sync_watermarks: SyncWatermarks
  vector_search_cache: VectorSearchCache
  vector_search_performance: VectorSearchPerformance
  visitors: Visitors
  webhook_delivery_logs: WebhookDeliveryLogs
  webhook_endpoints: WebhookEndpoints
  'auth.users': AuthUsers
}
