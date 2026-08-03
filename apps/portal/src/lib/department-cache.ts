/**
 * Department Page Caching Utilities
 *
 * Optimizes page switching by caching department dashboard data
 * with proper TTL and tag-based invalidation.
 *
 * AGENT-TRACE: This module caches DATA fetches only — never the auth check.
 * The edge-proxy auth record lives in Redis at `arch:auth:employee:<userId>`
 * (see proxy.ts `resolveEmployee`) and is evicted via
 * `POST /api/cache/invalidate { userId }` on role change. Cache data here
 * keyed by dept/date; do not key auth decisions through these tags.
 *
 * Usage:
 *   import { cachedDepartmentData, DEPARTMENT_CACHE_TAGS } from '@/lib/department-cache'
 *
 *   async function getEngineeringData(deptId: string) {
 *     'use cache'
 *     cacheLife('5 minutes')
 *     cacheTag(DEPARTMENT_CACHE_TAGS.ENGINEERING, `dept:${deptId}`)
 *     // ... fetch data
 *   }
 */

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  // Short-lived data that changes frequently
  REALTIME: 30, // 30 seconds
  SHORT: 60, // 1 minute

  // Default for dashboard data
  DEFAULT: 300, // 5 minutes

  // Medium-lived data
  MEDIUM: 600, // 10 minutes

  // Long-lived data that rarely changes
  LONG: 3600, // 1 hour

  // Department metadata (display names, descriptions)
  METADATA: 86400, // 24 hours
} as const

// Department-specific cache tags for targeted invalidation
export const DEPARTMENT_CACHE_TAGS = {
  // Department metadata
  DEPARTMENT_METADATA: 'dept:metadata',

  // Hub/dashboard counts
  HUB_COUNTS: 'hub:counts',
  HUB_ALERTS: 'hub:alerts',
  HUB_PRODUCTION_TREND: 'hub:production-trend',

  // Department-specific data
  DRILLING: 'dept:drilling',
  PRODUCTION: 'dept:production',
  ENGINEERING: 'dept:engineering',
  ACCESS_CONTROL: 'dept:access-control',
  CONTROL_ROOM: 'dept:control-room',
  SAFETY: 'dept:safety',
  TRAINING: 'dept:training',
  SATELLITE_MONITORING: 'dept:satellite-monitoring',
  ENVIRONMENT: 'dept:environment',
  LOGISTICS_FLEET: 'dept:logistics-fleet',
  GEOLOGY: 'dept:geology',

  // Table-level tags for database changes
  TABLE_BREAKDOWNS: 'table:breakdowns',
  TABLE_MACHINES: 'table:machines',
  TABLE_SAFETY_INCIDENTS: 'table:safety_incidents',
  TABLE_DAILY_LOGS: 'table:daily_logs',
  TABLE_DRILL_OPERATIONS: 'table:drill_operations',
  TABLE_OPERATIONAL_DELAYS: 'table:operational_delays',
  TABLE_EMPLOYEES: 'table:employees',

  // Access control
  ACCESS_CONTROL_TAG: 'access:control',

  // New department tables
  TABLE_ENVIRONMENTAL_READINGS: 'table:environmental_readings',
  TABLE_SURVEY_MEASUREMENTS: 'table:survey_measurements',
  TABLE_TIRES: 'table:tires',
  TABLE_FLEET: 'table:fleet',
  TABLE_FUEL_LOGS: 'table:fuel_logs',
  TABLE_CERTIFICATIONS: 'table:certifications',
  TABLE_TRAINING_COURSES: 'table:training_courses',
  TABLE_TRAINING_SCHEDULES: 'table:training_schedules',
  TABLE_TRAINING_TRAINEES: 'table:training_trainees',
  TABLE_TRAINING_INSTRUCTORS: 'table:training_instructors',
  TABLE_TRAINING_DOCUMENTS: 'table:training_archived_documents',
  TABLE_DRILL_PATTERNS: 'table:drill_patterns',
  TABLE_BLAST_DESIGNS: 'table:blast_designs',
  TABLE_GRADE_CONTROL: 'table:grade_control_samples',
  TABLE_SAFETY_OBSERVATIONS: 'table:safety_observations',
  TABLE_JSA: 'table:job_safety_analyses',
  TABLE_ENV_INCIDENTS: 'table:environmental_incidents',
  TABLE_FLEET_MAINT: 'table:fleet_maintenance_schedule',
  TABLE_SURVEY_PLANS: 'table:survey_plans',
  TABLE_ADMIN_AUDIT: 'table:admin_audit_trail',
  TABLE_CARD_PRINTS: 'table:card_print_history',
  TABLE_SATELLITE_ALERTS: 'table:satellite_alerts',
} as const

/**
 * Generate a cache tag for a specific department and date
 */
export function generateDepartmentTag(department: string, date?: string): string {
  const baseTag =
    DEPARTMENT_CACHE_TAGS[department as keyof typeof DEPARTMENT_CACHE_TAGS] || `dept:${department}`

  if (date) {
    return `${baseTag}:${date}`
  }
  return baseTag
}

/**
 * Generate cache tags for a department dashboard
 */
export function getDepartmentDashboardTags(
  department: string,
  deptId: string,
  today: string
): string[] {
  const deptTag = generateDepartmentTag(department)

  return [
    deptTag,
    `${deptTag}:${deptId}`,
    `${deptTag}:${today}`,
    DEPARTMENT_CACHE_TAGS.DEPARTMENT_METADATA,
  ]
}

/**
 * Helper to get standard cache lifetime string for department data.
 * @param ttlSeconds - TTL in seconds (defaults to 300 = 5 minutes)
 * @returns Cache lifetime string for use with cacheLife()
 */
export function getCacheLife(ttlSeconds: number = 300): string {
  if (ttlSeconds < 60) {
    return `${ttlSeconds} seconds`
  }
  const minutes = Math.floor(ttlSeconds / 60)
  if (minutes < 60) {
    return `${minutes} minutes`
  }
  const hours = Math.floor(minutes / 60)
  return `${hours} hours`
}

/**
 * Pre-warm the cache for a department dashboard
 * Useful for prefetching when hovering over department links
 */
export async function prefetchDepartmentData(
  department: string,
  _deptId: string,
  _today: string
): Promise<void> {
  // This is a placeholder for prefetch implementation
  // In practice, you'd use Next.js router.prefetch() or a custom prefetch endpoint
  console.log(`[cache] Prefetching data for department: ${department}`)
}
