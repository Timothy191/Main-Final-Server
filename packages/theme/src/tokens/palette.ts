/**
 * Arch Systems — Official Color Palette (TypeScript mirror)
 * Keep in sync with packages/theme/src/css/palette.css
 */

export const OFFICIAL_PALETTE = {
  neutral: {
    0: '#ffffff',
    50: '#f5f5f7',
    100: '#f6f6fa',
    200: '#e8e8ed',
    300: '#d2d2d7',
    400: '#a1a1a6',
    500: '#6e6e73',
    600: '#3a3a3c',
    900: '#1d1d1f',
    950: '#1c1c1e',
  },
  brand: {
    primary: '#1c1c1e',
    primaryHover: '#2c2c2e',
    onPrimary: '#ffffff',
  },
  semantic: {
    success: '#34c759',
    successHover: '#2db84d',
    warning: '#f59e0b',
    warningHover: '#d97706',
    danger: '#d22118',
    dangerHover: '#b81c15',
    info: '#1c1c1e',
    infoHover: '#2c2c2e',
  },
  surface: {
    canvas: '#f5f5f7',
    elevated: '#ffffff',
    sunken: '#e8e8ed',
    pressed: '#d2d2d7',
    chrome: 'rgba(0, 0, 0, 0.02)',
    vibrancy: 'rgba(246, 246, 250, 0.82)',
  },
  border: {
    subtle: 'rgba(0, 0, 0, 0.06)',
    default: 'rgba(0, 0, 0, 0.12)',
    emphasis: 'rgba(0, 0, 0, 0.2)',
    strong: 'rgba(0, 0, 0, 0.3)',
    glass: 'rgba(255, 255, 255, 0.5)',
    focus: '#1c1c1e',
  },
  text: {
    primary: '#1d1d1f',
    secondary: '#3a3a3c',
    tertiary: '#6e6e73',
    muted: '#a1a1a6',
    inverted: '#ffffff',
    onGlass: 'rgba(10, 10, 20, 0.92)',
    onGlassMuted: 'rgba(10, 10, 20, 0.55)',
  },
  glass: {
    surface: 'rgba(255, 255, 255, 0.7)',
    surfaceHover: 'rgba(255, 255, 255, 0.85)',
    surfaceStrong: 'rgba(255, 255, 255, 0.92)',
    backdrop: 'blur(24px) saturate(180%)',
  },
  chrome: {
    red: '#ff5f56',
    yellow: '#ffbd2e',
    green: '#27c93f',
  },
  canvas: {
    from: '#f4f4f7',
    to: '#e4e4e7',
  },
} as const

export type OfficialPalette = typeof OFFICIAL_PALETTE

/** CSS custom property name for a palette role, e.g. `--palette-brand-primary` */
export function paletteVar(role: string): string {
  return `var(--palette-${role})`
}
