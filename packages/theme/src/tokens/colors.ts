/**
 * @module colors
 * Arch System — Color System v4.0
 * macOS Ventura/Sonoma light palette (arch0-arch15) with semantic aliases.
 * Mirrors CSS custom properties in variables.css for JS/TS usage (charts, shaders, dynamic values).
 */

import { tokens } from './generated'

// ═══════════════════════════════════════════════════════════════
// ARCH COLOR PALETTE — macOS Ventura/Sonoma Light
// ═══════════════════════════════════════════════════════════════

/** Background range — macOS system grays (mirrors variables.css / tokens.json) */
export const arch0 = tokens.primitives.arch0 // macOS pure white background
export const arch1 = tokens.primitives.arch1 // elevated surface / card
export const arch2 = tokens.primitives.arch2 // sunken / input bg
export const arch3 = tokens.primitives.arch3 // pressed / deeply sunken

/** Border range — hairline to emphasis (stored as hex approximations for JS use) */
export const arch4 = tokens.primitives.arch4 // border subtle
export const arch5 = tokens.primitives.arch5 // border default
export const arch6 = tokens.primitives.arch6 // border emphasis
export const arch7 = tokens.primitives.arch7 // border strong

/** Text range — macOS type hierarchy */
export const arch8 = tokens.primitives.arch8 // muted / placeholder
export const arch9 = tokens.primitives.arch9 // secondary / caption
export const arch10 = tokens.primitives.arch10 // body
export const arch11 = tokens.primitives.arch11 // heading / primary

/** Aurora Accents — semantic status (charcoal primary per brand refresh) */
export const arch12 = tokens.primitives.arch12 // red — error / danger (WCAG 4.5:1)
export const arch13 = tokens.primitives.arch13 // deep charcoal — accent-blue alias
export const arch14 = tokens.primitives.arch14 // green — success
export const arch15 = tokens.primitives.arch15 // deep charcoal — brand primary

/** Complete palette array (for iteration) */
export const ARCH_PALETTE = [
  arch0,
  arch1,
  arch2,
  arch3,
  arch4,
  arch5,
  arch6,
  arch7,
  arch8,
  arch9,
  arch10,
  arch11,
  arch12,
  arch13,
  arch14,
  arch15,
] as const

// ═══════════════════════════════════════════════════════════════
// SEMANTIC ALIASES
// ═══════════════════════════════════════════════════════════════

export const colors = {
  bg: {
    primary: arch0,
    secondary: arch1,
    tertiary: arch2,
  },
  border: {
    subtle: arch4,
    default: arch5,
    emphasis: arch6,
  },
  text: {
    muted: arch8,
    secondary: arch9,
    body: arch10,
    primary: arch10,
    heading: arch11,
  },
  accent: {
    red: arch12,
    charcoal: arch13,
    /** @deprecated use charcoal — maps to arch13 deep charcoal */
    blue: arch13,
    green: arch14,
  },
} as const

/** @deprecated light-only — kept for backward compatibility */
export const colorsDark = { ...colors } as const

// ═══════════════════════════════════════════════════════════════
// TIER 3 — DEPRECATED ALIASES
// @deprecated — Migrate all usages to the canonical accent-* names.
// Stylelint will emit warnings on var(--accent-cyan/indigo/violet) usage.
// ═══════════════════════════════════════════════════════════════
/** @deprecated → use colors.accent.charcoal (arch13) */
export const accentCyan = arch13
/** @deprecated → use colors.accent.charcoal (arch13) */
export const accentIndigo = arch13
/** @deprecated → use colors.accent.charcoal (arch13) */
export const accentViolet = arch13
/** @deprecated → use colors.accent.red (arch12) */
export const accentAlert = arch12
/** @deprecated → use colors.accent.charcoal (arch13) */
export const accentBlue = arch13
/** @deprecated → use colors.accent.green (arch14) */
export const accentEmerald = arch14

// ═══════════════════════════════════════════════════════════════
// GLASSMORPHISM TOKENS (RGBA for runtime use)
// ═══════════════════════════════════════════════════════════════

export const glass = {
  surface: 'rgba(255, 255, 255, 0.72)',
  surfaceHover: 'rgba(255, 255, 255, 0.88)',
  surfaceStrong: 'rgba(255, 255, 255, 0.92)',
  border: 'rgba(255, 255, 255, 0.15)',
  borderTop: 'rgba(255, 255, 255, 0.25)',
  text: 'rgba(10, 10, 20, 0.92)',
  textMuted: 'rgba(10, 10, 20, 0.55)',
  vibrancy: 'rgba(246, 246, 250, 0.82)',
  /** @deprecated use top-level properties */
  light: {
    surface: 'rgba(255, 255, 255, 0.72)',
    surfaceHover: 'rgba(255, 255, 255, 0.88)',
    border: 'rgba(255, 255, 255, 0.15)',
    borderTop: 'rgba(255, 255, 255, 0.25)',
    text: 'rgba(10, 10, 20, 0.92)',
    textMuted: 'rgba(10, 10, 20, 0.55)',
  },
} as const

// ═══════════════════════════════════════════════════════════════
// HSL VALUES (for shadcn/ui compatibility — auto-synced from variables.css)
// ═══════════════════════════════════════════════════════════════

export const hsl = tokens.hsl

/** @deprecated light-only — kept for backward compatibility */
export const hslDark = { ...hsl } as const

/** Generate a themer-compatible ColorSet for external tool export */
export function generateThemerColorSet() {
  return {
    shade0: arch0,
    shade1: arch1,
    shade2: arch2,
    shade3: arch3,
    shade4: arch4,
    shade5: arch5,
    shade6: arch6,
    shade7: arch7,
    accent0: arch12,
    accent1: arch13,
    accent2: arch14,
    accent3: arch15,
    accent4: arch12,
    accent5: arch13,
    accent6: arch14,
    accent7: arch15,
  }
}
