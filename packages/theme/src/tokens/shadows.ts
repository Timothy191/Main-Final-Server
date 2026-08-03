/**
 * @module shadows
 * Arch System — Diffusion Shadow System (Light Mode)
 *
 * These JS constants mirror the CSS custom properties in variables.css exactly.
 * Use these only when a CSS var() reference isn't possible (e.g. Framer Motion,
 * canvas drawing, runtime style injection). In all other cases prefer
 * className="shadow-diffusion-sm" or style={{ boxShadow: "var(--shadow-card)" }}.
 *
 * Source of truth: packages/theme/src/css/variables.css
 */

export const shadows = {
  // ── Diffusion shadows — soft, layered depth (light mode) ──────────────────
  'diffusion-sm': '0 2px 4px -1px rgba(0, 0, 0, 0.04), 0 8px 12px -4px rgba(0, 0, 0, 0.03)',
  'diffusion-md': '0 3px 5px -1px rgba(0, 0, 0, 0.04), 0 14px 18px -5px rgba(0, 0, 0, 0.03)',
  'diffusion-lg': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.03)',
  'diffusion-xl': '0 4px 8px -2px rgba(0, 0, 0, 0.05), 0 28px 40px -8px rgba(0, 0, 0, 0.04)',

  // ── Card shadows — dual-shadow ultra-diffused with inner top-highlight ──────
  card: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.03), 0 1px 0 0 rgba(255, 255, 255, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
  'card-hover':
    '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 24px 30px -5px rgba(0, 0, 0, 0.04), 0 1px 0 0 rgba(255, 255, 255, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',

  // ── Elevated & window ─────────────────────────────────────────────────────
  elevated:
    '0 4px 8px -2px rgba(0, 0, 0, 0.05), 0 28px 45px -8px rgba(0, 0, 0, 0.04), 0 1px 0 0 rgba(255, 255, 255, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',
  window:
    '0 4px 8px -2px rgba(0, 0, 0, 0.05), 0 32px 60px -10px rgba(0, 0, 0, 0.04), 0 1px 0 0 rgba(255, 255, 255, 0.95), inset 0 1px 0 0 rgba(255, 255, 255, 0.9)',

  // ── Glow shadows — brand charcoal accent ─────────────────────────────────
  'glow-blue': '0 0 20px rgba(28, 28, 30, 0.18), 0 0 60px rgba(28, 28, 30, 0.06)',
  'glow-primary': '0 0 20px rgba(28, 28, 30, 0.18), 0 0 60px rgba(28, 28, 30, 0.06)',
  'glow-electric': '0 0 24px rgba(28, 28, 30, 0.28), 0 0 80px rgba(28, 28, 30, 0.10)',

  // ── Tremor-compatible shadows ─────────────────────────────────────────────
  'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
} as const
