/**
 * @module theme/tailwind/preset
 * Tailwind CSS preset for the Arch System design language.
 *
 * Maps all design tokens (colors, shadows, radii, animations, fonts)
 * to Tailwind utility classes. Import in `tailwind.config.ts`:
 * ```ts
 * import archTheme from "@repo/theme/tailwind/preset";
 * export default archTheme;
 * ```
 */
import type { Config } from 'tailwindcss'

const archTheme: Config = {
  content: [
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/theme/src/**/*.{ts,tsx}',
    '../../node_modules/@tremor/**/*.{js,ts,jsx,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'var(--font-sans)',
          'var(--font-inter)',
          'var(--font-outfit)',
          'system-ui',
          'sans-serif',
        ],
        display: ['var(--font-display)', 'Orbitron', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      colors: {
        // Arch palette — direct CSS variable references
        arch0: 'var(--arch0)',
        arch1: 'var(--arch1)',
        arch2: 'var(--arch2)',
        arch3: 'var(--arch3)',
        arch4: 'var(--arch4)',
        arch5: 'var(--arch5)',
        arch6: 'var(--arch6)',
        arch7: 'var(--arch7)',
        arch8: 'var(--arch8)',
        arch9: 'var(--arch9)',
        arch10: 'var(--arch10)',
        arch11: 'var(--arch11)',
        arch12: 'var(--arch12)',
        arch13: 'var(--arch13)',
        arch14: 'var(--arch14)',
        arch15: 'var(--arch15)',

        // Semantic aliases
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',

        'overlay-dim': 'var(--overlay-dim)',
        'overlay-subtle': 'var(--overlay-subtle)',
        'overlay-medium': 'var(--overlay-medium)',

        'border-subtle': 'var(--border-subtle)',
        'chrome-border': 'var(--chrome-border)',
        'border-default': 'var(--border-default)',
        'border-emphasis': 'var(--border-emphasis)',

        'text-muted': 'var(--text-muted)',
        'text-secondary': 'var(--text-secondary)',
        'text-body': 'var(--text-body)',
        'text-primary': 'var(--text-primary)',
        'text-heading': 'var(--text-heading)',

        // @deprecated Tier 3 aliases — removed after migration to accent-blue
        // accent-cyan, accent-indigo, accent-violet → use accent-blue
        // accent-alert → use accent-red

        // Corporate Brand Colors
        'brand-blue': 'var(--arch-brand-blue)',
        'brand-blue-hover': 'var(--arch-brand-blue-hover)',

        // macOS system accent colors
        'accent-charcoal': 'var(--accent-charcoal)',
        'accent-blue': 'var(--accent-blue)',
        'accent-red': 'var(--accent-red)',
        'accent-green': 'var(--accent-green)',
        'accent-amber': 'var(--accent-amber)',
        'accent-emerald': 'var(--accent-green)',

        // macOS traffic light colors
        'mac-red': 'var(--mac-red)',
        'mac-yellow': 'var(--mac-yellow)',
        'mac-green': 'var(--mac-green)',

        // Glass / vibrancy surface colors
        'glass-surface': 'var(--glass-surface)',
        'glass-surface-hover': 'var(--glass-surface-hover)',
        'glass-surface-strong': 'var(--glass-surface-strong)',
        'glass-border': 'var(--glass-border)',
        'glass-video': 'var(--glass-video-surface)',
        'glass-video-hover': 'var(--glass-video-surface-hover)',
        'glass-dark': 'var(--dark-glass-surface)',
        'glass-dark-hover': 'var(--dark-glass-surface-hover)',
        'text-on-glass': 'var(--text-on-glass)',
        'text-on-glass-muted': 'var(--text-on-glass-muted)',
        'text-on-glass-video': 'var(--text-on-glass-video)',
        'text-on-glass-video-muted': 'var(--text-on-glass-video-muted)',
        'text-on-dark-glass': 'var(--text-on-dark-glass)',
        'text-on-dark-glass-muted': 'var(--text-on-dark-glass-muted)',
        vibrancy: 'var(--vibrancy-surface)',

        // Arch semantic namespace — complete official palette coverage
        arch: {
          surface: {
            canvas: 'var(--palette-surface-canvas)',
            primary: 'var(--palette-surface-elevated)',
            secondary: 'var(--palette-surface-elevated)',
            tertiary: 'var(--palette-surface-sunken)',
            pressed: 'var(--palette-surface-pressed)',
            chrome: 'var(--palette-surface-chrome)',
            vibrancy: 'var(--palette-surface-vibrancy)',
          },
          text: {
            primary: 'var(--palette-text-primary)',
            secondary: 'var(--palette-text-secondary)',
            tertiary: 'var(--palette-text-tertiary)',
            muted: 'var(--palette-text-muted)',
            inverted: 'var(--palette-text-inverted)',
            'on-glass': 'var(--palette-text-on-glass)',
            'on-glass-muted': 'var(--palette-text-on-glass-muted)',
          },
          border: {
            subtle: 'var(--palette-border-subtle)',
            default: 'var(--palette-border-default)',
            emphasis: 'var(--palette-border-emphasis)',
            strong: 'var(--palette-border-strong)',
            glass: 'var(--palette-border-glass)',
            focus: 'var(--palette-border-focus)',
          },
          accent: {
            brand: 'var(--palette-brand-primary)',
            'brand-hover': 'var(--palette-brand-primary-hover)',
            charcoal: 'var(--palette-brand-primary)',
            blue: 'var(--palette-brand-primary)',
            red: 'var(--palette-semantic-danger)',
            green: 'var(--palette-semantic-success)',
            amber: 'var(--palette-semantic-warning)',
            mint: 'var(--palette-semantic-success)',
          },
          glass: {
            surface: 'var(--palette-glass-surface)',
            'surface-hover': 'var(--palette-glass-surface-hover)',
            'surface-strong': 'var(--palette-glass-surface-strong)',
            backdrop: 'var(--palette-glass-backdrop)',
          },
          chrome: {
            red: 'var(--palette-chrome-red)',
            yellow: 'var(--palette-chrome-yellow)',
            green: 'var(--palette-chrome-green)',
          },
        },

        // Official palette — direct CSS variable references for global branding
        palette: {
          neutral: {
            0: 'var(--palette-neutral-0)',
            50: 'var(--palette-neutral-50)',
            100: 'var(--palette-neutral-100)',
            200: 'var(--palette-neutral-200)',
            300: 'var(--palette-neutral-300)',
            400: 'var(--palette-neutral-400)',
            500: 'var(--palette-neutral-500)',
            600: 'var(--palette-neutral-600)',
            900: 'var(--palette-neutral-900)',
            950: 'var(--palette-neutral-950)',
          },
          brand: {
            primary: 'var(--palette-brand-primary)',
            'primary-hover': 'var(--palette-brand-primary-hover)',
            'on-primary': 'var(--palette-brand-on-primary)',
          },
          semantic: {
            success: 'var(--palette-semantic-success)',
            warning: 'var(--palette-semantic-warning)',
            danger: 'var(--palette-semantic-danger)',
            info: 'var(--palette-semantic-info)',
          },
          surface: {
            canvas: 'var(--palette-surface-canvas)',
            elevated: 'var(--palette-surface-elevated)',
            sunken: 'var(--palette-surface-sunken)',
            chrome: 'var(--palette-surface-chrome)',
          },
          border: {
            subtle: 'var(--palette-border-subtle)',
            default: 'var(--palette-border-default)',
            glass: 'var(--palette-border-glass)',
          },
          text: {
            primary: 'var(--palette-text-primary)',
            secondary: 'var(--palette-text-secondary)',
            muted: 'var(--palette-text-muted)',
          },
          glass: {
            surface: 'var(--palette-glass-surface)',
            backdrop: 'var(--palette-glass-backdrop)',
          },
        },

        // DESIGN.md Color System Tokens (Phase I Promotion)
        'color-bg-base': 'var(--color-bg-base)',
        'color-bg-elevated': 'var(--color-bg-elevated)',
        'color-bg-sunken': 'var(--color-bg-sunken)',
        'color-border-subtle': 'var(--color-border-subtle)',
        'color-border-focus': 'var(--color-border-focus)',
        'color-text-primary': 'var(--color-text-primary)',
        'color-text-secondary': 'var(--color-text-secondary)',
        'color-text-tertiary': 'var(--color-text-tertiary)',
        'color-action-primary': 'var(--color-action-primary)',
        'color-action-primary-hover': 'var(--color-action-primary-hover)',
        'color-status-positive': 'var(--color-status-positive)',
        'color-status-warning': 'var(--color-status-warning)',
        'color-status-danger': 'var(--color-status-danger)',
        'color-accent-subtle': 'var(--color-accent-subtle)',

        // Backdrop token
        'backdrop-dim': 'var(--backdrop-dim)',

        // shadcn/ui HSL variable colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'hsl(var(--warning-foreground))',
        },
        danger: {
          DEFAULT: 'var(--danger)',
          foreground: 'hsl(var(--danger-foreground))',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'hsl(var(--info-foreground))',
        },

        // Tremor chart component colors
        tremor: {
          brand: {
            faint: 'hsl(var(--tremor-brand-faint))',
            muted: 'hsl(var(--tremor-brand-muted))',
            subtle: 'hsl(var(--tremor-brand-subtle))',
            DEFAULT: 'hsl(var(--tremor-brand-default))',
            emphasis: 'hsl(var(--tremor-brand-emphasis))',
            inverted: 'hsl(var(--tremor-brand-inverted))',
          },
          background: {
            muted: 'hsl(var(--tremor-background-muted))',
            subtle: 'hsl(var(--tremor-background-subtle))',
            DEFAULT: 'hsl(var(--tremor-background-default))',
            emphasis: 'hsl(var(--tremor-background-emphasis))',
          },
          border: {
            DEFAULT: 'hsl(var(--tremor-border-default))',
          },
          ring: {
            DEFAULT: 'hsl(var(--tremor-ring-default))',
          },
          content: {
            subtle: 'hsl(var(--tremor-content-subtle))',
            DEFAULT: 'hsl(var(--tremor-content-default))',
            emphasis: 'hsl(var(--tremor-content-emphasis))',
            strong: 'hsl(var(--tremor-content-strong))',
            inverted: 'hsl(var(--tremor-content-inverted))',
          },
        },
        hud: {
          DEFAULT: 'var(--color-bg-hud)',
          border: 'var(--color-border-hud)',
          'text-primary': 'var(--color-text-hud-primary)',
          'text-secondary': 'var(--color-text-hud-secondary)',
          'text-tertiary': 'var(--color-text-hud-tertiary)',
        },

        // Department-specific accent colors
        dept: {
          drilling: 'var(--dept-drilling)',
          production: 'var(--dept-production)',
          'access-control': 'var(--dept-access-control)',
          'access-card-actions': 'var(--dept-access-card-actions)',
          engineering: 'var(--dept-engineering)',
          'control-room': 'var(--dept-control-room)',
          safety: 'var(--dept-safety)',
          training: 'var(--dept-training)',
          satellite: 'var(--dept-satellite)',
          admin: 'var(--dept-admin)',
        },
      },
      opacity: {
        'focus-dim': 'var(--opacity-focus-dim)',
        disabled: 'var(--opacity-disabled)',
        hover: 'var(--opacity-hover)',
      },
      blur: {
        'focus-dim': 'var(--blur-focus-dim)',
      },
      backdropBlur: {
        xl: '24px',
        'focus-dim': 'var(--blur-focus-dim)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        window: 'var(--shadow-window)',
        'glow-blue': 'var(--shadow-glow-blue)',
        'diffusion-sm': 'var(--shadow-diffusion-sm)',
        'diffusion-md': 'var(--shadow-diffusion-md)',
        'diffusion-lg': 'var(--shadow-diffusion-lg)',
        'diffusion-xl': 'var(--shadow-diffusion-xl)',
        'diffusion-cyan': '0 0 20px rgba(28, 28, 30, 0.18), 0 0 60px rgba(28, 28, 30, 0.06)',
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        elevated: 'var(--shadow-elevated)',
        'glow-primary': 'var(--shadow-glow-primary)',
        'glow-electric': 'var(--shadow-glow-electric)',
        'glow-mint': 'var(--shadow-glow-mint)',
        // Tremor-compatible shadows
        'tremor-input': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'tremor-card': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'tremor-dropdown': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        // Custom volumetric glass shadows
        'glass-depth':
          '0 1px 2px rgba(0,0,0,0.02), 0 4px 12px rgba(0,0,0,0.03), 0 12px 32px rgba(0,0,0,0.03), 0 20px 48px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.7)',
        'glass-depth-hover':
          '0 2px 4px rgba(0,0,0,0.02), 0 6px 16px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.04), 0 28px 64px rgba(0,0,0,0.05), inset 0 0.5px 0 rgba(255,255,255,0.7), inset 0 -0.5px 0 rgba(255,255,255,0.15)',
        'glass-depth-active':
          '0 1px 2px rgba(0,0,0,0.02), 0 2px 6px rgba(0,0,0,0.03), 0 6px 16px rgba(0,0,0,0.03), 0 10px 24px rgba(0,0,0,0.04), inset 0 0.5px 0 rgba(255,255,255,0.7), inset 0 -0.5px 0 rgba(255,255,255,0.15)',
        'liquid-depth-hover':
          '0 4px 6px -1px rgba(0,0,0,0.01), 0 24px 48px -8px rgba(0,0,0,0.03), 0 48px 96px -12px rgba(0,0,0,0.05)',
      },
      transitionTimingFunction: {
        glass: 'cubic-bezier(0.2, 0, 0, 1)',
        'liquid-inertia': 'cubic-bezier(0.25, 1.15, 0.45, 1)',
        'ease-out-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      fontSize: {
        'tremor-label': ['0.75rem', { lineHeight: '1rem' }],
        'tremor-default': ['0.875rem', { lineHeight: '1.25rem' }],
        'tremor-title': ['1.125rem', { lineHeight: '1.75rem' }],
        'tremor-metric': ['1.875rem', { lineHeight: '2.25rem' }],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        card: 'var(--radius-card)',
        full: 'var(--radius-full)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(10%, 10%) scale(1.1)' },
          '66%': { transform: 'translate(-5%, 15%) scale(0.9)' },
        },
        'float-delayed': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1.1)' },
          '33%': { transform: 'translate(-10%, -10%) scale(0.9)' },
          '66%': { transform: 'translate(5%, -15%) scale(1)' },
        },
        'grid-drift': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '40px 40px' },
        },
        'pulse-slow': {
          '0%, 100%': { opacity: '0.3', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.2)' },
        },
        'ken-burns': {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '50%': { transform: 'scale(1.08) translate(-1%, -1%)' },
          '100%': { transform: 'scale(1) translate(0, 0)' },
        },
        'window-open': {
          from: { opacity: '0', transform: 'scale(0.96) translateY(4px)' },
          to: { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        'traffic-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'gradient-shift': {
          '0%, 100%': { opacity: '0.2', transform: 'translateX(-5%)' },
          '50%': { opacity: '0.4', transform: 'translateX(5%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.15', transform: 'scale(1)' },
          '50%': { opacity: '0.25', transform: 'scale(1.05)' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '25%': { transform: 'translate(10px, -20px)' },
          '50%': { transform: 'translate(-15px, -40px)' },
          '75%': { transform: 'translate(20px, -60px)' },
        },
        'liquid-swell': {
          '0%, 100%': { borderRadius: '20px' },
          '50%': { borderRadius: '24px 18px 26px 16px' },
        },
        'liquid-sheen': {
          '0%': { transform: 'translate3d(-100%, -100%, 0) rotate(25deg)' },
          '100%': { transform: 'translate3d(100%, 100%, 0) rotate(25deg)' },
        },
        'mercury-flow': {
          '0%, 100%': {
            transform: 'translate3d(0, 0, 0) scale(1)',
            filter: 'saturate(1)',
          },
          '50%': {
            transform: 'translate3d(1px, -2px, 0) scale(1.02)',
            filter: 'saturate(1.15)',
          },
        },
        'status-glow-pulse': {
          '0%, 100%': {
            boxShadow: '0 0 8px rgba(28, 28, 30, 0.2), inset 0 0 4px rgba(28, 28, 30, 0.1)',
          },
          '50%': {
            boxShadow: '0 0 20px rgba(28, 28, 30, 0.6), inset 0 0 10px rgba(28, 28, 30, 0.3)',
          },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap, 1.5rem)))' },
        },
        'marquee-vertical': {
          from: { transform: 'translateY(0)' },
          to: { transform: 'translateY(calc(-100% - var(--gap, 1.5rem)))' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.8s ease-out 0.5s both',
        'float-slow': 'float-slow 20s infinite ease-in-out',
        'float-delayed': 'float-delayed 25s infinite ease-in-out',
        'grid-drift': 'grid-drift 10s linear infinite',
        'pulse-slow': 'pulse-slow 15s infinite ease-in-out',
        'ken-burns': 'ken-burns 20s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 6s ease-in-out infinite',
        float: 'float 15s ease-in-out infinite',
        'window-open': 'window-open 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        'traffic-pulse': 'traffic-pulse 2s ease-in-out infinite',
        'liquid-swell': 'liquid-swell 8s ease-in-out infinite',
        'liquid-sheen': 'liquid-sheen 6s cubic-bezier(0.2, 0, 0, 1) infinite',
        'mercury-flow': 'mercury-flow 12s ease-in-out infinite',
        'status-glow': 'status-glow-pulse 3s ease-in-out infinite',
        marquee: 'marquee var(--duration, 40s) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration, 40s) linear infinite',
      },
    },
  },
  plugins: [],
}

export default archTheme
