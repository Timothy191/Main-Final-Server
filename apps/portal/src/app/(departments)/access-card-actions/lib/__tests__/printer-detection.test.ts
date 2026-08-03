/**
 * Tests for printer-detection.ts — CUPS/USB printer utility.
 *
 * All tests mock child_process.exec and fs/promises.access since these are
 * Linux system calls unavailable in the jsdom test environment.
 */

import { exec } from 'child_process'
import { access } from 'fs/promises'

import {
  scanCupsPrinters,
  getPrinterQueue,
  getPrinterStatus,
  detectAllPrinters,
  scanUsbDevices,
} from '../printer-detection'

// ---------------------------------------------------------------------------
// Module-level mocks (hoisted by jest before imports are resolved)
// ---------------------------------------------------------------------------

jest.mock('child_process', () => ({
  exec: jest.fn(),
}))

jest.mock('fs/promises', () => ({
  access: jest.fn(),
}))

// ---------------------------------------------------------------------------
// Mock helpers
// ---------------------------------------------------------------------------

/** Shorthand cast so we don't repeat `as jest.Mock` everywhere. */
const mockExec = exec as unknown as jest.Mock
const mockAccess = access as unknown as jest.Mock

/**
 * Configure mockExec to return specific stdout when the command **includes**
 * one of the matcher keys. Any unmatched command causes exec to call back
 * with an error (simulating command-not-found).
 */
function mockExecCommand(commands: Record<string, string>): void {
  mockExec.mockImplementation(
    (
      cmd: string,
      _opts: unknown,
      cb: (_err: Error | null, _result: { stdout: string; stderr: string } | null) => void
    ) => {
      for (const [match, stdout] of Object.entries(commands)) {
        if (cmd.includes(match)) {
          cb(null, { stdout, stderr: '' })
          return
        }
      }
      cb(new Error(`Command not mocked: ${cmd}`), null)
    }
  )
}

/**
 * Configure mockAccess to resolve for matching device paths and reject for
 * all others. Used by scanUsbDevices which checks /dev/usb/lp* paths.
 */
function mockAccessForPaths(resolvePaths: string[]): void {
  mockAccess.mockImplementation((path: string) => {
    if (resolvePaths.includes(path)) {
      return Promise.resolve(undefined)
    }
    return Promise.reject(new Error('ENOENT'))
  })
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  jest.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests: scanCupsPrinters
// ---------------------------------------------------------------------------

describe('scanCupsPrinters()', () => {
  it('returns empty array when lpstat is not found (exec throws)', async () => {
    mockExec.mockImplementation(
      (_cmd: unknown, _opts: unknown, cb: (_err: Error | null, _result: undefined) => void) => {
        cb(new Error('Command not found: lpstat'), undefined)
      }
    )

    const result = await scanCupsPrinters()

    expect(result).toEqual([])
  })

  it('returns empty array when no printers are configured (empty stdout)', async () => {
    mockExecCommand({ 'lpstat -a': '' })

    const result = await scanCupsPrinters()

    expect(result).toEqual([])
  })

  it('parses a single online printer correctly', async () => {
    mockExecCommand({
      'lpstat -a': 'printer1 accepting requests since Mon Jan 1 00:00:00 2024',
      'lpstat -l -p': '', // getPrinterDetails returns empty
    })

    const result = await scanCupsPrinters()

    expect(result).toHaveLength(1)
    expect(result[0]!.cupsName).toBe('printer1')
    expect(result[0]!.status).toBe('online')
  })

  it('parses multiple printers with mixed statuses', async () => {
    mockExecCommand({
      'lpstat -a': [
        'printer1 accepting requests since Mon Jan 1 00:00:00 2024',
        'printer2 not accepting requests since Tue Jan 2 00:00:00 2024 - Paper jam',
      ].join('\n'),
      'lpstat -l -p': '',
    })

    const result = await scanCupsPrinters()

    expect(result).toHaveLength(2)

    const p1 = result.find((p) => p.cupsName === 'printer1')
    expect(p1).toBeDefined()
    expect(p1!.status).toBe('online')

    const p2 = result.find((p) => p.cupsName === 'printer2')
    expect(p2).toBeDefined()
    expect(p2!.status).toBe('offline')
    expect(p2!.statusMessage).toBe('Paper jam')
  })

  it('handles a printer with USB device URI', async () => {
    mockExecCommand({
      'lpstat -a': 'printer1 accepting requests since Mon Jan 1 00:00:00 2024',
      'lpstat -l -p': [
        'Description: Card Printer 3000',
        'Make and model: Magicard Neo',
        'Device: usb://Vendor/Product?serial=123',
      ].join('\n'),
    })

    const result = await scanCupsPrinters()

    expect(result).toHaveLength(1)
    expect(result[0]!.connectionType).toBe('usb')
    expect(result[0]!.vendorId).toBe('Vendor')
    expect(result[0]!.productId).toBe('Product')
  })
})

// ---------------------------------------------------------------------------
// Tests: getPrinterStatus
// ---------------------------------------------------------------------------

describe('getPrinterStatus()', () => {
  it("returns 'online' when printer is idle", async () => {
    mockExecCommand({
      'lpstat -p': 'printer printer1 is idle.  enabled since Mon Jan 1 00:00:00 2024',
    })

    const result = await getPrinterStatus('printer1')

    expect(result).toBe('online')
  })

  it("returns 'online' when printer is printing", async () => {
    mockExecCommand({
      'lpstat -p': 'printer printer1 is printing.  enabled since Mon Jan 1 00:00:00 2024',
    })

    const result = await getPrinterStatus('printer1')

    expect(result).toBe('online')
  })

  it("returns 'offline' when printer is disabled", async () => {
    mockExecCommand({
      'lpstat -p': 'printer printer1 is disabled.  enabled since Mon Jan 1 00:00:00 2024',
    })

    const result = await getPrinterStatus('printer1')

    expect(result).toBe('offline')
  })

  it("returns 'error' when lpstat fails (exec throws)", async () => {
    mockExec.mockImplementation(
      (_cmd: unknown, _opts: unknown, cb: (_err: Error | null, _result: undefined) => void) => {
        cb(new Error('Command not found'), undefined)
      }
    )

    const result = await getPrinterStatus('printer1')

    expect(result).toBe('error')
  })
})

// ---------------------------------------------------------------------------
// Tests: getPrinterQueue
// ---------------------------------------------------------------------------

describe('getPrinterQueue()', () => {
  it('returns empty array when lpq fails (exec throws)', async () => {
    mockExec.mockImplementation(
      (_cmd: unknown, _opts: unknown, cb: (_err: Error | null, _result: undefined) => void) => {
        cb(new Error('Command not found'), undefined)
      }
    )

    const result = await getPrinterQueue('printer1')

    expect(result).toEqual([])
  })

  it('returns empty array when queue has no entries', async () => {
    mockExecCommand({
      'lpq -P': [
        'printer1 is ready',
        'Rank    Owner   Job     File(s)                         Total Size',
        'no entries',
      ].join('\n'),
    })

    const result = await getPrinterQueue('printer1')

    expect(result).toEqual([])
  })

  it('parses queue entries correctly', async () => {
    mockExecCommand({
      'lpq -P': [
        'printer1 is ready',
        'Rank    Owner   Job     File(s)                         Total Size',
        'active  user    42      card_abc123.png                 1024 bytes',
      ].join('\n'),
    })

    const result = await getPrinterQueue('printer1')

    expect(result).toHaveLength(1)
    expect(result[0]!.jobId).toBe(42)
    expect(result[0]!.status).toBe('active')
    expect(result[0]!.size).toBe(1024)
  })

  it('skips malformed lines in the queue output', async () => {
    mockExecCommand({
      'lpq -P': [
        'printer1 is ready',
        'Rank    Owner   Job     File(s)                         Total Size',
        'active  user    invalid_job  file.png  512 bytes',
        'active  user    99      file2.png                       256 bytes',
      ].join('\n'),
    })

    const result = await getPrinterQueue('printer1')

    // First data line has "invalid_job" which is NaN — skipped
    expect(result).toHaveLength(1)
    expect(result[0]!.jobId).toBe(99)
    expect(result[0]!.size).toBe(256)
  })
})

// ---------------------------------------------------------------------------
// Tests: scanUsbDevices
// ---------------------------------------------------------------------------

describe('scanUsbDevices()', () => {
  it('returns empty array when no USB devices exist', async () => {
    mockAccess.mockRejectedValue(new Error('ENOENT'))

    const result = await scanUsbDevices()

    expect(result).toEqual([])
  })

  it('returns found device paths', async () => {
    mockAccessForPaths(['/dev/usb/lp0'])

    const result = await scanUsbDevices()

    expect(result).toEqual(['/dev/usb/lp0'])
  })
})

// ---------------------------------------------------------------------------
// Tests: detectAllPrinters
// ---------------------------------------------------------------------------

describe('detectAllPrinters()', () => {
  it('merges CUPS printers with USB-only devices', async () => {
    // CUPS sees one network printer
    mockExecCommand({
      'lpstat -a': 'network-printer1 accepting requests since Mon Jan 1 00:00:00 2024',
      'lpstat -l -p': '', // getPrinterDetails returns empty defaults
    })

    // USB has a device not in CUPS results
    mockAccessForPaths(['/dev/usb/lp0'])

    const result = await detectAllPrinters()

    // Expect 2: 1 CUPS printer + 1 USB fallback
    expect(result).toHaveLength(2)

    const cupsPrinter = result.find((p) => p.cupsName === 'network-printer1')
    expect(cupsPrinter).toBeDefined()
    expect(cupsPrinter!.connectionType).toBe('unknown') // No device URI returned

    const usbPrinter = result.find((p) => p.cupsName === 'usb-_dev_usb_lp0')
    expect(usbPrinter).toBeDefined()
    expect(usbPrinter!.connectionType).toBe('usb')
    expect(usbPrinter!.devicePath).toBe('/dev/usb/lp0')
    expect(usbPrinter!.status).toBe('online')
  })
})
