import {
  DEPARTMENTS,
  DEPARTMENT_TABS,
  CONTROL_ROOM_TABS,
  ENGINEERING_TABS,
  SATELLITE_MONITORING_TABS,
  DRILLING_TABS,
  ACCESS_CONTROL_TABS,
  ACCESS_CARD_ACTIONS_TABS,
  TRAINING_TABS,
  ADMIN_TABS,
  SAFETY_TABS,
  PRODUCTIVITY_TOOLS,
  getDepartmentTabs,
} from './departments'

describe('DEPARTMENTS', () => {
  it('contains exactly 10 departments', () => {
    expect(DEPARTMENTS).toHaveLength(10)
  })

  it('every department has required fields', () => {
    for (const dept of DEPARTMENTS) {
      expect(dept.name).toBeTruthy()
      expect(dept.displayName).toBeTruthy()
      expect(dept.icon).toBeTruthy()
      expect(dept.description).toBeTruthy()
      expect(dept.color).toBeTruthy()
    }
  })

  it('all department slugs are lowercase-hyphenated', () => {
    for (const dept of DEPARTMENTS) {
      expect(dept.name).toMatch(/^[a-z][a-z0-9-]*$/)
    }
  })

  it('includes control-room and satellite-monitoring', () => {
    const names = DEPARTMENTS.map((d) => d.name)
    expect(names).toContain('control-room')
    expect(names).toContain('satellite-monitoring')
  })

  it('includes access-card-actions', () => {
    const names = DEPARTMENTS.map((d) => d.name)
    expect(names).toContain('access-card-actions')
  })

  it('all status values are valid when present', () => {
    const validStatuses = ['active', 'maintenance', 'alert', undefined]
    for (const dept of DEPARTMENTS) {
      expect(validStatuses).toContain(dept.status)
    }
  })
})

describe('PRODUCTIVITY_TOOLS', () => {
  it('contains 5 productivity tools', () => {
    expect(PRODUCTIVITY_TOOLS).toHaveLength(5)
  })

  it('every tool has name, displayName, icon, description, color', () => {
    for (const tool of PRODUCTIVITY_TOOLS) {
      expect(tool.name).toBeTruthy()
      expect(tool.displayName).toBeTruthy()
      expect(tool.icon).toBeTruthy()
      expect(tool.description).toBeTruthy()
      expect(tool.color).toBeTruthy()
    }
  })
})

describe('getDepartmentTabs', () => {
  it('returns CONTROL_ROOM_TABS for control-room', () => {
    expect(getDepartmentTabs('control-room')).toBe(CONTROL_ROOM_TABS)
  })

  it('returns SATELLITE_MONITORING_TABS for satellite-monitoring', () => {
    expect(getDepartmentTabs('satellite-monitoring')).toBe(SATELLITE_MONITORING_TABS)
  })

  it('returns ENGINEERING_TABS for engineering', () => {
    expect(getDepartmentTabs('engineering')).toBe(ENGINEERING_TABS)
  })

  it('returns ACCESS_CONTROL_TABS for access-control', () => {
    expect(getDepartmentTabs('access-control')).toBe(ACCESS_CONTROL_TABS)
  })

  it('returns TRAINING_TABS for training', () => {
    expect(getDepartmentTabs('training')).toBe(TRAINING_TABS)
  })

  it('returns standard DEPARTMENT_TABS for all other departments', () => {
    const standardDepts = ['production']
    for (const slug of standardDepts) {
      expect(getDepartmentTabs(slug)).toBe(DEPARTMENT_TABS)
    }
  })

  it('returns SAFETY_TABS for safety', () => {
    expect(getDepartmentTabs('safety')).toBe(SAFETY_TABS)
  })

  it('returns ADMIN_TABS for admin', () => {
    expect(getDepartmentTabs('admin')).toBe(ADMIN_TABS)
  })

  it('returns DRILLING_TABS for drilling', () => {
    expect(getDepartmentTabs('drilling')).toBe(DRILLING_TABS)
  })

  it('returns ACCESS_CARD_ACTIONS_TABS for access-card-actions', () => {
    expect(getDepartmentTabs('access-card-actions')).toBe(ACCESS_CARD_ACTIONS_TABS)
  })

  it('returns standard DEPARTMENT_TABS for unknown slugs', () => {
    expect(getDepartmentTabs('nonexistent')).toBe(DEPARTMENT_TABS)
  })
})

describe('Tab shapes', () => {
  it('DEPARTMENT_TABS all have name, label, icon', () => {
    for (const tab of DEPARTMENT_TABS) {
      expect(tab.name).toBeTruthy()
      expect(tab.label).toBeTruthy()
      expect(tab.icon).toBeTruthy()
    }
  })

  it('TRAINING_TABS all have name, label, icon', () => {
    for (const tab of TRAINING_TABS) {
      expect(tab.name).toBeTruthy()
      expect(tab.label).toBeTruthy()
      expect(tab.icon).toBeTruthy()
    }
  })

  it('CONTROL_ROOM_TABS includes hourly-loads and excavator-activity', () => {
    const names = CONTROL_ROOM_TABS.map((t) => t.name)
    expect(names).toContain('hourly-loads')
    expect(names).toContain('excavator-activity')
  })

  it('ENGINEERING_TABS includes breakdowns tab', () => {
    const names = ENGINEERING_TABS.map((t) => t.name)
    expect(names).toContain('breakdowns')
  })

  it('SATELLITE_MONITORING_TABS includes sar and hyperspectral', () => {
    const names = SATELLITE_MONITORING_TABS.map((t) => t.name)
    expect(names).toContain('sar')
    expect(names).toContain('hyperspectral')
  })
})
