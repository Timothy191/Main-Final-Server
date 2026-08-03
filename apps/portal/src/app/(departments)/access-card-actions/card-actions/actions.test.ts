/**
 * @jest-environment node
 */
import { searchPersonnel, getPersonnelDetail, printCardForPersonnel } from './actions'
import { AuthError, DatabaseError } from '@/lib/errors/error-classes'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock('@repo/supabase/server', () => ({
  createServerSupabaseClient: jest.fn(),
}))

jest.mock('../lib/printer-detection', () => ({
  submitCupsPrintJob: jest.fn(),
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

const { createServerSupabaseClient } = jest.requireMock('@repo/supabase/server')
const mockSubmitCupsPrintJob = jest.requireMock('../lib/printer-detection')
  .submitCupsPrintJob as jest.Mock

// ---------------------------------------------------------------------------
// Mock builder
// ---------------------------------------------------------------------------

/**
 * Build a mocked Supabase client.
 *
 * The `from()` mock dispatches by table name. Callers can configure what
 * each table's query chain returns via the `tables` map.
 *
 * Each chain operation (select/eq/or/single/maybeSingle/limit/insert/update)
 * returns `this` unless the terminal call is one of:
 *   - single / maybeSingle → mockResolvedValue({ data, error })
 *   - limit                → mockResolvedValue({ data, error })
 *   - insert               → returns { select, single } chain
 *   - update.eq            → mockResolvedValue({ error })
 */
function buildMockClient(
  config: {
    user?: unknown
    tables?: Record<
      string,
      { data: unknown; error?: null } | { data?: unknown; error: { message: string; code: string } }
    >
    storageSignedUrl?: string | null
  } = {}
) {
  const user = config.user !== undefined ? config.user : { id: 'user-1' }
  const tables = config.tables ?? {}

  function terminal(data: unknown, error?: unknown) {
    return jest.fn().mockResolvedValue({
      data: (error ? null : data) as unknown,
      error: error ?? null,
    })
  }

  function terminalList(data: unknown[], error?: unknown) {
    return jest.fn().mockResolvedValue({
      data: error ? null : data,
      error: error ?? null,
    })
  }

  function chainable(
    opts: {
      terminal?: 'single' | 'maybeSingle' | 'limit'
      data?: unknown
      error?: unknown
    } = {}
  ) {
    const d = opts.data ?? null
    const e = opts.error ?? null
    const isArray = Array.isArray(d)

    const base = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      is: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      single: jest.fn(),
      maybeSingle: jest.fn(),
      limit: jest.fn(),
    }

    base.single = terminal(d, e)
    base.maybeSingle = terminal(d, e)
    base.limit = isArray ? terminalList(d as unknown[], e) : terminal(d, e)

    return base
  }

  function buildChain(table: string) {
    if (table === 'employees' && !Object.hasOwn(tables, 'employees')) {
      const c = chainable({ data: { role: 'access_control' } })
      c.limit = jest.fn().mockResolvedValue({ data: [{ role: 'access_control' }], error: null })
      return c
    }

    const cfg = tables[table]
    const data = cfg && 'data' in cfg ? cfg.data : null
    const error = cfg && 'error' in cfg ? cfg.error : null

    // issued_cards and card_printers use .order().limit(1).maybeSingle() — limit is NOT terminal
    if (table === 'issued_cards' || table === 'card_printers') {
      const c = chainable({ data, error })
      c.limit = jest.fn().mockReturnThis()
      return c
    }

    // All other tables: limit() is terminal
    return chainable({ data, error })
  }

  // from() uses the config's tables map
  const fromMock = jest.fn().mockImplementation((table: string) => {
    const chain = buildChain(table)
    // Special handling for print_jobs: insert → { select, single }
    if (table === 'print_jobs') {
      const cfg = tables[table]
      const data = cfg && 'data' in cfg ? cfg.data : null
      const error = cfg && 'error' in cfg ? cfg.error : null

      chain.insert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnThis(),
        single: terminal(data, error),
      })
      chain.update = jest.fn().mockReturnThis()
      // .update(...).eq(...) is the pattern used
      chain.eq = jest.fn().mockResolvedValue({ error: null })
    }
    return chain
  })

  const storageMock = {
    from: jest.fn().mockReturnValue({
      createSignedUrl: jest.fn().mockResolvedValue({
        data: config.storageSignedUrl ? { signedUrl: config.storageSignedUrl } : null,
        error: null,
      }),
    }),
  }

  const client = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: fromMock,
    storage: storageMock,
  }

  createServerSupabaseClient.mockResolvedValue(client)
  return client
}

// ---------------------------------------------------------------------------
// searchPersonnel
// ---------------------------------------------------------------------------

describe('searchPersonnel()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws AuthError when user is not authenticated', async () => {
    buildMockClient({ user: null })
    await expect(searchPersonnel('test')).rejects.toThrow(AuthError)
  })

  it('throws DatabaseError when query fails', async () => {
    buildMockClient({
      tables: {
        personnel: {
          data: [],
          error: { message: 'DB query failed', code: 'PGRST' },
        },
      },
    })
    await expect(searchPersonnel('test')).rejects.toThrow(DatabaseError)
  })

  it('returns personnel list for matching query', async () => {
    const data = [
      {
        id: 'pers-1',
        first_name: 'John',
        surname: 'Doe',
        id_number: 'ID-001',
        job_title: 'Operator',
        area: 'A-Section',
        status: 'active',
        department_id: 'dept-1',
        badges: [{ id: 'badge-1' }],
      },
    ]

    buildMockClient({
      tables: { personnel: { data } },
    })

    const results = await searchPersonnel('John')
    expect(results).toEqual([
      {
        id: 'pers-1',
        first_name: 'John',
        surname: 'Doe',
        id_number: 'ID-001',
        job_title: 'Operator',
        area: 'A-Section',
        status: 'active',
        department_id: 'dept-1',
        has_badge: true,
      },
    ])
  })

  it('returns empty array when no matches', async () => {
    buildMockClient({
      tables: { personnel: { data: [] } },
    })

    const results = await searchPersonnel('zzzzz')
    expect(results).toEqual([])
  })

  it('sets has_badge to false when badges array is empty', async () => {
    const data = [
      {
        id: 'pers-1',
        first_name: 'John',
        surname: 'Doe',
        id_number: 'ID-001',
        job_title: 'Operator',
        area: 'A-Section',
        status: 'active',
        department_id: 'dept-1',
        badges: [],
      },
    ]

    buildMockClient({
      tables: { personnel: { data } },
    })

    const results = await searchPersonnel('John')
    expect(results[0]!.has_badge).toBe(false)
  })

  it('sets has_badge to true when badges has elements', async () => {
    const data = [
      {
        id: 'pers-1',
        first_name: 'John',
        surname: 'Doe',
        id_number: 'ID-001',
        job_title: 'Operator',
        area: 'A-Section',
        status: 'active',
        department_id: 'dept-1',
        badges: [{ id: 'badge-1' }],
      },
    ]

    buildMockClient({
      tables: { personnel: { data } },
    })

    const results = await searchPersonnel('John')
    expect(results[0]!.has_badge).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getPersonnelDetail
// ---------------------------------------------------------------------------

describe('getPersonnelDetail()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws AuthError when user is not authenticated', async () => {
    buildMockClient({ user: null })
    await expect(getPersonnelDetail('pers-1')).rejects.toThrow(AuthError)
  })

  it('returns null when personnel not found (PGRST116)', async () => {
    buildMockClient({
      tables: {
        personnel: {
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        },
      },
    })
    const result = await getPersonnelDetail('pers-missing')
    expect(result).toBeNull()
  })

  it('throws DatabaseError on non-PGRST116 error', async () => {
    buildMockClient({
      tables: {
        personnel: {
          data: null,
          error: { message: 'DB error', code: 'PGRST500' },
        },
      },
    })
    await expect(getPersonnelDetail('pers-1')).rejects.toThrow(DatabaseError)
  })

  it('returns full detail with badge, issued card, and photo', async () => {
    const personnelData = {
      id: 'pers-1',
      first_name: 'John',
      surname: 'Doe',
      id_number: 'ID-001',
      job_title: 'Operator',
      area: 'A-Section',
      status: 'active',
      department_id: 'dept-1',
      photo_url: 'photos/john.jpg',
      medical_expiry: '2026-12-31',
      induction_expiry: '2026-06-30',
    }

    const badgeData = {
      id: 'badge-1',
      qr_code: 'qr-data-abc',
      is_active: true,
    }

    const issuedCardData = {
      id: 'card-1',
      status: 'active',
      expires_at: '2027-01-01',
    }

    buildMockClient({
      tables: {
        personnel: { data: personnelData },
        badges: { data: badgeData },
        issued_cards: { data: issuedCardData },
      },
      storageSignedUrl: 'https://supabase.co/storage/signed/photo.jpg',
    })

    const detail = await getPersonnelDetail('pers-1')
    expect(detail).not.toBeNull()
    expect(detail!.first_name).toBe('John')
    expect(detail!.badge).toEqual(badgeData)
    expect(detail!.issued_card).toEqual(issuedCardData)
    expect(detail!.photo_signed_url).toBe('https://supabase.co/storage/signed/photo.jpg')
  })

  it('uses photo_url directly when it starts with http', async () => {
    const personnelData = {
      id: 'pers-1',
      first_name: 'John',
      surname: 'Doe',
      id_number: 'ID-001',
      job_title: 'Operator',
      area: 'A-Section',
      status: 'active',
      department_id: 'dept-1',
      photo_url: 'https://external-cdn.com/photo.jpg',
      medical_expiry: null,
      induction_expiry: null,
    }

    const client = buildMockClient({
      tables: { personnel: { data: personnelData } },
    })
    client.storage.from = jest.fn()

    const detail = await getPersonnelDetail('pers-1')
    expect(detail!.photo_signed_url).toBe('https://external-cdn.com/photo.jpg')
    expect(client.storage.from).not.toHaveBeenCalled()
  })

  it('returns null photo_signed_url when photo_url is null', async () => {
    const personnelData = {
      id: 'pers-1',
      first_name: 'John',
      surname: 'Doe',
      id_number: 'ID-001',
      job_title: 'Operator',
      area: 'A-Section',
      status: 'active',
      department_id: 'dept-1',
      photo_url: null,
      medical_expiry: null,
      induction_expiry: null,
    }

    buildMockClient({
      tables: { personnel: { data: personnelData } },
    })

    const detail = await getPersonnelDetail('pers-1')
    expect(detail!.photo_signed_url).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// printCardForPersonnel
// ---------------------------------------------------------------------------

describe('printCardForPersonnel()', () => {
  beforeEach(() => jest.clearAllMocks())

  it('throws AuthError when user is not authenticated', async () => {
    buildMockClient({ user: null })
    await expect(printCardForPersonnel('pers-1')).rejects.toThrow(AuthError)
  })

  it('throws DatabaseError when personnel not found', async () => {
    buildMockClient({
      tables: {
        personnel: {
          data: null,
          error: { message: 'Not found', code: 'PGRST116' },
        },
      },
    })
    await expect(printCardForPersonnel('pers-missing')).rejects.toThrow(DatabaseError)
  })

  it('creates a print job and submits to CUPS when printer is available', async () => {
    mockSubmitCupsPrintJob.mockResolvedValue({ cupsJobId: 42 })

    buildMockClient({
      tables: {
        personnel: {
          data: {
            id: 'pers-1',
            first_name: 'John',
            surname: 'Doe',
            id_number: 'ID-001',
            job_title: 'Operator',
            area: 'A-Section',
            status: 'active',
            department_id: 'dept-1',
            photo_url: null,
            medical_expiry: null,
            induction_expiry: null,
          },
        },
        employees: {
          data: {
            role: 'access_control',
            id: 'emp-1',
            department_id: 'dept-1',
          },
        },
        card_printers: {
          data: { id: 'printer-1', cups_name: 'card-printer-1' },
        },
        print_jobs: {
          data: {
            id: 'job-1',
            personnel_id: 'pers-1',
            employee_name: 'John Doe',
            role_title: 'Operator',
            status: 'queued',
            printer_id: 'printer-1',
            cups_job_id: null,
          },
        },
      },
    })

    const result = await printCardForPersonnel('pers-1')

    expect(result.job.id).toBe('job-1')
    expect(result.printer?.id).toBe('printer-1')
    expect(result.job.cups_job_id).toBe(42)
    expect(mockSubmitCupsPrintJob).toHaveBeenCalledWith('card-printer-1', 'card-pers-1')
  })

  it('handles missing printer gracefully', async () => {
    buildMockClient({
      tables: {
        personnel: {
          data: {
            id: 'pers-1',
            first_name: 'John',
            surname: 'Doe',
            id_number: 'ID-001',
            job_title: 'Operator',
            area: 'A-Section',
            status: 'active',
            department_id: 'dept-1',
            photo_url: null,
            medical_expiry: null,
            induction_expiry: null,
          },
        },
        employees: {
          data: {
            role: 'access_control',
            id: 'emp-1',
            department_id: 'dept-1',
          },
        },
        card_printers: { data: null },
        print_jobs: {
          data: {
            id: 'job-1',
            personnel_id: 'pers-1',
            employee_name: 'John Doe',
            role_title: 'Operator',
            status: 'queued',
            printer_id: null,
            cups_job_id: null,
          },
        },
      },
    })

    const result = await printCardForPersonnel('pers-1')

    expect(result.job.id).toBe('job-1')
    expect(result.printer).toBeNull()
    expect(mockSubmitCupsPrintJob).not.toHaveBeenCalled()
  })

  it('handles CUPS submission failure gracefully', async () => {
    mockSubmitCupsPrintJob.mockRejectedValue(new Error('CUPS not available'))

    buildMockClient({
      tables: {
        personnel: {
          data: {
            id: 'pers-1',
            first_name: 'John',
            surname: 'Doe',
            id_number: 'ID-001',
            job_title: 'Operator',
            area: 'A-Section',
            status: 'active',
            department_id: 'dept-1',
            photo_url: null,
            medical_expiry: null,
            induction_expiry: null,
          },
        },
        employees: {
          data: {
            role: 'access_control',
            id: 'emp-1',
            department_id: 'dept-1',
          },
        },
        card_printers: {
          data: { id: 'printer-1', cups_name: 'card-printer-1' },
        },
        print_jobs: {
          data: {
            id: 'job-1',
            personnel_id: 'pers-1',
            employee_name: 'John Doe',
            role_title: 'Operator',
            status: 'queued',
            printer_id: 'printer-1',
            cups_job_id: null,
          },
        },
      },
    })

    const result = await printCardForPersonnel('pers-1')
    expect(result.job.id).toBe('job-1')
  })

  it('throws DatabaseError when print_jobs insert fails', async () => {
    buildMockClient({
      tables: {
        personnel: {
          data: {
            id: 'pers-1',
            first_name: 'John',
            surname: 'Doe',
            id_number: 'ID-001',
            job_title: 'Operator',
            area: 'A-Section',
            status: 'active',
            department_id: 'dept-1',
            photo_url: null,
            medical_expiry: null,
            induction_expiry: null,
          },
        },
        employees: {
          data: {
            role: 'access_control',
            id: 'emp-1',
            department_id: 'dept-1',
          },
        },
        print_jobs: {
          data: null,
          error: { message: 'Insert failed', code: 'PGRST' },
        },
      },
    })

    await expect(printCardForPersonnel('pers-1')).rejects.toThrow(DatabaseError)
  })
})
