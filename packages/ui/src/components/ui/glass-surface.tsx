'use client'

import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'

export interface GlassSurfaceProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Width of the glass surface in pixels.
   * @default 200
   */
  width?: number
  /**
   * Height of the glass surface in pixels.
   * @default 80
   */
  height?: number
  /** Border radius in pixels. @default 20 */
  borderRadius?: number
  /** Backdrop blur radius in pixels. @default 12 */
  blur?: number
  /** Surface opacity, 0–1. @default 0.25 */
  opacity?: number
  /** Saturation multiplier. @default 1.8 */
  saturation?: number
  /** Forwarded ref. */
  ref?: React.Ref<HTMLDivElement>
}

/**
 * Dependency-free frosted-glass surface with SVG chromatic displacement.
 *
 * Adapted from react-bits GlassSurface and rewritten for the Arch System
 * canonical glass schema. The original uses an inline SVG filter; we keep that
 * but replace the hand-coded fills with --arch-glass-surface / --arch-glass-border
 * tokens and remove the dark-mode fallback (light-only design system).
 *
 * AGENT-TRACE: reverse-engineered from react-bits GlassSurface and refactored
 * to map to Arch glass tokens without Three.js or dark-mode assumptions.
 */
export function GlassSurface({
  ref,
  children,
  className,
  width = 200,
  height = 80,
  borderRadius = 20,
  blur = 12,
  opacity = 0.25,
  saturation = 1.8,
  ...props
}: GlassSurfaceProps) {
  const uniqueId = React.useId().replace(/:/g, '-')
  const filterId = `arch-glass-surface-${uniqueId}`
  const redGradId = `arch-glass-red-${uniqueId}`
  const blueGradId = `arch-glass-blue-${uniqueId}`
  const containerRef = React.useRef<HTMLDivElement>(null)
  const feImageRef = React.useRef<SVGFEImageElement>(null)
  const [supportsSvg, setSupportsSvg] = React.useState(false)

  React.useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

  const generateDisplacementMap = React.useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect()
    const actualWidth = Math.max(1, Math.round(rect?.width ?? width))
    const actualHeight = Math.max(1, Math.round(rect?.height ?? height))
    const edgeSize = Math.min(actualWidth, actualHeight) * 0.035

    const svg = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="transparent"/>
            <stop offset="100%" stop-color="rgba(255,0,0,0.18)"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="transparent"/>
            <stop offset="100%" stop-color="rgba(0,0,255,0.18)"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="rgba(0,0,0,0)"/>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: screen" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${actualHeight - edgeSize * 2}" rx="${borderRadius}" fill="rgba(255,255,255,${opacity})" style="filter:blur(${blur}px)" />
      </svg>
    `
    return `data:image/svg+xml,${encodeURIComponent(svg)}`
  }, [width, height, borderRadius, blur, opacity, redGradId, blueGradId])

  const updateDisplacementMap = React.useCallback(() => {
    feImageRef.current?.setAttribute('href', generateDisplacementMap())
  }, [generateDisplacementMap])

  React.useEffect(() => {
    setSupportsSvg(typeof SVGSVGElement !== 'undefined')
  }, [])

  React.useEffect(() => {
    if (!supportsSvg) return
    updateDisplacementMap()
  }, [supportsSvg, updateDisplacementMap, width, height, borderRadius, blur, opacity])

  React.useEffect(() => {
    if (!supportsSvg || typeof ResizeObserver === 'undefined') return
    const node = containerRef.current
    if (!node) return
    const observer = new ResizeObserver(() => updateDisplacementMap())
    observer.observe(node)
    return () => observer.disconnect()
  }, [supportsSvg, updateDisplacementMap])

  const fallbackStyle: React.CSSProperties = {
    backgroundColor: 'var(--arch-glass-surface)',
    backdropFilter: `blur(${blur}px) saturate(${saturation})`,
    WebkitBackdropFilter: `blur(${blur}px) saturate(${saturation})`,
    border: '1px solid var(--arch-glass-border)',
    boxShadow: 'var(--arch-glass-shadow)',
    borderRadius,
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative flex items-center justify-center overflow-hidden',
        'transition-opacity duration-300 ease-out',
        className
      )}
      style={{ width, height, borderRadius, ...props.style }}
      {...props}
    >
      {supportsSvg ? (
        <>
          <div
            className="absolute inset-0 -z-10 rounded-[inherit]"
            style={{
              backgroundColor: 'var(--arch-glass-surface)',
              backdropFilter: `url(#${filterId}) blur(${blur}px) saturate(${saturation * 100}%)`,
              WebkitBackdropFilter: `url(#${filterId}) blur(${blur}px) saturate(${saturation * 100}%)`,
              border: '1px solid var(--arch-glass-border)',
              boxShadow: 'var(--arch-glass-shadow)',
            }}
          />
          <svg width="0" height="0" className="absolute overflow-hidden" aria-hidden="true">
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
                  in="SourceGraphic"
                  in2={`${filterId}_map`}
                  xChannelSelector="R"
                  yChannelSelector="G"
                  scale={Math.min(width, height) * 0.06}
                />
              </filter>
            </defs>
          </svg>
        </>
      ) : (
        <div className="absolute inset-0 -z-10 rounded-[inherit]" style={fallbackStyle} />
      )}
      <div className="relative z-10 flex h-full w-full items-center justify-center p-2">
        {children}
      </div>
    </div>
  )
}
