/**
 * Server-safe cursor encode/decode helpers (no React / no "use client").
 * Safe to import from Server Actions and RSC.
 */

/**
 * Encode a cursor object to a base64 string.
 * Cursor payload: { s: sortValue, i: id } — composite for stable ordering.
 */
export function encodeCursor(sortValue: string, id: string): string {
  return btoa(JSON.stringify({ s: sortValue, i: id }))
}

/**
 * Decode a base64 cursor string to { s: string; i: string }.
 * Returns null if the cursor is invalid (tampered / corrupted).
 */
export function decodeCursor(cursor: string): { s: string; i: string } | null {
  try {
    const parsed = JSON.parse(atob(cursor)) as { s?: unknown; i?: unknown }
    if (typeof parsed.s !== 'string' || typeof parsed.i !== 'string') return null
    return { s: parsed.s, i: parsed.i }
  } catch {
    return null
  }
}

/**
 * @deprecated — use inline `.split(",").filter(Boolean)` in page components.
 * Build a cursor stack from URL search params.
 * `cursors` param is a comma-separated list of base64 cursors.
 */
export function parseCursorStack(cursorsParam?: string): string[] {
  if (!cursorsParam) return []
  return cursorsParam.split(',').filter(Boolean)
}

/**
 * @deprecated — use inline `.join(",")` in page components.
 * Serialize a cursor stack to a URL search param string.
 */
export function serializeCursorStack(cursors: string[]): string {
  return cursors.join(',')
}
