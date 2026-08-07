'use server'

import { cacheTag, cacheLife } from 'next/cache'
import { DatabaseError } from '@/lib/errors/error-classes'
import { assertDeptRole } from '@/lib/dept-access'
import { DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type CertificationStatus = 'active' | 'expiring' | 'expired'

export interface Certification {
  id: string
  employeeName: string
  role: string | null
  certification: string
  issueDate: string
  expiryDate: string
  status: CertificationStatus
}

export interface TrainingCourse {
  id: string
  title: string
  category: 'Safety' | 'Equipment' | 'Induction' | 'Compliance'
  description: string | null
  lessons: number
  durationMinutes: number
  level: 'Basic' | 'Intermediate' | 'Advanced'
  enrolledCount: number
  completionRate: number
}

export interface TrainingSchedule {
  id: string
  courseName: string
  location: string | null
  sessionDate: string
  startTime: string | null
  endTime: string | null
  instructor: string | null
  capacity: number
  filled: number
  sessionType: 'Mandatory' | 'Refresher' | 'Voluntary'
  status: 'Confirmed' | 'Tentative' | 'Cancelled'
}

export interface TrainingMetrics {
  lmsCompliance: number
  activeTrainees: number
  upcomingSessions: number
  totalCourses: number
  activeCertifications: number
  expiringCertifications: number
  expiredCertifications: number
  hoursLoggedMtd: number
}

/* ------------------------------------------------------------------ */
/*  Auth helper                                                        */
/* ------------------------------------------------------------------ */

async function assertTrainingRole() {
  return assertDeptRole(['admin', 'training', 'supervisor'], 'training')
}

/* ------------------------------------------------------------------ */
/*  Status helpers                                                     */
/* ------------------------------------------------------------------ */

const DAY_MS = 24 * 60 * 60 * 1000

function certificationStatus(expiryDate: string, today: string): CertificationStatus {
  const expiry = new Date(expiryDate).getTime()
  const now = new Date(today).getTime()
  if (expiry < now) return 'expired'
  if (expiry - now <= 30 * DAY_MS) return 'expiring'
  return 'active'
}

/* ------------------------------------------------------------------ */
/*  Shared list + filter helpers                                       */
/* ------------------------------------------------------------------ */

const CERTIFICATIONS_SELECT = 'id, employee_name, role, certification, issue_date, expiry_date'

const COURSES_SELECT =
  'id, title, category, description, lessons, duration_minutes, level, enrolled_count, completion_rate'

const SCHEDULES_SELECT =
  'id, course_name, location, session_date, start_time, end_time, instructor, capacity, filled, session_type, status'

const TRAINEES_SELECT =
  'id, employee_name, role, enrolled_date, courses_completed, courses_in_progress, total_hours_logged, avg_score, status'

const INSTRUCTORS_SELECT =
  'id, instructor_name, specialization, certifications, active, max_concurrent_sessions, current_sessions, rating'

const ARCHIVED_DOCS_SELECT =
  'id, document_name, document_type, employee_name, file_url, archived_at, notes'

const REPORTS_SELECT = 'id, report_type, report_date, report_data, pdf_url, generated_at'

interface CertificationRow {
  id: string
  employee_name: string
  role: string | null
  certification: string
  issue_date: string
  expiry_date: string
}

interface CourseRow {
  id: string
  title: string
  category: TrainingCourse['category']
  description: string | null
  lessons: number
  duration_minutes: number
  level: TrainingCourse['level']
  enrolled_count: number
  completion_rate: number
}

interface ScheduleRow {
  id: string
  course_name: string
  location: string | null
  session_date: string
  start_time: string | null
  end_time: string | null
  instructor: string | null
  capacity: number
  filled: number
  session_type: TrainingSchedule['sessionType']
  status: TrainingSchedule['status']
}

interface TraineeRow {
  id: string
  employee_name: string
  role: string | null
  enrolled_date: string
  courses_completed: number
  courses_in_progress: number
  total_hours_logged: number
  avg_score: number | null
  status: string
}

interface InstructorRow {
  id: string
  instructor_name: string
  specialization: string | null
  certifications: string[] | null
  active: boolean
  max_concurrent_sessions: number
  current_sessions: number
  rating: number | null
}

interface ArchivedDocumentRow {
  id: string
  document_name: string
  document_type: string
  employee_name: string | null
  file_url: string | null
  archived_at: string
  notes: string | null
}

interface TrainingReportRow {
  id: string
  report_type: string | null
  report_date: string
  report_data: { name?: string } | null
  pdf_url: string | null
  generated_at: string
}

/** snake_case row -> Certification, deriving status from expiry vs today. */
function toCertification(row: CertificationRow, today: string): Certification {
  return {
    id: row.id,
    employeeName: row.employee_name,
    role: row.role,
    certification: row.certification,
    issueDate: row.issue_date,
    expiryDate: row.expiry_date,
    status: certificationStatus(row.expiry_date, today),
  }
}

function toCourse(row: CourseRow): TrainingCourse {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    description: row.description,
    lessons: row.lessons,
    durationMinutes: row.duration_minutes,
    level: row.level,
    enrolledCount: row.enrolled_count,
    completionRate: row.completion_rate,
  }
}

function toSchedule(row: ScheduleRow): TrainingSchedule {
  return {
    id: row.id,
    courseName: row.course_name,
    location: row.location,
    sessionDate: row.session_date,
    startTime: row.start_time,
    endTime: row.end_time,
    instructor: row.instructor,
    capacity: row.capacity,
    filled: row.filled,
    sessionType: row.session_type,
    status: row.status,
  }
}

function toTrainee(row: TraineeRow): TraineeRecord {
  return {
    id: row.id,
    employeeName: row.employee_name,
    role: row.role,
    enrolledDate: row.enrolled_date,
    coursesCompleted: row.courses_completed,
    coursesInProgress: row.courses_in_progress,
    totalHoursLogged: row.total_hours_logged,
    avgScore: row.avg_score,
    status: row.status as TraineeRecord['status'],
  }
}

function toInstructor(row: InstructorRow): InstructorRecord {
  return {
    id: row.id,
    instructorName: row.instructor_name,
    specialization: row.specialization,
    certifications: row.certifications,
    active: row.active,
    maxConcurrentSessions: row.max_concurrent_sessions,
    currentSessions: row.current_sessions,
    rating: row.rating,
  }
}

function toArchivedDocument(row: ArchivedDocumentRow): ArchivedDocument {
  return {
    id: row.id,
    documentName: row.document_name,
    documentType: row.document_type,
    employeeName: row.employee_name,
    fileUrl: row.file_url,
    archivedAt: row.archived_at,
    notes: row.notes,
  }
}

function toTrainingReport(row: TrainingReportRow): TrainingReport {
  return {
    id: row.id,
    name:
      row.report_data?.name ??
      (row.report_type ? `Training report (${row.report_type})` : 'Training report'),
    reportType: row.report_type,
    reportDate: row.report_date,
    generatedAt: row.generated_at,
    pdfUrl: row.pdf_url,
  }
}

/**
 * Runs a department-scoped list query, maps each snake_case row via
 * `mapRow`, and throws a typed DatabaseError on failure.
 */
async function listTrainingRows<T>(
  deptId: string,
  config: {
    table: string
    select: string
    errorLabel: string
    limit?: number
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped supabase query builder
    configure: (query: any) => any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- untyped supabase row data
    mapRow: (row: any) => T
  }
): Promise<T[]> {
  const { supabase } = await assertTrainingRole()

  let query = supabase.from(config.table).select(config.select).eq('department_id', deptId)
  query = config.configure(query)
  if (config.limit !== undefined) {
    query = query.limit(config.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new DatabaseError(config.errorLabel, {
      operation: 'select',
      context: { error: error.message },
    })
  }

  return (data ?? []).map(config.mapRow)
}

/** Case-insensitive `includes` across nullable fields; no-op when q is empty. */
function matchesSearch(q: string | undefined, ...fields: (string | null | undefined)[]): boolean {
  if (!q) return true
  return fields.some((field) => (field ?? '').toLowerCase().includes(q))
}

/** Enum-style filter: no filter, 'All', or exact equality. */
function matchesExactFilter(filter: string | undefined, value: string): boolean {
  return !filter || filter === 'All' || value === filter
}

/* ------------------------------------------------------------------ */
/*  Metrics helpers (pure reductions over raw query rows)              */
/* ------------------------------------------------------------------ */

function countCertStatuses(
  rows: { expiry_date: string }[],
  today: string
): { active: number; expiring: number; expired: number } {
  let active = 0
  let expiring = 0
  let expired = 0
  for (const cert of rows) {
    const status = certificationStatus(cert.expiry_date, today)
    if (status === 'expired') expired++
    else if (status === 'expiring') expiring++
    else active++
  }
  return { active, expiring, expired }
}

function courseCompliance(
  rows: {
    enrolled_count: number
    completion_rate: number
    duration_minutes: number
    created_at: string
  }[]
): { activeTrainees: number; lmsCompliance: number } {
  const activeTrainees = rows.reduce((sum, c) => sum + (c.enrolled_count || 0), 0)
  const lmsCompliance =
    rows.length > 0
      ? Math.round(
          (rows.reduce((sum, c) => sum + (c.completion_rate || 0), 0) / rows.length) * 10
        ) / 10
      : 0
  return { activeTrainees, lmsCompliance }
}

function scheduleStats(
  rows: {
    session_date: string
    status: string
    start_time: string | null
    end_time: string | null
  }[],
  today: string,
  monthStart: string
): { upcomingSessions: number; hoursLoggedMtd: number } {
  const upcomingSessions = rows.filter(
    (s) => s.session_date >= today && s.status !== 'Cancelled'
  ).length

  // Estimate hours logged MTD from scheduled session durations (>= month start)
  const hoursLoggedMtd = rows
    .filter((s) => s.session_date >= monthStart && s.session_date <= today)
    .reduce((sum, s) => {
      if (!s.start_time || !s.end_time) return sum
      const partsStart = s.start_time.split(':').map(Number)
      const sh = partsStart[0] ?? 0
      const sm = partsStart[1] ?? 0
      const partsEnd = s.end_time.split(':').map(Number)
      const eh = partsEnd[0] ?? 0
      const em = partsEnd[1] ?? 0
      const diff = (eh * 60 + em - (sh * 60 + sm)) / 60
      return sum + (diff > 0 ? diff : 0)
    }, 0)

  return { upcomingSessions, hoursLoggedMtd: Math.round(hoursLoggedMtd) }
}

/* ------------------------------------------------------------------ */
/*  1. KPI Metrics (cached)                                            */
/* ------------------------------------------------------------------ */

async function _getCachedTrainingMetrics(deptId: string): Promise<TrainingMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.TRAINING,
    DEPARTMENT_CACHE_TAGS.TABLE_CERTIFICATIONS,
    DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_COURSES,
    DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_SCHEDULES,
    `dept:training:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const monthStart = today.slice(0, 8) + '01'

  const [{ data: certifications }, { data: courses }, { data: schedules }] = await Promise.all([
    supabase.from('certifications').select('expiry_date').eq('department_id', deptId),
    supabase
      .from('training_courses')
      .select('enrolled_count, completion_rate, duration_minutes, created_at')
      .eq('department_id', deptId)
      .eq('active', true),
    supabase
      .from('training_schedules')
      .select('session_date, status, start_time, end_time')
      .eq('department_id', deptId),
  ])

  const certRows = (certifications ?? []) as { expiry_date: string }[]
  const courseRows = (courses ?? []) as {
    enrolled_count: number
    completion_rate: number
    duration_minutes: number
    created_at: string
  }[]
  const scheduleRows = (schedules ?? []) as {
    session_date: string
    status: string
    start_time: string | null
    end_time: string | null
  }[]

  const certCounts = countCertStatuses(certRows, today)
  const { activeTrainees, lmsCompliance } = courseCompliance(courseRows)
  const { upcomingSessions, hoursLoggedMtd } = scheduleStats(scheduleRows, today, monthStart)

  return {
    lmsCompliance,
    activeTrainees,
    upcomingSessions,
    totalCourses: courseRows.length,
    activeCertifications: certCounts.active,
    expiringCertifications: certCounts.expiring,
    expiredCertifications: certCounts.expired,
    hoursLoggedMtd,
  }
}

export async function getTrainingMetrics(deptId: string): Promise<TrainingMetrics> {
  await assertTrainingRole()
  return _getCachedTrainingMetrics(deptId)
}

/* ------------------------------------------------------------------ */
/*  2. Certifications (not cached — dynamic registry)                  */
/* ------------------------------------------------------------------ */

export async function getCertifications(
  deptId: string,
  filters?: { q?: string; status?: string }
): Promise<Certification[]> {
  const today = new Date().toISOString().slice(0, 10)
  const q = filters?.q?.trim().toLowerCase()
  const statusFilter = filters?.status

  const certifications = await listTrainingRows<Certification>(deptId, {
    table: 'certifications',
    select: CERTIFICATIONS_SELECT,
    errorLabel: 'Failed to load certifications',
    configure: (query) => query.order('expiry_date', { ascending: true }),
    limit: 200,
    mapRow: (row) => toCertification(row, today),
  })

  return certifications.filter(
    (cert) =>
      matchesSearch(q, cert.employeeName, cert.certification, cert.role) &&
      matchesExactFilter(statusFilter, cert.status)
  )
}

export async function getRecentCertifications(deptId: string, limit = 6): Promise<Certification[]> {
  const today = new Date().toISOString().slice(0, 10)

  return listTrainingRows<Certification>(deptId, {
    table: 'certifications',
    select: CERTIFICATIONS_SELECT,
    errorLabel: 'Failed to load recent certifications',
    configure: (query) => query.order('created_at', { ascending: false }),
    limit,
    mapRow: (row) => toCertification(row, today),
  })
}

/* ------------------------------------------------------------------ */
/*  3. Courses (LMS catalog)                                           */
/* ------------------------------------------------------------------ */

export async function getCourses(
  deptId: string,
  filters?: { q?: string; category?: string }
): Promise<TrainingCourse[]> {
  const q = filters?.q?.trim().toLowerCase()
  const categoryFilter = filters?.category

  const courses = await listTrainingRows<TrainingCourse>(deptId, {
    table: 'training_courses',
    select: COURSES_SELECT,
    errorLabel: 'Failed to load training courses',
    configure: (query) => query.eq('active', true).order('title', { ascending: true }),
    limit: 200,
    mapRow: toCourse,
  })

  return courses.filter(
    (course) =>
      matchesSearch(q, course.title, course.description) &&
      matchesExactFilter(categoryFilter, course.category)
  )
}

/* ------------------------------------------------------------------ */
/*  4. Schedules                                                       */
/* ------------------------------------------------------------------ */

export async function getSchedules(
  deptId: string,
  filters?: { q?: string; type?: string }
): Promise<TrainingSchedule[]> {
  const q = filters?.q?.trim().toLowerCase()
  const typeFilter = filters?.type

  const schedules = await listTrainingRows<TrainingSchedule>(deptId, {
    table: 'training_schedules',
    select: SCHEDULES_SELECT,
    errorLabel: 'Failed to load training schedules',
    configure: (query) => query.order('session_date', { ascending: true }),
    limit: 200,
    mapRow: toSchedule,
  })

  return schedules.filter(
    (s) =>
      matchesSearch(q, s.courseName, s.instructor, s.location) &&
      matchesExactFilter(typeFilter, s.sessionType)
  )
}

/** Upcoming sessions (today onwards, not cancelled) — used on the dashboard. */
export async function getUpcomingSessions(deptId: string, limit = 6): Promise<TrainingSchedule[]> {
  const today = new Date().toISOString().split('T')[0]

  return listTrainingRows<TrainingSchedule>(deptId, {
    table: 'training_schedules',
    select: SCHEDULES_SELECT,
    errorLabel: 'Failed to load upcoming training sessions',
    configure: (query) =>
      query.neq('status', 'Cancelled').gte('session_date', today).order('session_date', {
        ascending: true,
      }),
    limit,
    mapRow: toSchedule,
  })
}

/* ------------------------------------------------------------------ */
/*  5. Training Trainees                                                */
/* ------------------------------------------------------------------ */

export interface TraineeMetrics {
  totalTrainees: number
  activeTrainees: number
  coursesInProgress: number
  avgScore: number
  totalHours: number
  graduatedTrainees: number
}

export interface TraineeRecord {
  id: string
  employeeName: string
  role: string | null
  enrolledDate: string
  coursesCompleted: number
  coursesInProgress: number
  totalHoursLogged: number
  avgScore: number | null
  status: 'active' | 'inactive' | 'suspended' | 'graduated'
}

async function _getCachedTraineeMetrics(deptId: string): Promise<TraineeMetrics> {
  'use cache'
  cacheLife('5 minutes')
  cacheTag(
    DEPARTMENT_CACHE_TAGS.TRAINING,
    DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_TRAINEES,
    `dept:training:${deptId}`
  )

  const { createAdminClient } = await import('@repo/supabase/server')
  const supabase = createAdminClient()

  const [{ count: totalTrainees }, { count: activeTrainees }, { data: trainees }] =
    await Promise.all([
      supabase
        .from('training_trainees')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', deptId),
      supabase
        .from('training_trainees')
        .select('id', { count: 'exact', head: true })
        .eq('department_id', deptId)
        .eq('status', 'active'),
      supabase
        .from('training_trainees')
        .select('courses_in_progress, avg_score, total_hours_logged, status')
        .eq('department_id', deptId),
    ])

  const rows = (trainees ?? []) as {
    courses_in_progress: number
    avg_score: number | null
    total_hours_logged: number
    status: string
  }[]
  const coursesInProgress = rows.reduce((s, r) => s + (r.courses_in_progress || 0), 0)
  const scores = rows.map((r) => r.avg_score).filter((s): s is number => s !== null)
  const avgScore =
    scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
      : 0
  const totalHours = rows.reduce((s, r) => s + (r.total_hours_logged || 0), 0)
  const graduatedTrainees = rows.filter((r) => r.status === 'graduated').length

  return {
    totalTrainees: totalTrainees ?? 0,
    activeTrainees: activeTrainees ?? 0,
    coursesInProgress,
    avgScore,
    totalHours,
    graduatedTrainees,
  }
}

export async function getTraineeMetrics(deptId: string): Promise<TraineeMetrics> {
  await assertTrainingRole()
  return _getCachedTraineeMetrics(deptId)
}

export async function getTrainees(deptId: string): Promise<TraineeRecord[]> {
  return listTrainingRows<TraineeRecord>(deptId, {
    table: 'training_trainees',
    select: TRAINEES_SELECT,
    errorLabel: 'Failed to load trainees',
    configure: (query) => query.order('enrolled_date', { ascending: false }),
    limit: 200,
    mapRow: toTrainee,
  })
}

/* ------------------------------------------------------------------ */
/*  6. Training Instructors                                            */
/* ------------------------------------------------------------------ */

export interface InstructorRecord {
  id: string
  instructorName: string
  specialization: string | null
  certifications: string[] | null
  active: boolean
  maxConcurrentSessions: number
  currentSessions: number
  rating: number | null
}

export async function getInstructors(deptId: string): Promise<InstructorRecord[]> {
  return listTrainingRows<InstructorRecord>(deptId, {
    table: 'training_instructors',
    select: INSTRUCTORS_SELECT,
    errorLabel: 'Failed to load instructors',
    configure: (query) => query.order('instructor_name', { ascending: true }),
    mapRow: toInstructor,
  })
}

/* ------------------------------------------------------------------ */
/*  7. Archived Documents                                              */
/* ------------------------------------------------------------------ */

export interface ArchivedDocument {
  id: string
  documentName: string
  documentType: string
  employeeName: string | null
  fileUrl: string | null
  archivedAt: string
  notes: string | null
}

export async function getArchivedDocuments(
  deptId: string,
  limit = 100
): Promise<ArchivedDocument[]> {
  return listTrainingRows<ArchivedDocument>(deptId, {
    table: 'training_archived_documents',
    select: ARCHIVED_DOCS_SELECT,
    errorLabel: 'Failed to load archived documents',
    configure: (query) => query.order('archived_at', { ascending: false }),
    limit,
    mapRow: toArchivedDocument,
  })
}

/* ------------------------------------------------------------------ */
/*  8. Training reports (generated_reports history)                    */
/* ------------------------------------------------------------------ */

export interface TrainingReport {
  id: string
  name: string
  reportType: string | null
  reportDate: string
  generatedAt: string
  pdfUrl: string | null
}

export async function getTrainingReports(deptId: string, limit = 15): Promise<TrainingReport[]> {
  return listTrainingRows<TrainingReport>(deptId, {
    table: 'generated_reports',
    select: REPORTS_SELECT,
    errorLabel: 'Failed to load training reports',
    configure: (query) => query.order('report_date', { ascending: false }),
    limit,
    mapRow: toTrainingReport,
  })
}

/* ------------------------------------------------------------------ */
/*  7. Training Mutations                                              */
/* ------------------------------------------------------------------ */

export async function enrollEmployee(input: { scheduleId: string; employeeId: string }) {
  const { revalidateTag } = await import('next/cache')
  const { enrollEmployeeSchema } = await import('@repo/contract')
  const validated = enrollEmployeeSchema.parse(input)

  const { supabase } = await assertTrainingRole()

  const { error } = await supabase.from('training_session_enrollments').insert({
    schedule_id: validated.scheduleId,
    employee_id: validated.employeeId,
    status: 'enrolled',
  })

  if (error) {
    throw new DatabaseError('Failed to enroll employee in training session', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.TRAINING, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_SCHEDULES, 'max')

  return { success: true }
}

export async function createCourse(input: {
  departmentId: string
  title: string
  code: string
  description?: string
  validityMonths?: number
}) {
  const { revalidateTag } = await import('next/cache')
  const { createCourseSchema } = await import('@repo/contract')
  const validated = createCourseSchema.parse(input)

  const { supabase } = await assertTrainingRole()

  const { data, error } = await supabase
    .from('courses')
    .insert({
      department_id: validated.departmentId,
      name: validated.title,
      code: validated.code,
      description: validated.description || null,
      validity_months: validated.validityMonths || 24,
    })
    .select('id')
    .single()

  if (error) {
    throw new DatabaseError('Failed to create course', {
      operation: 'insert',
      context: { error: error.message },
    })
  }

  revalidateTag(DEPARTMENT_CACHE_TAGS.TRAINING, 'max')
  revalidateTag(DEPARTMENT_CACHE_TAGS.TABLE_TRAINING_COURSES, 'max')

  return { success: true, courseId: data?.id }
}
