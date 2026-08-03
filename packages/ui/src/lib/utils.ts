/**
 * @module ui/utils
 * Shared CSS class-name utility — merges Tailwind classes with conflict resolution.
 */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge CSS class names with Tailwind conflict resolution.
 * Combines `clsx` (conditional class concatenation) with `twMerge`
 * (Tailwind-specific class deduplication).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
