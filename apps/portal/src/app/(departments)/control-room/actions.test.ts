/**
 * Tests for control-room server actions.
 */

jest.mock('@/lib/dept-access', () => ({
  assertDeptRole: jest.fn(),
}))

jest.mock('@/lib/errors/error-classes', () => ({
  AuthError: class AuthError extends Error {
    constructor(m: string) {
      super(m)
      this.name = 'AuthError'
    }
  },
  ForbiddenError: class ForbiddenError extends Error {
    constructor(
      m: string,
      public ctx?: Record<string, unknown>
    ) {
      super(m)
      this.name = 'ForbiddenError'
    }
  },
  DatabaseError: class DatabaseError extends Error {
    constructor(
      m: string,
      public ctx?: Record<string, unknown>
    ) {
      super(m)
      this.name = 'DatabaseError'
    }
  },
  ValidationError: class ValidationError extends Error {
    constructor(
      m: string,
      public ctx?: Record<string, unknown>
    ) {
      super(m)
      this.name = 'ValidationError'
    }
  },
}))

jest.mock('@/lib/department-cache', () => ({
  DEPARTMENT_CACHE_TAGS: {
    CONTROL_ROOM: 'dept:control-room',
    TABLE_MACHINES: 'table:machines',
  },
  CACHE_TTL: {},
}))

jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
  cacheTag: jest.fn(),
  cacheLife: jest.fn(),
}))

const { assertDeptRole } = jest.requireMock('@/lib/dept-access')
const { revalidateTag } = jest.requireMock('next/cache')

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const single = jest.fn()

  const afterSelect = {
    single,
  }

  const afterUpdateEq = {
    select: jest.fn().mockReturnValue(afterSelect),
  }

  const afterUpdate = {
    eq: jest.fn().mockReturnValue(afterUpdateEq),
  }

  const afterSelectEq = {
    single,
  }

  const chainable = {
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue(afterSelectEq),
    }),
    eq: jest.fn().mockReturnThis(),
    single,
    update: jest.fn().mockReturnValue(afterUpdate),
    ...overrides,
  }

  return {
    from: jest.fn().mockReturnValue(chainable),
    auth: { getUser: jest.fn() },
  }
}

const baseRow = {
  department_id: 'dept-1',
  total_loads: 10,
  hour_05: 2,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('adjustHourlyLoad', () => {
  it('increments the requested hour and total_loads', async () => {
    const supabase = createMockSupabase()
    supabase
      .from()
      .single.mockResolvedValueOnce({ data: baseRow, error: null })
      .mockResolvedValueOnce({ data: { total_loads: 11, hour_05: 3 }, error: null })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    const result = await adjustHourlyLoad({
      id: '11111111-1111-1111-1111-111111111111',
      hourColumn: 'hour_05',
      delta: 1,
    })

    expect(result).toEqual({ success: true, newValue: 3, totalLoads: 11 })
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('table:machines', 'max')
  })

  it('decrements the requested hour and total_loads', async () => {
    const supabase = createMockSupabase()
    supabase
      .from()
      .single.mockResolvedValueOnce({ data: baseRow, error: null })
      .mockResolvedValueOnce({ data: { total_loads: 9, hour_05: 1 }, error: null })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    const result = await adjustHourlyLoad({
      id: '11111111-1111-1111-1111-111111111111',
      hourColumn: 'hour_05',
      delta: -1,
    })

    expect(result).toEqual({ success: true, newValue: 1, totalLoads: 9 })
  })

  it('rejects decrementing below zero', async () => {
    const supabase = createMockSupabase()
    supabase.from().single.mockResolvedValueOnce({
      data: { ...baseRow, hour_05: 0 },
      error: null,
    })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    await expect(
      adjustHourlyLoad({
        id: '11111111-1111-1111-1111-111111111111',
        hourColumn: 'hour_05',
        delta: -1,
      })
    ).rejects.toThrow('Cannot decrement hourly load below zero')
  })

  it('throws ValidationError for invalid payload', async () => {
    assertDeptRole.mockResolvedValue({
      supabase: createMockSupabase(),
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    await expect(
      adjustHourlyLoad({
        id: 'not-a-uuid',
        hourColumn: 'hour_13',
        delta: 2,
      })
    ).rejects.toThrow('Invalid hourly load adjustment payload')
  })

  it('throws DatabaseError when record is not found', async () => {
    const supabase = createMockSupabase()
    supabase.from().single.mockResolvedValueOnce({ data: null, error: { message: 'not found' } })

    assertDeptRole.mockResolvedValue({
      supabase,
      user: { id: 'user-1' },
      employee: { role: 'admin', department_id: 'dept-1' },
    })

    const { adjustHourlyLoad } = await import('./actions')
    await expect(
      adjustHourlyLoad({
        id: '11111111-1111-1111-1111-111111111111',
        hourColumn: 'hour_05',
        delta: 1,
      })
    ).rejects.toThrow('Hourly load record not found')
  })
})

/* ------------------------------------------------------------------ */
/*  Helpers for the added action tests                                 */
/* ------------------------------------------------------------------ */

const UUID_A = '11111111-1111-1111-1111-111111111111'
const UUID_B = '22222222-2222-2222-2222-222222222222'

/**
 * Build a fluent Supabase table builder where every terminal call
 * (single / order / limit / update().eq / insert().select().single /
 * delete().eq) resolves the next queued { data, error } result in order.
 */
function fluentBuilder(results: Array<{ data?: unknown; error?: unknown }>) {
  let i = 0
  const next = () =>
    Promise.resolve(results[i++] ?? { data: null, error: { message: 'unexpected' } })
  const builder: Record<string, jest.Mock> = {
    order: jest.fn(next),
    limit: jest.fn(next),
    single: jest.fn(next),
  }
  builder.select = jest.fn().mockReturnValue(builder)
  ;(builder as unknown as Record<string, unknown>).update = jest.fn(() => ({
    eq: jest.fn(next),
  }))
  ;(builder as unknown as Record<string, unknown>).insert = jest.fn(() => ({
    select: jest.fn(() => ({ single: jest.fn(next) })),
  }))
  ;(builder as unknown as Record<string, unknown>).upsert = jest.fn(() => ({
    select: jest.fn(() => ({ single: jest.fn(next) })),
  }))
  ;(builder as unknown as Record<string, unknown>).delete = jest.fn(() => ({
    eq: jest.fn(next),
  }))
  // eq returns the builder for chained reads
  ;(builder as unknown as Record<string, unknown>).eq = jest.fn().mockReturnValue(builder)
  return builder
}

function roleSupabase(routes: Record<string, ReturnType<typeof fluentBuilder>>) {
  const supabase = {
    from: jest.fn((table: string) => routes[table]),
    auth: { getUser: jest.fn() },
  }
  assertDeptRole.mockResolvedValue({
    supabase,
    user: { id: 'user-1' },
    employee: { role: 'admin', department_id: 'dept-1' },
  })
  return supabase
}

/* ------------------------------------------------------------------ */
/*  bookMachineBreakdown                                               */
/* ------------------------------------------------------------------ */

describe('bookMachineBreakdown', () => {
  it('logs a machine breakdown and revalidates the control-room cache', async () => {
    const supabase = roleSupabase({
      departments: fluentBuilder([{ data: { id: 'dept-1' }, error: null }]),
      breakdowns: fluentBuilder([{ data: { id: 'brk-1' }, error: null }]),
    })

    const { bookMachineBreakdown } = await import('./actions')
    const result = await bookMachineBreakdown(UUID_A, 'Dump 1', 'Dumper', 'Overheating')

    expect(result).toEqual({ success: true, id: 'brk-1' })
    expect(supabase.from).toHaveBeenCalledWith('breakdowns')
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('table:machines', 'max')
  })

  it('rejects an invalid machine id', async () => {
    roleSupabase({})
    const { bookMachineBreakdown } = await import('./actions')
    await expect(
      bookMachineBreakdown('not-a-uuid', 'Dump 1', 'Dumper', 'Overheating')
    ).rejects.toThrow('Invalid request payload')
  })

  it('rejects an empty reason', async () => {
    roleSupabase({})
    const { bookMachineBreakdown } = await import('./actions')
    await expect(bookMachineBreakdown(UUID_A, 'Dump 1', 'Dumper', '   ')).rejects.toThrow(
      'Invalid request payload'
    )
  })

  it('throws DatabaseError when the control-room department is missing', async () => {
    roleSupabase({
      departments: fluentBuilder([{ data: null, error: null }]),
    })
    const { bookMachineBreakdown } = await import('./actions')
    await expect(bookMachineBreakdown(UUID_A, 'Dump 1', 'Dumper', 'Overheating')).rejects.toThrow(
      'Control Room department ID not found'
    )
  })
})

/* ------------------------------------------------------------------ */
/*  updateMachineSite                                                  */
/* ------------------------------------------------------------------ */

describe('updateMachineSite', () => {
  it('updates the machine site and revalidates', async () => {
    const supabase = roleSupabase({
      machines: fluentBuilder([{ data: null, error: null }]),
    })

    const { updateMachineSite } = await import('./actions')
    const result = await updateMachineSite(UUID_A, UUID_B)

    expect(result).toEqual({ success: true })
    expect(supabase.from).toHaveBeenCalledWith('machines')
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('table:machines', 'max')
  })

  it('accepts a null siteId (unassign)', async () => {
    const supabase = roleSupabase({
      machines: fluentBuilder([{ data: null, error: null }]),
    })
    const { updateMachineSite } = await import('./actions')
    await expect(updateMachineSite(UUID_A, null)).resolves.toEqual({ success: true })
    expect(supabase.from).toHaveBeenCalledWith('machines')
  })

  it('rejects an invalid machine id', async () => {
    roleSupabase({})
    const { updateMachineSite } = await import('./actions')
    await expect(updateMachineSite('bad-id', UUID_B)).rejects.toThrow('Invalid request payload')
  })
})

/* ------------------------------------------------------------------ */
/*  updateHourlyLoadMaterial                                           */
/* ------------------------------------------------------------------ */

describe('updateHourlyLoadMaterial', () => {
  it('updates the material type and matching assignment, then revalidates', async () => {
    const supabase = roleSupabase({
      hourly_loads: fluentBuilder([
        { data: null, error: null }, // update material_type
        { data: { machine_id: UUID_A, load_date: '2026-08-04', shift_type: 'day' }, error: null },
        { data: [{ id: UUID_A }], error: null }, // sibling loads
      ]),
      excavator_dumper_assignments: fluentBuilder([
        { data: [{ id: 'assign-1', created_at: '2026-08-04T00:00:00Z' }], error: null },
        { data: null, error: null }, // assignment update
      ]),
    })

    const { updateHourlyLoadMaterial } = await import('./actions')
    const result = await updateHourlyLoadMaterial(UUID_A, 'Coal', 'Coal (High Grade)')

    expect(result).toEqual({ success: true })
    expect(supabase.from).toHaveBeenCalledWith('excavator_dumper_assignments')
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
  })

  it('rejects an empty specific material', async () => {
    roleSupabase({})
    const { updateHourlyLoadMaterial } = await import('./actions')
    await expect(updateHourlyLoadMaterial(UUID_A, 'Coal', '   ')).rejects.toThrow(
      'Invalid request payload'
    )
  })

  it('rejects a primary material outside Coal|Waste', async () => {
    roleSupabase({})
    const { updateHourlyLoadMaterial } = await import('./actions')
    await expect(updateHourlyLoadMaterial(UUID_A, 'Soil' as 'Coal', 'Overburden')).rejects.toThrow(
      'Invalid request payload'
    )
  })
})

/* ------------------------------------------------------------------ */
/*  endHaulingSession                                                  */
/* ------------------------------------------------------------------ */

describe('endHaulingSession', () => {
  it('locks hours, creates a new load row and revalidates (no excavator reassign)', async () => {
    const currentLoad = {
      department_id: 'dept-1',
      load_date: '2026-08-04',
      shift_type: 'day',
      machine_id: UUID_A,
      hour_01: 2,
      hour_02: 3,
      hour_03: 4,
      hour_04: 1,
      hour_05: -1,
      hour_06: -1,
      hour_07: -1,
      hour_08: -1,
      hour_09: -1,
      hour_10: -1,
      hour_11: -1,
      hour_12: -1,
    }

    const supabase = roleSupabase({
      hourly_loads: fluentBuilder([
        { data: currentLoad, error: null }, // read current
        { data: null, error: null }, // update (lock)
        { data: { id: UUID_B }, error: null }, // insert new row
      ]),
    })

    const { endHaulingSession } = await import('./actions')
    const result = await endHaulingSession(UUID_A, 3, 'Overburden', '')

    expect(result).toEqual({ success: true })
    expect(supabase.from).toHaveBeenCalledWith('hourly_loads')
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('table:machines', 'max')
  })

  it('rejects a stop hour out of range', async () => {
    roleSupabase({})
    const { endHaulingSession } = await import('./actions')
    await expect(endHaulingSession(UUID_A, 13, 'Overburden', '')).rejects.toThrow(
      'Invalid request payload'
    )
  })

  it('rejects an invalid loadRowId', async () => {
    roleSupabase({})
    const { endHaulingSession } = await import('./actions')
    await expect(endHaulingSession('bad-id', 3, 'Overburden', '')).rejects.toThrow(
      'Invalid request payload'
    )
  })
})

/* ------------------------------------------------------------------ */
/*  calculateSmrMetrics                                                */
/* ------------------------------------------------------------------ */

describe('calculateSmrMetrics', () => {
  it('returns nulls when SMR values are missing', () => {
    const { calculateSmrMetrics } = require('./actions')
    expect(
      calculateSmrMetrics({ startSMR: null, closeSMR: 100, engineeringDelayMinutes: 0 })
    ).toEqual({
      smrTotal: null,
      utilizationPct: null,
      availabilityPct: null,
    })
  })

  it('calculates total, utilization and availability', () => {
    const { calculateSmrMetrics } = require('./actions')
    // 12-hour shift baseline: smrTotal = 12 => 100% utilization
    expect(
      calculateSmrMetrics({ startSMR: 100, closeSMR: 112, engineeringDelayMinutes: 60 })
    ).toEqual({
      smrTotal: 12,
      utilizationPct: 100,
      availabilityPct: ((12 - 1) / 12) * 100,
    })
  })

  it('returns zero utilization and availability for non-positive totals', () => {
    const { calculateSmrMetrics } = require('./actions')
    expect(
      calculateSmrMetrics({ startSMR: 100, closeSMR: 100, engineeringDelayMinutes: 0 })
    ).toEqual({
      smrTotal: 0,
      utilizationPct: 0,
      availabilityPct: 0,
    })
  })
})

/* ------------------------------------------------------------------ */
/*  upsertMachineOperation                                              */
/* ------------------------------------------------------------------ */

describe('upsertMachineOperation', () => {
  it('creates a new machine operation and revalidates', async () => {
    const supabase = roleSupabase({
      machines: fluentBuilder([{ data: { department_id: 'dept-1' }, error: null }]),
      machine_operations: fluentBuilder([{ data: { id: 'op-1' }, error: null }]),
    })

    const { upsertMachineOperation } = await import('./actions')
    const result = await upsertMachineOperation({
      machineId: UUID_A,
      shiftDate: '2026-08-04',
      shiftType: 'day',
      siteId: UUID_B,
      operatorId: UUID_B,
      startSMR: 100,
      closeSMR: null,
      naturalDelayMinutes: 10,
      nonProductionDelayMinutes: 5,
      productionDelayMinutes: 15,
      engineeringDelayMinutes: 30,
    })

    expect(result).toEqual({ success: true, id: 'op-1' })
    expect(supabase.from).toHaveBeenCalledWith('machine_operations')
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
    expect(revalidateTag).toHaveBeenCalledWith('table:machines', 'max')
  })

  it('closes a row and updates the machine current_smr cache', async () => {
    const supabase = roleSupabase({
      machines: fluentBuilder([
        { data: { department_id: 'dept-1' }, error: null },
        { data: null, error: null },
      ]),
      machine_operations: fluentBuilder([{ data: { id: 'op-1' }, error: null }]),
    })

    const { upsertMachineOperation } = await import('./actions')
    const result = await upsertMachineOperation({
      machineId: UUID_A,
      shiftDate: '2026-08-04',
      shiftType: 'day',
      startSMR: 100,
      closeSMR: 112,
    })

    expect(result).toEqual({ success: true, id: 'op-1' })
    expect(supabase.from).toHaveBeenCalledWith('machines')
  })

  it('rejects a close SMR less than start SMR', async () => {
    roleSupabase({
      machines: fluentBuilder([{ data: { department_id: 'dept-1' }, error: null }]),
    })

    const { upsertMachineOperation } = await import('./actions')
    await expect(
      upsertMachineOperation({
        machineId: UUID_A,
        shiftDate: '2026-08-04',
        shiftType: 'day',
        startSMR: 100,
        closeSMR: 99,
      })
    ).rejects.toThrow('Close SMR cannot be less than start SMR')
  })

  it('rejects an invalid shift date', async () => {
    roleSupabase({})
    const { upsertMachineOperation } = await import('./actions')
    await expect(
      upsertMachineOperation({
        machineId: UUID_A,
        shiftDate: '08-04-2026',
        shiftType: 'day',
      })
    ).rejects.toThrow('Invalid request payload')
  })
})

/* ------------------------------------------------------------------ */
/*  closeMachineOperation                                               */
/* ------------------------------------------------------------------ */

describe('closeMachineOperation', () => {
  it('records close SMR, end time and updates machine cache', async () => {
    const supabase = roleSupabase({
      machine_operations: fluentBuilder([
        { data: { machine_id: UUID_A, start_smr: 100 }, error: null },
        { data: null, error: null },
      ]),
      machines: fluentBuilder([{ data: null, error: null }]),
    })

    const { closeMachineOperation } = await import('./actions')
    const result = await closeMachineOperation(UUID_B, 112)

    expect(result).toEqual({ success: true })
    expect(supabase.from).toHaveBeenCalledWith('machine_operations')
    expect(supabase.from).toHaveBeenCalledWith('machines')
  })

  it('rejects a close SMR below start SMR', async () => {
    roleSupabase({
      machine_operations: fluentBuilder([
        { data: { machine_id: UUID_A, start_smr: 100 }, error: null },
      ]),
    })

    const { closeMachineOperation } = await import('./actions')
    await expect(closeMachineOperation(UUID_B, 95)).rejects.toThrow(
      'Close SMR cannot be less than start SMR'
    )
  })
})

/* ------------------------------------------------------------------ */
/*  reassignDumperExcavator                                            */
/* ------------------------------------------------------------------ */

describe('reassignDumperExcavator', () => {
  it('reassigns the existing assignment to a new excavator and revalidates', async () => {
    const loadRow = {
      machine_id: UUID_A,
      load_date: '2026-08-04',
      shift_type: 'day',
      material_type: 'Coal',
      department_id: 'dept-1',
    }

    const supabase = roleSupabase({
      hourly_loads: fluentBuilder([
        { data: loadRow, error: null }, // fetch load row
        { data: [{ id: UUID_A }], error: null }, // sibling loads
      ]),
      excavator_dumper_assignments: fluentBuilder([
        { data: [{ id: 'assign-1', created_at: '2026-08-04T00:00:00Z' }], error: null },
        { data: null, error: null }, // update assignment
      ]),
      excavator_activity: fluentBuilder([{ data: [{ id: 'act-1' }], error: null }]),
    })

    const { reassignDumperExcavator } = await import('./actions')
    const result = await reassignDumperExcavator(UUID_A, UUID_B)

    expect(result).toEqual({ success: true })
    expect(supabase.from).toHaveBeenCalledWith('excavator_activity')
    expect(revalidateTag).toHaveBeenCalledWith('dept:control-room', 'max')
  })

  it('rejects an invalid loadRowId', async () => {
    roleSupabase({})
    const { reassignDumperExcavator } = await import('./actions')
    await expect(reassignDumperExcavator('bad-id', UUID_B)).rejects.toThrow(
      'Invalid request payload'
    )
  })
})
