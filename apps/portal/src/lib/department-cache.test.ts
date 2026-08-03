/**
 * Tests for department-cache.ts
 */

import {
  DEPARTMENT_CACHE_TAGS,
  generateDepartmentTag,
  getDepartmentDashboardTags,
} from './department-cache'

describe('department-cache', () => {
  describe('DEPARTMENT_CACHE_TAGS', () => {
    it('should have all department tags', () => {
      expect(DEPARTMENT_CACHE_TAGS.DRILLING).toBe('dept:drilling')
      expect(DEPARTMENT_CACHE_TAGS.PRODUCTION).toBe('dept:production')
      expect(DEPARTMENT_CACHE_TAGS.ENGINEERING).toBe('dept:engineering')
      expect(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL).toBe('dept:access-control')
      expect(DEPARTMENT_CACHE_TAGS.CONTROL_ROOM).toBe('dept:control-room')
      expect(DEPARTMENT_CACHE_TAGS.SAFETY).toBe('dept:safety')
      expect(DEPARTMENT_CACHE_TAGS.TRAINING).toBe('dept:training')
      expect(DEPARTMENT_CACHE_TAGS.SATELLITE_MONITORING).toBe('dept:satellite-monitoring')
    })

    it('should have table tags', () => {
      expect(DEPARTMENT_CACHE_TAGS.TABLE_BREAKDOWNS).toBe('table:breakdowns')
      expect(DEPARTMENT_CACHE_TAGS.TABLE_MACHINES).toBe('table:machines')
      expect(DEPARTMENT_CACHE_TAGS.TABLE_SAFETY_INCIDENTS).toBe('table:safety_incidents')
    })

    it('should have ACCESS_CONTROL_TAG', () => {
      expect(DEPARTMENT_CACHE_TAGS.ACCESS_CONTROL_TAG).toBe('access:control')
    })
  })

  describe('generateDepartmentTag', () => {
    it('should return department tag for known departments', () => {
      expect(generateDepartmentTag('engineering')).toBe('dept:engineering')
      expect(generateDepartmentTag('drilling')).toBe('dept:drilling')
    })

    it('should return generic tag for unknown departments', () => {
      expect(generateDepartmentTag('unknown')).toBe('dept:unknown')
    })

    it('should include date when provided', () => {
      expect(generateDepartmentTag('engineering', '2026-07-25')).toBe('dept:engineering:2026-07-25')
    })
  })

  describe('getDepartmentDashboardTags', () => {
    it('should return array of tags for a department', () => {
      const tags = getDepartmentDashboardTags('engineering', 'dept-uuid-123', '2026-07-25')

      expect(tags).toContain('dept:engineering')
      expect(tags).toContain('dept:engineering:dept-uuid-123')
      expect(tags).toContain('dept:engineering:2026-07-25')
      expect(tags).toContain('dept:metadata')
    })
  })
})
