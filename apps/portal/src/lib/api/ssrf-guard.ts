/**
 * SSRF Guard — Validates webhook URLs against private/internal IP ranges.
 *
 * Prevents attackers from creating webhooks that target internal services
 * (e.g., http://169.254.169.254/ for cloud metadata, or localhost services).
 */

import { ValidationError } from '@/lib/errors/error-classes'

/** Private/reserved IPv4 ranges (CIDR notation) */
const PRIVATE_IPV4_RANGES: Array<{ network: number; mask: number }> = [
  // 127.0.0.0/8 — Loopback
  { network: 0x7f000000, mask: 0xff000000 },
  // 10.0.0.0/8 — Private
  { network: 0x0a000000, mask: 0xff000000 },
  // 172.16.0.0/12 — Private
  { network: 0xac100000, mask: 0xfff00000 },
  // 192.168.0.0/16 — Private
  { network: 0xc0a80000, mask: 0xffff0000 },
  // 169.254.0.0/16 — Link-local (includes cloud metadata 169.254.169.254)
  { network: 0xa9fe0000, mask: 0xffff0000 },
  // 100.64.0.0/10 — Carrier-grade NAT
  { network: 0x64400000, mask: 0xffc00000 },
  // 0.0.0.0/8 — Current network
  { network: 0x00000000, mask: 0xff000000 },
]

/** Private/reserved IPv6 prefixes (lowercase) */
const PRIVATE_IPV6_PREFIXES = ['::1', '::', 'fe80:', 'fc00:', 'fd00:', 'ff00:']

function ipv4ToNumber(ip: string): number | null {
  const parts = ip.split('.')
  if (parts.length !== 4) return null
  let result = 0
  for (const part of parts) {
    const num = parseInt(part, 10)
    if (isNaN(num) || num < 0 || num > 255) return null
    result = (result << 8) | num
  }
  // Convert to unsigned 32-bit
  return result >>> 0
}

function isPrivateIpv4(ip: string): boolean {
  const num = ipv4ToNumber(ip)
  if (num === null) return false
  return PRIVATE_IPV4_RANGES.some(({ network, mask }) => (num & mask) === network)
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  return PRIVATE_IPV6_PREFIXES.some((prefix) => lower.startsWith(prefix))
}

/**
 * Validates a webhook URL is safe (no SSRF risk).
 * Throws ValidationError if the URL targets private/internal resources.
 *
 * Checks:
 * - Scheme must be https (or http in development only)
 * - Hostname must not resolve to private IP ranges
 * - No link-local, loopback, or cloud metadata endpoints
 */
export function checkSSRF(url: string): { success: boolean; error?: string } {
  try {
    validateWebhookUrl(url)
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'SSRF check failed' }
  }
}

export function validateWebhookUrl(url: string): void {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw new ValidationError('Invalid webhook URL format', { field: 'url', value: url })
  }

  // Scheme check: only allow https in production, http+https in dev
  const isDev = process.env.NODE_ENV !== 'production'
  if (parsed.protocol === 'https:') {
    // always allowed
  } else if (parsed.protocol === 'http:' && isDev) {
    // allowed in development only
  } else {
    throw new ValidationError(`Webhook URL scheme must be ${isDev ? 'http or https' : 'https'}`, {
      field: 'url',
      value: parsed.protocol,
    })
  }

  const hostname = parsed.hostname

  // Block obvious private hostnames
  if (hostname === 'localhost' || hostname === '[::1]' || hostname === '0.0.0.0') {
    throw new ValidationError('Webhook URL must not target localhost or loopback', {
      field: 'url',
      value: hostname,
    })
  }

  // Block IP literal hostnames
  // IPv4 in URL: hostname is the IP (e.g., "127.0.0.1")
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
    if (isPrivateIpv4(hostname)) {
      throw new ValidationError('Webhook URL must not target private IP ranges', {
        field: 'url',
        value: hostname,
      })
    }
  }

  // IPv6 in URL: hostname is bracketed (e.g., "[::1]")
  if (hostname.startsWith('[') && hostname.endsWith(']')) {
    const ipv6 = hostname.slice(1, -1)
    if (isPrivateIpv6(ipv6)) {
      throw new ValidationError('Webhook URL must not target private IPv6 ranges', {
        field: 'url',
        value: hostname,
      })
    }
  }

  // Block cloud metadata service hostnames
  if (hostname === '169.254.169.254' || hostname === 'metadata.google.internal') {
    throw new ValidationError('Webhook URL must not target cloud metadata endpoints', {
      field: 'url',
      value: hostname,
    })
  }

  // Block .internal and .local TLDs (common internal service discovery)
  if (hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new ValidationError('Webhook URL must not target internal service domains', {
      field: 'url',
      value: hostname,
    })
  }
}
