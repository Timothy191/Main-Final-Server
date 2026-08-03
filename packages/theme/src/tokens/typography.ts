/**
 * @module typography
 * Arch System — Font Family Tokens
 */

export const fonts = {
  sans: 'var(--font-space-grotesk), "Inter", ui-sans-serif, system-ui, sans-serif',
  mono: 'var(--font-geist-mono), "Geist Mono", ui-monospace, "Cascadia Code", monospace',
} as const

export const fontWeights = {
  normal: 400,
  medium: 500,
} as const
