/**
 * @module motion
 * Arch System — Framer Motion Token System
 * Unified springs, easings, transitions, stagger configs, and motion variants.
 */

// ── 1.0 Spring Physics ──
export const SPRING_PHYSICS = {
  soft: { type: 'spring' as const, stiffness: 100, damping: 20 },
  medium: { type: 'spring' as const, stiffness: 200, damping: 28 },
  stiff: { type: 'spring' as const, stiffness: 300, damping: 30 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 40 },
  overshoot: { type: 'spring' as const, stiffness: 180, damping: 14 },
  gentle: { type: 'spring' as const, stiffness: 80, damping: 24 },
} as const

export const SPRING_SNAPPY = SPRING_PHYSICS.snappy
export const SPRING_FLUID = SPRING_PHYSICS.medium

// ── 2.0 Easing Curves ──
export const EASINGS = {
  default: [0.25, 0.1, 0.25, 1],
  entrance: [0, 0, 0.2, 1],
  exit: [0.4, 0, 1, 1],
  slow: [0.16, 1, 0.3, 1],
  overshoot: [0.3, 1.2, 0.6, 1],
  decelerate: [0.12, 0.8, 0.35, 1],
  accelerate: [0.42, 0, 1, 1],
} as const

// ── 3.0 Transition Presets ──
export const TRANSITIONS = {
  default: { duration: 0.2, ease: EASINGS.default },
  entrance: { duration: 0.5, ease: EASINGS.entrance },
  exit: { duration: 0.15, ease: EASINGS.exit },
  slow: { duration: 0.8, ease: EASINGS.slow },
  fast: { duration: 0.1, ease: EASINGS.accelerate },
  magnetic: { duration: 0.15, ease: EASINGS.decelerate },
} as const

// ── 4.0 Stagger Configurations ──
export const STAGGER = {
  cards: {
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  },
  list: {
    visible: { transition: { staggerChildren: 0.05, delayChildren: 0.02 } },
  },
  bento: {
    visible: { transition: { staggerChildren: 0.04, delayChildren: 0.03 } },
  },
  dramatic: {
    visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
  },
} as const

// ── 5.0 Motion Variants ──
export const VARIANTS = {
  fadeIn: {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: TRANSITIONS.entrance },
  },
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95, y: 8 },
    visible: { opacity: 1, scale: 1, y: 0, transition: TRANSITIONS.entrance },
  },
  slideUp: {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: TRANSITIONS.entrance },
  },
  popIn: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: TRANSITIONS.entrance },
  },
  liquidGlass: {
    hidden: {
      opacity: 0,
      y: 16,
      scale: 0.98,
      transition: { duration: 0.6, ease: EASINGS.decelerate },
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.7, ease: EASINGS.decelerate },
    },
    hover: {
      y: -6,
      scale: 1.01,
      transition: { duration: 0.2, ease: EASINGS.decelerate },
    },
    tap: { scale: 0.98, y: -2, transition: { duration: 0.1 } },
  },
  magnetic: {
    idle: { scale: 1 },
    hover: {
      scale: 1.02,
      transition: { duration: 0.3, ease: EASINGS.decelerate },
    },
    tap: { scale: 0.96, transition: { duration: 0.05 } },
  },
  perpetual: {
    pulse: {
      animate: {
        scale: [1, 0.98, 1],
        opacity: [1, 0.85, 1],
        transition: { duration: 2, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
      },
    },
    float: {
      animate: {
        y: [0, -6, 0],
        transition: { duration: 3, repeat: Infinity, ease: [0.4, 0, 0.6, 1] },
      },
    },
  },
} as const

// Legacy support exports
export const springPhysics = { ...SPRING_PHYSICS } as const
export const easings = { ...EASINGS } as const
export const transitions = { ...TRANSITIONS } as const
export const stagger = { ...STAGGER } as const
export const variants = { ...VARIANTS } as const
export const liquidGlassVariants = VARIANTS.liquidGlass
export const magneticVariants = VARIANTS.magnetic
export const perpetualVariants = VARIANTS.perpetual
export const GLASS_CARD_VARIANTS = VARIANTS.liquidGlass
export const FADE_IN_VARIANTS = VARIANTS.fadeIn
export const SLIDE_UP_VARIANTS = VARIANTS.slideUp
