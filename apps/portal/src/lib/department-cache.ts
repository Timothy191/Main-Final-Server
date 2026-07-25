/**
 * Department Page Caching Utilities
 * 
 * Optimizes page switching by caching department dashboard data
 * with proper TTL and tag-based invalidation.
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

import { cacheLife, cacheTag } from 'next/cache'

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  // Short-lived data that changes frequently
  REALTIME: 30,        // 30 seconds
  SHORT: 60,          // 1 minute
  
  // Default for dashboard data
  DEFAULT: 300,       // 5 minutes
  
  // Medium-lived data
  MEDIUM: 600,        // 10 minutes
  
  // Long-lived data that rarely changes
  LONG: 3600,         // 1 hour
  
  // Department metadata (display names, descriptions)
  METADATA: 86400,    // 24 hours
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
} as const

/**
 * Generate a cache tag for a specific department and date
 */
export function generateDepartmentTag(department: string, date?: string): string {
  const baseTag = DEPARTMENT_CACHE_TAGS[department as keyof typeof DEPARTMENT_CACHE_TAGS] 
    || `dept:${department}`
  
  if (date) {
    return `${baseTag}:${date}`
  }
  return baseTag
}

/**
 * Generate cache tags for a department dashboard
 */
export function getDepartmentDashboardTags(department: string, deptId: string, today: string): string[] {
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
  deptId: string,
  today: string
): Promise<void> {
  // This is a placeholder for prefetch implementation
  // In practice, you'd use Next.js router.prefetch() or a custom prefetch endpoint
  console.log(`[cache] Prefetching data for department: ${department}`)
}
