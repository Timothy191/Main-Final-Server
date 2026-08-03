/**
 * @module theme/tokens
 * Barrel re-export of all Arch System design tokens.
 *
 * Consumed by `@repo/theme` root and by any package that needs
 * JS-level access to colors, shadows, motion, or glass tokens
 * (e.g. Framer Motion, canvas rendering, chart libraries).
 */

/** Official color palette object and CSS variable helper. */
export { OFFICIAL_PALETTE, paletteVar, type OfficialPalette } from './palette'
/** Arch primitive color constants (arch0–arch15) and semantic aliases. */
export {
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
  ARCH_PALETTE,
  colors,
  glass,
  hsl,
  generateThemerColorSet,
} from './colors'
/** Aurora accent constants — deprecated aliases kept for backward compatibility. */
export { accentIndigo, accentViolet, accentAlert, accentBlue, accentEmerald } from './colors'
/** Diffusion shadow system (light mode). */
export { shadows } from './shadows'
/** Border radius scale. */
export { radii } from './radii'
/** Font family and weight tokens. */
export { fonts, fontWeights } from './typography'
/** Framer Motion spring, easing, transition, stagger, and variant presets. */
export {
  SPRING_PHYSICS,
  SPRING_SNAPPY,
  SPRING_FLUID,
  EASINGS,
  TRANSITIONS,
  STAGGER,
  VARIANTS,
  springPhysics,
  easings,
  transitions,
  stagger,
  variants,
  liquidGlassVariants,
  magneticVariants,
  perpetualVariants,
  GLASS_CARD_VARIANTS,
  FADE_IN_VARIANTS,
  SLIDE_UP_VARIANTS,
} from './motion'
/** Generated token map — source of truth synced from CSS variables. */
export { tokens } from './generated'
/** Glass variant presets for GlassCard components. */
export * from './glass'
/** Type definitions for the generated token structure. */
export type {
  Tokens,
  ColorTokens,
  ShadowTokens,
  RadiusTokens,
  PrimitiveTokens,
  HslTokens,
} from './generated'
