'use client'

import * as React from 'react'
import { cn } from '@repo/ui/lib/utils'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeWidth?: number
  className?: string
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const id = React.useId()

  if (data.length < 2) return null

  const lineGradId = `sparkLineGrad-${id}`
  const areaGradId = `sparkAreaGrad-${id}`
  const glowId = `sparkGlow-${id}`

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((value - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const pathD = `M${points.join(' L')}`
  const trend = data[data.length - 1]! - data[0]!

  // Light-theme accents (login/hub parity) — mint up, coral down
  const strokeColor = trend >= 0 ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)'

  const endX = points[points.length - 1]?.split(',')[0] ?? '0'
  const endY = points[points.length - 1]?.split(',')[1] ?? '0'

  // Create an area path closed at the bottom of the svg
  const areaPathD = `${pathD} L${endX},${height} L0,${height} Z`

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('shrink-0 overflow-visible', className)}
      aria-hidden="true"
    >
      <defs>
        {/* Horizontal gradient for line path */}
        <linearGradient id={lineGradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.5} />
          <stop offset="85%" stopColor={strokeColor} stopOpacity={0.9} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={1} />
        </linearGradient>
        {/* Vertical gradient for area fill */}
        <linearGradient id={areaGradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.4} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="1.5"
            floodColor={strokeColor}
            floodOpacity={0.6}
          />
        </filter>
        {/* Glowing refraction filter for the line path */}
        <filter id={`sparkGlowPath-${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.0" result="blur" />
          <feComponentTransfer in="blur" result="boost">
            <feFuncA type="linear" slope="0.45" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="boost" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <style>{`
          @keyframes spark-pulse-${id} {
            0%, 100% { r: 1.5; opacity: 0.9; }
            50% { r: 3; opacity: 0.4; }
          }
        `}</style>
      </defs>
      {/* Crisp high-precision telemetry grid lines */}
      <line
        x1="0"
        y1={height - 0.5}
        x2={width}
        y2={height - 0.5}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="0.5"
        shapeRendering="crispEdges"
      />
      <line
        x1="0"
        y1={height / 2}
        x2={width}
        y2={height / 2}
        stroke="rgba(0,0,0,0.03)"
        strokeWidth="0.5"
        shapeRendering="crispEdges"
      />
      <line
        x1="0"
        y1={0.5}
        x2={width}
        y2={0.5}
        stroke="rgba(0,0,0,0.03)"
        strokeWidth="0.5"
        shapeRendering="crispEdges"
      />
      <line
        x1="0.5"
        y1="0"
        x2="0.5"
        y2={height}
        stroke="rgba(0,0,0,0.08)"
        strokeWidth="0.5"
        shapeRendering="crispEdges"
      />

      {/* Vertical gradient area under the line */}
      <path
        d={areaPathD}
        fill={`url(#${areaGradId})`}
        className="pointer-events-none"
        shapeRendering="auto"
      />
      {/* Ultra-thin sparkline with refracted glow */}
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${lineGradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.95}
        filter={`url(#sparkGlowPath-${id})`}
        shapeRendering="geometricPrecision"
      />
      {/* Hardware-like glowing end node */}
      <g filter={`url(#${glowId})`}>
        <circle
          cx={endX}
          cy={endY}
          r={1.5}
          fill={strokeColor}
          opacity={0.9}
          style={{
            animation: `spark-pulse-${id} 2s ease-in-out infinite`,
            transformOrigin: `${endX}px ${endY}px`,
          }}
        />
      </g>
    </svg>
  )
}
