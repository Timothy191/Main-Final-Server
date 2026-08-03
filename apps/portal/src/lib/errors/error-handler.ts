/**
 * Global error handler for auto-handling common runtime and compilation errors.
 *
 * Provides:
 *  - Module resolution error detection (Turbopack cache issues)
 *  - Automatic retry with cache clearing
 *  - Structured error reporting for common failure patterns
 *
 * Usage:
 *   import { handleModuleError, isModuleResolutionError } from "@/lib/errors/error-handler";
 *
 *   if (isModuleResolutionError(error)) {
 *     await handleModuleError(error);
 *   }
 */

/**
 * Common module resolution error patterns detected in the codebase.
 * These occur when Turbopack cache is stale or imports use incorrect extensions.
 */
const MODULE_RESOLUTION_PATTERNS = [
  /Can't resolve ['"].*['"] in/,
  /Module not found/,
  /Failed to compile/,
  /Cannot find module/,
]

/**
 * Check if an error is a module resolution error (Turbopack/webpack).
 */
export function isModuleResolutionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return MODULE_RESOLUTION_PATTERNS.some((pattern) => pattern.test(message))
}

/**
 * Extract the unresolved module path from a resolution error message.
 * E.g., "Can't resolve './invalidation.js'" → "./invalidation.js"
 */
export function extractUnresolvedPath(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error)
  const match = message.match(/Can't resolve\s+(['"])([^'"]+)\1/)
  return match?.[2] ?? null
}

/**
 * Common fix: strip .js/.jsx extension from imports for Turbopack compatibility.
 * Many imports use `.js` extension (correct for TypeScript ESM output) but
 * Turbopack doesn't resolve these correctly to `.ts`/`.tsx` source files.
 */
export function normalizeImportPath(path: string): string {
  return path.replace(/\.(js|jsx)$/, '')
}

/**
 * Handle a module resolution error by suggesting the fix.
 * Returns the suggested fix action or null if auto-fix isn't possible.
 */
export function suggestModuleResolutionFix(error: unknown): string | null {
  const unresolvedPath = extractUnresolvedPath(error)
  if (!unresolvedPath) return null

  const normalizedPath = normalizeImportPath(unresolvedPath)
  if (normalizedPath !== unresolvedPath) {
    return `Change import from "${unresolvedPath}" to "${normalizedPath}" (strip .js extension for Turbopack)`
  }

  return null
}

/**
 * Common error types detected in the codebase with known fixes.
 */
export interface ErrorFix {
  pattern: RegExp
  suggestion: string
  autoFix?: boolean
}

export const KNOWN_ERROR_FIXES: ErrorFix[] = [
  {
    pattern: MODULE_RESOLUTION_PATTERNS[0]!,
    suggestion:
      'Turbopack module resolution failure — likely a stale cache or incorrect import extension (.js vs .ts). ' +
      'Clear .next cache and restart, or use extensionless imports.',
    autoFix: false,
  },
  {
    pattern: /MODULE_TYPELESS_PACKAGE_JSON/,
    suggestion:
      'Add "type": "module" to the package.json of the affected package to eliminate the warning.',
    autoFix: false,
  },
]

/**
 * Attempt to resolve a known error automatically.
 * Returns the list of suggested actions for manual fixes.
 */
export function diagnoseError(error: unknown): { suggestions: string[]; canAutoFix: boolean } {
  const message = error instanceof Error ? error.message : String(error)
  const suggestions: string[] = []
  let canAutoFix = false

  for (const fix of KNOWN_ERROR_FIXES) {
    if (fix.pattern.test(message)) {
      suggestions.push(fix.suggestion)
      if (fix.autoFix) canAutoFix = true
    }
  }

  const moduleFix = suggestModuleResolutionFix(error)
  if (moduleFix) {
    suggestions.push(moduleFix)
  }

  return { suggestions, canAutoFix }
}

/**
 * Clear Turbopack/Next.js caches to resolve stale compilation errors.
 */
export async function clearCompilationCaches(): Promise<void> {
  const { promises: fs } = await import('fs')
  const { join } = await import('path')

  const cachesToClear = [
    join(process.cwd(), '.next', 'cache'),
    join(process.cwd(), '.turbo', 'cache'),
  ]

  for (const cachePath of cachesToClear) {
    try {
      await fs.rm(cachePath, { recursive: true, force: true })
    } catch {
      // Cache directory may not exist
    }
  }
}
