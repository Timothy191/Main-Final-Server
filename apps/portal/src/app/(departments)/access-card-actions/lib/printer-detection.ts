/**
 * CUPS Printer Detection Utility
 *
 * Wraps Linux CUPS commands (lpstat, lpq, lp) for detecting and interacting
 * with card printers. Runs on-prem with direct system access.
 *
 * All top-level exported functions catch errors gracefully and return partial
 * results — never throw from exported functions.
 *
 * @module printer-detection
 */

import { exec } from 'child_process'
import { access } from 'fs/promises'
import { promisify } from 'util'

const execAsync = promisify(exec)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DetectedPrinter {
  cupsName: string
  model: string
  connectionType: 'usb' | 'network' | 'unknown'
  status: 'online' | 'offline' | 'error'
  statusMessage?: string
  vendorId?: string
  productId?: string
  devicePath?: string
  isNeoMagic300: boolean
}

interface PrintQueueEntry {
  jobId: number
  status: string
  size: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Known Neo Magic 300 model identifiers (case-insensitive match). */
const NEO_MAGIC_KEYWORDS = ['neo magic 300', 'magicard', 'neo', 'matica']

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check whether a model string indicates a Neo Magic 300 printer family.
 * Performs case-insensitive keyword matching.
 */
function isNeoMagicModel(model: string): boolean {
  const lower = model.toLowerCase()
  return NEO_MAGIC_KEYWORDS.some((keyword) => lower.includes(keyword))
}

/**
 * Parse the status string from lpstat -a output.
 * Returns "online" when the printer is accepting requests,
 * "offline" when explicitly not accepting, and "error" otherwise.
 */
function parseAcceptingStatus(line: string): {
  status: DetectedPrinter['status']
  statusMessage?: string
} {
  // Check the negative case first since "accepting requests" is a substring
  // of "not accepting requests".
  if (line.includes('not accepting requests')) {
    // Extract optional reason after the date portion
    // Format: <name> not accepting requests since <date> - <reason>
    const reasonIndex = line.indexOf(' - ')
    const statusMessage = reasonIndex !== -1 ? line.slice(reasonIndex + 3).trim() : undefined
    return { status: 'offline', statusMessage }
  }

  if (line.includes('accepting requests')) {
    return { status: 'online' }
  }

  return { status: 'error', statusMessage: line.trim() }
}

/**
 * Extract the first printer name from an lpstat line.
 * The printer name is everything before the first space.
 */
function extractPrinterName(line: string): string | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const spaceIndex = trimmed.indexOf(' ')
  return spaceIndex !== -1 ? trimmed.slice(0, spaceIndex) : trimmed
}

/**
 * Determine connection type and extract USB vendor/product IDs from a device URI.
 */
function parseDeviceUri(
  uri: string
): Pick<DetectedPrinter, 'connectionType' | 'vendorId' | 'productId' | 'devicePath'> {
  if (uri.startsWith('usb://')) {
    // Format: usb://Vendor/Product?serial=... or usb://Vendor:Product/...
    const ids = uri.match(/usb:\/\/([^/?#]+)[/:]([^/?#]+)/)
    return {
      connectionType: 'usb',
      vendorId: ids?.[1] ?? undefined,
      productId: ids?.[2] ?? undefined,
    }
  }

  if (uri.startsWith('socket://') || uri.startsWith('lpd://')) {
    return { connectionType: 'network' }
  }

  return { connectionType: 'unknown' }
}

/**
 * Execute a shell command and return stdout, or null on failure.
 * This is the single exec entry point — all command execution flows through here
 * to ensure consistent error handling.
 */
async function safeExec(command: string): Promise<{ stdout: string; stderr: string } | null> {
  try {
    const result = await execAsync(command, { timeout: 10_000 })
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim() }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Printer details (internal)
// ---------------------------------------------------------------------------

/**
 * Execute lpstat -l -p <printer> to get detailed info including device URI.
 * Used to determine connection type and USB VID/PID.
 *
 * Parse: "Device: uri" line to get connection info.
 * If URI starts with "usb://" extract vendor/product IDs.
 * If URI starts with "socket://" or "lpd://" it's network.
 */
async function getPrinterDetails(cupsName: string): Promise<Partial<DetectedPrinter>> {
  const result = await safeExec(`lpstat -l -p "${cupsName}"`)
  if (!result) return {}

  const lines = result.stdout.split('\n')
  const details: Partial<DetectedPrinter> = {}
  const modelParts: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    // Parse device URI
    if (trimmed.startsWith('Device:')) {
      const uri = trimmed.replace(/^Device:\s*/, '').trim()
      Object.assign(details, parseDeviceUri(uri))
      continue
    }

    // Collect model-related lines for Neo Magic detection
    if (trimmed.startsWith('Description:') || trimmed.startsWith('Make and model:')) {
      const value = trimmed.replace(/^(Description|Make and model):\s*/, '')
      modelParts.push(value)
    }
  }

  // Derive model string from description / make-and-model
  const model = modelParts.join(' ').trim()
  if (model) {
    details.model = model
    details.isNeoMagic300 = isNeoMagicModel(model)
  }

  return details
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Execute lpstat -a to list all configured CUPS printers with status.
 * Returns an array of DetectedPrinter objects.
 *
 * Handles CUPS not installed, no printers configured, and offline printers.
 */
export async function scanCupsPrinters(): Promise<DetectedPrinter[]> {
  const result = await safeExec('lpstat -a')
  if (!result) {
    // lpstat not found, not installed, or no printers — return empty
    return []
  }

  const lines = result.stdout.split('\n').filter(Boolean)
  if (lines.length === 0) return []

  const printers: DetectedPrinter[] = []

  for (const line of lines) {
    const cupsName = extractPrinterName(line)
    if (!cupsName) continue

    const { status, statusMessage } = parseAcceptingStatus(line)

    // Fetch detailed info for each printer (device URI, model, etc.)
    const details = await getPrinterDetails(cupsName)

    printers.push({
      cupsName,
      model: details.model ?? cupsName,
      connectionType: details.connectionType ?? 'unknown',
      status,
      statusMessage,
      vendorId: details.vendorId,
      productId: details.productId,
      devicePath: details.devicePath,
      isNeoMagic300: details.isNeoMagic300 ?? isNeoMagicModel(cupsName),
    })
  }

  return printers
}

/**
 * Execute lpq -P <printer> to get the print queue for a printer.
 * Returns array of queued jobs or empty array if no jobs or printer unreachable.
 */
export async function getPrinterQueue(cupsName: string): Promise<PrintQueueEntry[]> {
  const result = await safeExec(`lpq -P "${cupsName}"`)
  if (!result) return []

  const lines = result.stdout.split('\n').filter(Boolean)

  // Skip header lines — find the column header first, then parse data rows
  const dataStartIndex = lines.findIndex(
    (l) => l.includes('Rank') && l.includes('Owner') && l.includes('Job') && l.includes('File')
  )
  if (dataStartIndex === -1) return []

  // "no entries" means the queue is empty
  const dataLines = lines.slice(dataStartIndex + 1).filter((l) => {
    const trimmed = l.trim()
    return trimmed.length > 0 && !trimmed.includes('no entries')
  })

  const entries: PrintQueueEntry[] = []

  for (const line of dataLines) {
    // Columns: Rank, Owner, Job#, File(s), Total Size
    // Example: "active  user    42      card_abc123.png     1024 bytes"
    const parts = line.trim().split(/\s+/)
    if (parts.length < 5) continue

    // All indices are safe because length >= 5 was checked above
    const jobId = Number.parseInt(parts[2]!, 10)
    if (Number.isNaN(jobId)) continue

    // Size is the second-to-last token (before "bytes" or "kB")
    const sizeToken = parts[parts.length - 2]!
    const size = Number.parseInt(sizeToken, 10) || 0

    entries.push({ jobId, status: parts[0]!, size })
  }

  return entries
}

/**
 * Check if a printer is reachable by running lpstat -p <printer>
 * and checking the status line.
 * Returns "online" | "offline" | "error"
 */
export async function getPrinterStatus(cupsName: string): Promise<'online' | 'offline' | 'error'> {
  const result = await safeExec(`lpstat -p "${cupsName}"`)
  if (!result) return 'error'

  const statusLine = result.stdout.split('\n').find((l) => l.toLowerCase().includes('printer'))
  if (!statusLine) return 'error'

  const lower = statusLine.toLowerCase()

  if (lower.includes('idle') || lower.includes('printing') || lower.includes('processing')) {
    return 'online'
  }

  if (lower.includes('disabled') || lower.includes('offline')) {
    return 'offline'
  }

  return 'error'
}

/**
 * Scan /dev/usb/lp* to find USB printer device paths.
 * Returns list of device paths like ["/dev/usb/lp0", "/dev/usb/lp1"].
 * Uses fs.promises.access for each enumerated device.
 */
export async function scanUsbDevices(): Promise<string[]> {
  const candidates = ['/dev/usb/lp0', '/dev/usb/lp1', '/dev/usb/lp2', '/dev/usb/lp3']
  const found: string[] = []

  for (const devicePath of candidates) {
    try {
      await access(devicePath)
      found.push(devicePath)
    } catch {
      // Device doesn't exist — skip
    }
  }

  return found
}

/**
 * Submit a print job to a CUPS printer.
 * Uses lp command to send job data to the specified printer.
 * Returns the CUPS job ID on success, or throws on failure.
 */
export async function submitCupsPrintJob(
  cupsName: string,
  jobName: string,
  data?: string
): Promise<{ cupsJobId: number | null }> {
  const cmd = data
    ? `echo ${JSON.stringify(data)} | lp -d "${cupsName}" -t "${jobName}"`
    : `lp -d "${cupsName}" -t "${jobName}" /dev/null`

  const result = await safeExec(cmd)
  if (!result) {
    return { cupsJobId: null }
  }

  // lp outputs: "request id is <printer>-<jobId> (1 file(s))"
  const match = result.stdout.match(/request id is [\w-]+-(\d+)/)
  const cupsJobId = match ? Number.parseInt(match[1]!, 10) : null

  return { cupsJobId }
}

/**
 * Perform a comprehensive scan: check CUPS + USB, merge results,
 * and detect Neo Magic 300 printers.
 *
 * This is the main function called by the API.
 */
export async function detectAllPrinters(): Promise<DetectedPrinter[]> {
  const [cupsPrinters, usbDevices] = await Promise.all([scanCupsPrinters(), scanUsbDevices()])

  // Build a set of device paths already represented in CUPS results
  const knownDevicePaths = new Set(cupsPrinters.map((p) => p.devicePath).filter(Boolean))

  // Add fallback entries for USB devices that CUPS doesn't know about
  for (const devPath of usbDevices) {
    if (knownDevicePaths.has(devPath)) continue

    cupsPrinters.push({
      cupsName: `usb-${devPath.replace(/[^a-zA-Z0-9]/g, '_')}`,
      model: `Unknown USB Printer (${devPath})`,
      connectionType: 'usb',
      status: 'online',
      devicePath: devPath,
      isNeoMagic300: false,
    })
  }

  return cupsPrinters
}
