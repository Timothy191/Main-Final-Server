/**
 * Standardized GlassCard visual variants for the Arch-System design language.
 * Governs blur, opacity, and border intensity to ensure industrial UI consistency.
 */
export const glassVariants = {
  subtle: {
    blur: '8px',
    opacity: '0.4',
    borderOpacity: '0.1',
    background: 'var(--bg-secondary)',
  },
  moderate: {
    blur: '12px',
    opacity: '0.6',
    borderOpacity: '0.2',
    background: 'var(--bg-secondary)',
  },
  intense: {
    blur: '16px',
    opacity: '0.8',
    borderOpacity: '0.3',
    background: 'var(--bg-secondary)',
  },
} as const

export type GlassVariant = keyof typeof glassVariants
