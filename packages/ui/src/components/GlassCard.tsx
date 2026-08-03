'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '../lib/utils'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  HTMLMotionProps,
} from '../lib/framer-motion-shim'
import { glassVariants, GlassVariant } from '@repo/theme'

export interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
  accent?: 'green' | 'blue' | 'red' | 'cyan' | 'indigo' | 'violet' | 'alert' | 'none'
  variant?: 'default' | 'window' | 'spotlight' | 'glowborder' | 'liquid'
  glassIntensity?: GlassVariant
  title?: string
  padding?: boolean

  // Spotlight variant props
  spotlightColor?: string

  // GlowBorder variant props
  animationDuration?: number
  gradientColors?: string[]
  colorPreset?: 'nature' | 'ocean' | 'sunset' | 'aurora' | 'custom'
  paused?: boolean
  blur?: boolean
  backgroundOpacity?: number

  /** Forwarded ref — used internally by the card */
  ref?: React.Ref<HTMLDivElement>
}

// ─────────────────────────────────────────────────────────────────────────────
// Liquid Glass Refraction Math Helpers (adapted from vaso & liquid-glass-react)
// ─────────────────────────────────────────────────────────────────────────────

function smoothStep(a: number, b: number, t: number): number {
  t = Math.max(0, Math.min(1, (t - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

function getLength(x: number, y: number): number {
  return Math.sqrt(x * x + y * y)
}

function roundedRectSDF(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): number {
  const absWidth = Math.abs(width)
  const absHeight = Math.abs(height)
  const absRadius = Math.abs(radius)

  const qx = Math.abs(x) - absWidth + absRadius
  const qy = Math.abs(y) - absHeight + absRadius
  return Math.min(Math.max(qx, qy), 0) + getLength(Math.max(qx, 0), Math.max(qy, 0)) - absRadius
}

function createDisplacementFragment(
  uv: { x: number; y: number },
  intensity: number,
  depth: number,
  shapeWidth: number,
  shapeHeight: number,
  roundness: number
) {
  const ix = uv.x - 0.5
  const iy = uv.y - 0.5

  const distanceToEdge = roundedRectSDF(ix, iy, shapeWidth, shapeHeight, roundness)
  const displacement = smoothStep(0.8, 0, distanceToEdge - Math.abs(intensity))
  const scaled = smoothStep(0, 1, displacement)

  const depthReverse = depth < 0
  const intensityReverse = intensity < 0
  const widthReverse = shapeWidth < 0
  const heightReverse = shapeHeight < 0

  let effectMultiplier = scaled

  if (depthReverse || intensityReverse) {
    effectMultiplier = 1 - scaled * 0.7
  }

  const finalX = widthReverse ? ix * (2 - effectMultiplier) + 0.5 : ix * effectMultiplier + 0.5
  const finalY = heightReverse ? iy * (2 - effectMultiplier) + 0.5 : iy * effectMultiplier + 0.5

  return {
    x: finalX,
    y: finalY,
  }
}

const generateDisplacementData = (
  width: number,
  height: number,
  intensity = 0.15,
  shapeWidth = 0.35,
  shapeHeight = 0.35,
  depth = 1.2,
  roundness = 0.1
) => {
  const w = Math.floor(width)
  const h = Math.floor(height)
  const data = new Uint8ClampedArray(w * h * 4)
  const rawValues: number[] = []

  let maxScale = 0

  for (let i = 0; i < data.length; i += 4) {
    const x = (i / 4) % w
    const y = Math.floor(i / 4 / w)
    const uv = { x: x / w, y: y / h }

    const pos = createDisplacementFragment(uv, intensity, depth, shapeWidth, shapeHeight, roundness)
    const dx = pos.x * w - x
    const dy = pos.y * h - y

    maxScale = Math.max(maxScale, Math.abs(dx), Math.abs(dy))
    rawValues.push(dx, dy)
  }

  maxScale *= 0.5 // Normalize factor
  if (maxScale === 0) maxScale = 1

  let index = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = (rawValues[index++] ?? 0) / maxScale + 0.5
    const g = (rawValues[index++] ?? 0) / maxScale + 0.5
    data[i] = r * 255
    data[i + 1] = g * 255
    data[i + 2] = 0
    data[i + 3] = 255
  }

  return { data, maxScale }
}

const ACCENT_COLORS = {
  green: 'hover:border-[var(--accent-green)]/40 hover:shadow-card-hover',
  blue: 'hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover',
  red: 'hover:border-[var(--accent-red)]/40 hover:shadow-card-hover',
  cyan: 'hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover',
  indigo: 'hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover',
  violet: 'hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover',
  alert: 'hover:border-[var(--accent-red)]/40 hover:shadow-card-hover',
  none: 'hover:border-black/[0.12] hover:shadow-card-hover',
}

const colorPresets: Record<string, string[]> = {
  nature: [
    '#669900',
    '#88bb22',
    '#99cc33',
    '#aaddaa',
    '#ccee66',
    '#006699',
    '#228888',
    '#3399cc',
    '#55aacc',
    '#669900',
  ],
  ocean: [
    '#006699',
    '#1177aa',
    '#2288bb',
    '#3399cc',
    '#44aadd',
    '#55bbee',
    '#66ccff',
    '#44bbee',
    '#2299cc',
    '#006699',
  ],
  sunset: [
    '#ff6600',
    '#ff7711',
    '#ff8822',
    '#ff9900',
    '#ffaa22',
    '#ffbb44',
    '#ffcc00',
    '#ff9933',
    '#ff7722',
    '#ff6600',
  ],
  aurora: [
    '#00ff87',
    '#22ffaa',
    '#44ffcc',
    '#60efff',
    '#88ddff',
    '#bb99ff',
    '#dd77ee',
    '#ff68f0',
    '#ff55cc',
    '#00ff87',
  ],
  custom: [
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
    'var(--accent-blue)',
  ],
}

function MacTrafficLights() {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-black/[0.06] group-hover/window:opacity-100 opacity-70 transition-opacity" />
      <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-black/[0.06] group-hover/window:opacity-100 opacity-70 transition-opacity" />
      <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-black/[0.06] group-hover/window:opacity-100 opacity-70 transition-opacity" />
    </div>
  )
}

export function GlassCard({
  ref,
  children,
  className,
  hover,
  onClick,
  accent = 'none',
  variant = 'default',
  glassIntensity,
  title,
  padding = true,

  // Spotlight
  spotlightColor = 'rgba(62, 207, 142, 0.1)',

  // GlowBorder
  animationDuration = 4,
  gradientColors,
  colorPreset = 'custom',
  paused = false,
  blur = true,
  backgroundOpacity,

  // Accessibility overrides (extracted so defaults apply when not provided by caller)
  tabIndex: tabIndexProp,
  role: roleProp,
  onKeyDown: onKeyDownProp,

  ...props
}: GlassCardProps) {
  const isWindow = variant === 'window'
  const isSpotlight = variant === 'spotlight'
  const isGlowBorder = variant === 'glowborder'
  const isLiquid = variant === 'liquid'

  const intensityTokens = glassIntensity ? glassVariants[glassIntensity] : null

  const prefersReduced = useReducedMotion()
  const [isTouch, setIsTouch] = useState(false)
  const [hoverCount, setHoverCount] = useState(0)

  useEffect(() => {
    setIsTouch(
      typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    )
  }, [])

  // Spotlight mouse tracking
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const spotlightBg = useMotionTemplate`
    radial-gradient(
      400px circle at ${mouseX}px ${mouseY}px,
      ${spotlightColor},
      transparent 80%
    )
  `

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced || isTouch || !isSpotlight) return
      const rect = e.currentTarget.getBoundingClientRect()
      mouseX.set(e.clientX - rect.left)
      mouseY.set(e.clientY - rect.top)
    },
    [prefersReduced, isTouch, isSpotlight, mouseX, mouseY]
  )

  // GlowBorder colors setup
  const glowColors =
    gradientColors ?? (colorPresets[colorPreset] as string[]) ?? colorPresets.custom

  // Let's determine if glow animation should be paused
  const isGlowPaused = paused || prefersReduced

  // ─────────────────────────────────────────────────────────────────────────
  // Liquid Glass Refraction Engine setup
  // ─────────────────────────────────────────────────────────────────────────
  const filterId = React.useId()
  const localRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const feImageRef = useRef<SVGFEImageElement>(null)
  const feDisplacementMapRef = useRef<SVGFEDisplacementMapElement>(null)

  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (!isLiquid) return
    const target = localRef.current
    if (!target) return

    if (typeof ResizeObserver === 'undefined') {
      // Safely fallback for JSDOM/Node test environments
      setSize({ width: 300, height: 200 })
      return
    }

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width
        const height = entry.borderBoxSize?.[0]?.blockSize ?? entry.contentRect.height
        setSize({ width, height })
      }
    })

    observer.observe(target)
    return () => observer.disconnect()
  }, [isLiquid])

  useEffect(() => {
    if (!isLiquid || size.width === 0 || size.height === 0) return

    const canvas = canvasRef.current
    const feImage = feImageRef.current
    const feDisplacementMap = feDisplacementMapRef.current
    if (!canvas || !feImage || !feDisplacementMap) return

    const canvasDPI = 0.75
    const finalWidth = size.width
    const finalHeight = size.height
    const canvasWidth = Math.max(1, Math.floor(finalWidth * canvasDPI))
    const canvasHeight = Math.max(1, Math.floor(finalHeight * canvasDPI))

    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    try {
      // Calculate normalized SDF shape dimensions to position the refraction border precisely at the edges
      const borderWidth = 12 // width of the edge refraction band in pixels
      const sw = Math.max(0.01, 0.5 - borderWidth / finalWidth)
      const sh = Math.max(0.01, 0.5 - borderWidth / finalHeight)

      // Compute roundness relative to sizes (matching border-radius: 16px)
      const roundness = Math.min(sw, sh, 16 / Math.min(finalWidth, finalHeight))

      const { data, maxScale } = generateDisplacementData(
        canvasWidth,
        canvasHeight,
        0.15, // intensity
        sw,
        sh,
        1.2, // depth
        roundness
      )

      if (data.length >= 4 && typeof ImageData !== 'undefined') {
        const imageData = new ImageData(data, canvasWidth, canvasHeight)
        ctx.putImageData(imageData, 0, 0)

        feImage.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL())
        feImage.setAttribute('width', `${finalWidth}`)
        feImage.setAttribute('height', `${finalHeight}`)

        const finalScale = Math.max(0, (maxScale * 1.2) / canvasDPI)
        feDisplacementMap.setAttribute('scale', finalScale.toString())
        feDisplacementMap.parentElement?.setAttribute('width', `${finalWidth}`)
        feDisplacementMap.parentElement?.setAttribute('height', `${finalHeight}`)
      }
    } catch (err) {
      console.error('Error generating liquid glass displacement:', err)
    }
  }, [isLiquid, size])

  const backdropStyle = isLiquid
    ? {
        WebkitBackdropFilter: `url(#${filterId})${blur ? ' blur(24px)' : ''} saturate(160%) contrast(110%)`,
        backdropFilter: `url(#${filterId})${blur ? ' blur(24px)' : ''} saturate(160%) contrast(110%)`,
      }
    : undefined

  return (
    <motion.div
      ref={(node: HTMLElement | null) => {
        localRef.current = node as HTMLDivElement | null
        if (typeof ref === 'function') {
          ref(node as HTMLDivElement | null)
        } else if (ref) {
          ;(ref as React.MutableRefObject<HTMLDivElement | null>).current =
            node as HTMLDivElement | null
        }
      }}
      whileHover={hover && !prefersReduced && !isLiquid ? { scale: 1.01 } : undefined}
      whileTap={hover && !prefersReduced && !isLiquid ? { scale: 0.995 } : undefined}
      transition={prefersReduced ? { duration: 0 } : { duration: 0.3, ease: [0.2, 0, 0, 1] }}
      tabIndex={tabIndexProp ?? (hover && onClick ? 0 : undefined)}
      role={roleProp ?? (onClick ? 'button' : undefined)}
      onClick={onClick}
      onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onClick()
        }
        onKeyDownProp?.(e)
      }}
      onMouseMove={isSpotlight ? handleMouseMove : undefined}
      onMouseEnter={(e) => {
        if (hover && isLiquid && !prefersReduced) {
          setHoverCount((prev) => prev + 1)
        }
        if (props.onMouseEnter) {
          props.onMouseEnter(e)
        }
      }}
      className={cn(
        // Base classes
        'isolate relative overflow-hidden',
        variant !== 'liquid'
          ? 'transition-all duration-300 ease-glass shadow-glass-depth hover:shadow-glass-depth-hover active:shadow-glass-depth-active'
          : 'shadow-glass-depth',

        variant !== 'liquid' && 'glass-card glass-depth-card border border-arch-border-subtle',

        // Window & Default share standard glass style
        (variant === 'default' || variant === 'window') && [
          'group/window rounded-card backdrop-saturate-[1.3] animate-window-open',
          !intensityTokens && 'backdrop-blur-xl bg-arch-surface-secondary/80',
          hover && ACCENT_COLORS[accent],
        ],

        // Spotlight custom layout style
        variant === 'spotlight' && [
          'group rounded-card backdrop-saturate-[1.3]',
          !intensityTokens && 'backdrop-blur-xl bg-arch-surface-secondary/80',
        ],

        // GlowBorder custom layout style
        variant === 'glowborder' && [
          'backdrop-saturate-[1.3]',
          !intensityTokens && 'backdrop-blur-xl',
        ],

        // Liquid custom layout style
        variant === 'liquid' && [
          'group rounded-card animate-window-open',
          hover && 'liquid-glass-interactive',
        ],

        hover &&
          onClick &&
          'cursor-pointer focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:outline-none',
        (variant === 'default' || variant === 'liquid') && padding && 'p-6',
        className
      )}
      style={
        {
          ...(intensityTokens
            ? {
                backdropFilter: `blur(${intensityTokens.blur})`,
                WebkitBackdropFilter: `blur(${intensityTokens.blur})`,
                backgroundColor: `rgba(255, 255, 255, ${intensityTokens.opacity})`,
              }
            : {}),
          ...(variant === 'glowborder'
            ? {
                '--glow-animation-duration': `${animationDuration}s`,
              }
            : {}),
          ...props.style,
        } as React.CSSProperties
      }
      {...props}
    >
      {/* GlowBorder outer background spinner */}
      {isGlowBorder && (
        <div
          className={cn(
            'absolute inset-[-2px] -z-10 rounded-[inherit]',
            !isGlowPaused && 'animate-[glow-spin_var(--glow-animation-duration)_linear_infinite]'
          )}
          style={{
            background: `conic-gradient(from 0deg, ${glowColors.join(', ')})`,
            filter: 'blur(8px)',
            opacity: 0.7,
          }}
        />
      )}

      {/* GlowBorder inner mask to simulate border */}
      {isGlowBorder && (
        <div className="absolute inset-[1px] -z-[5] rounded-[inherit] bg-white/75 backdrop-blur-2xl" />
      )}

      {/* macOS window title bar */}
      {isWindow && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-arch-border-subtle bg-arch-surface-secondary/60 backdrop-blur-md">
          <MacTrafficLights />
          {title && (
            <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Spotlight dynamic mouse overlay */}
      {isSpotlight && !prefersReduced && !isTouch && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100"
          style={{ background: spotlightBg }}
        />
      )}

      {/* Ambient glass shimmer */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-[1] motion-reduce:hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 30%,
              rgba(255, 255, 255, 0.12) 45%,
              rgba(210, 210, 215, 0.08) 50%,
              rgba(255, 255, 255, 0.12) 55%,
              transparent 70%
            )`,
            transform: 'translateX(-100%) skewX(-12deg)',
            animation: 'glass-shimmer-ambient 12s ease-in-out infinite var(--shimmer-delay, 0s)',
          }}
        />
      </div>

      {/* Hover-only light sweep */}
      {hover && (variant === 'default' || variant === 'window') && (
        <div className="absolute inset-0 translate-x-[-100%] group-hover/window:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}

      {/* Dynamic border highlight facing light source on hover */}
      {hover && (variant === 'default' || variant === 'window') && (
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover/window:opacity-100 transition-opacity duration-500">
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%, transparent 60%, rgba(210,210,215,0.2) 100%)',
            }}
          />
        </div>
      )}

      {/* Liquid Glass Background Layer (separate from content wrapper to prevent font blurring issues) */}
      {isLiquid && (
        <>
          <div
            className="absolute inset-0 -z-10 rounded-[inherit] liquid-glass-pane-rounded pointer-events-none"
            style={{
              ...backdropStyle,
              ...(backgroundOpacity !== undefined
                ? {
                    backgroundImage: `linear-gradient(135deg, rgba(255, 255, 255, ${backgroundOpacity * 1.5}) 0%, rgba(255, 255, 255, ${backgroundOpacity}) 100%), linear-gradient(135deg, rgba(255, 255, 255, 0.75) 0%, rgba(240, 240, 240, 0.15) 50%, rgba(255, 255, 255, 0.45) 100%)`,
                  }
                : {}),
            }}
          />
          <svg
            width="0"
            height="0"
            className="absolute pointer-events-none overflow-hidden"
            aria-hidden="true"
          >
            <defs>
              <filter
                id={filterId}
                filterUnits="userSpaceOnUse"
                colorInterpolationFilters="sRGB"
                x="-10%"
                y="-10%"
                width="120%"
                height="120%"
              >
                <feImage ref={feImageRef} id={`${filterId}_map`} />
                <feDisplacementMap
                  ref={feDisplacementMapRef}
                  in="SourceGraphic"
                  in2={`${filterId}_map`}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  result="displaced"
                />

                {/* Chromatic aberration / dispersion (using offset-isolation-recombine additive blending) */}
                <feOffset dx="1.5" dy="1.5" in="displaced" result="redShift" />
                <feOffset dx="0" dy="0" in="displaced" result="greenCenter" />
                <feOffset dx="-1.5" dy="-1.5" in="displaced" result="blueShift" />
                <feColorMatrix
                  in="redShift"
                  type="matrix"
                  values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="redOnly"
                />
                <feColorMatrix
                  in="greenCenter"
                  type="matrix"
                  values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0"
                  result="greenOnly"
                />
                <feColorMatrix
                  in="blueShift"
                  type="matrix"
                  values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0"
                  result="blueOnly"
                />
                <feComposite in="redOnly" in2="greenOnly" operator="lighter" result="redGreen" />
                <feComposite in="redGreen" in2="blueOnly" operator="lighter" />
              </filter>
            </defs>
          </svg>
          <canvas ref={canvasRef} className="hidden pointer-events-none" aria-hidden="true" />
        </>
      )}

      {/* Liquid Glass Specular Sheen Sweep Layer */}
      {isLiquid && (
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-[5]"
          aria-hidden="true"
        >
          <div
            key={hoverCount}
            className="absolute inset-0 will-change-transform liquid-sheen-sweep"
            style={{
              background:
                'linear-gradient(110deg, transparent 35%, rgba(255, 255, 255, 0.4) 45%, rgba(255, 255, 255, 0.7) 50%, rgba(255, 255, 255, 0.4) 55%, transparent 65%)',
              mixBlendMode: 'screen',
              pointerEvents: 'none',
              animationName: 'liquid-sheen-sweep-mount',
              animationDuration: hoverCount > 0 ? '1.4s' : '1.6s',
              animationDelay: hoverCount > 0 ? '0s' : '0.2s',
              animationTimingFunction: 'cubic-bezier(0.25, 1, 0.5, 1)',
              animationFillMode: 'forwards',
            }}
          />
        </div>
      )}

      {/* Content wrapper */}
      <div
        className={cn('relative z-10 w-full h-full', (isWindow || isLiquid) && padding && 'p-6')}
      >
        {children}
      </div>
    </motion.div>
  )
}
