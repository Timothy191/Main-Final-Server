/**
 * @module theme
 * @repo/theme — Arch System design tokens, React theme primitives, and Tailwind preset.
 *
 * Re-exports all token categories (colors, shadows, radii, motion, glass)
 * plus the React {@link ArchThemeProvider} and {@link ThemeToggle} components.
 */

// Tokens
export * from './tokens'

// React
export { ArchThemeProvider, useArchTheme, useTheme } from './react/theme-provider'
export { ThemeToggle } from './react/theme-toggle'
