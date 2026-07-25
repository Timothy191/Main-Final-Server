/**
 * @module features/monitoring/components/ProgressRing
 * Circular progress indicator component
 */

'use client'

import React from 'react'
import { cn } from '@repo/ui/lib/utils'
import { motion } from 'framer-motion'
import type { ProgressRingProps } from '../types'

interface ProgressRingConfig {
  size: number
  strokeWidth: number
  color: string
  bgColor: string
}

const DEFAULT_CONFIG: ProgressRingConfig = {
  size: 80,
  strokeWidth: 8,
  color: '#10b981', // accent-green
  bgColor: 'rgba(255, 255, 255, 0.1)',
}

const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  primary: '#1e293b',
} as const

export function ProgressRing({
  value,
  max = 100,
  size = DEFAULT_CONFIG.size,
  strokeWidth = DEFAULT_CONFIG.strokeWidth,
  color = DEFAULT_CONFIG.color,
  bgColor = DEFAULT_CONFIG.bgColor,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / max) * circumference
  const percentage = Math.round((value / max) * 100)

  // Animation variants
  const variants = {
    hidden: { strokeDashoffset: circumference },
    visible: {
      strokeDashoffset: offset,
      transition: {
        duration: 1,
        ease: 'easeInOut' as const,
      },
    },
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${percentage}%`}
      style={{ width: size, height: size }}
    >
      {/* Background circle */}
      <svg
        className="absolute top-0 left-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial="hidden"
          animate="visible"
          variants={variants}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Percentage text */}
      <span className="absolute text-lg font-bold text-arch11">{percentage}%</span>
    </div>
  )
}

// ProgressRing with status-based colors
export function StatusProgressRing({
  value,
  max = 100,
  status,
  size = 60,
  strokeWidth = 6,
  className,
}: Omit<ProgressRingProps, 'color' | 'bgColor'> & { status: keyof typeof STATUS_COLORS }) {
  const color = STATUS_COLORS[status]

  return (
    <ProgressRing
      value={value}
      max={max}
      size={size}
      strokeWidth={strokeWidth}
      color={color}
      bgColor="rgba(255, 255, 255, 0.05)"
      className={className}
    />
  )
}

// Mini progress ring for table cells
export function MiniProgressRing({
  value,
  max = 100,
  status,
  size = 40,
  strokeWidth = 4,
  showPercentage = false,
  className,
}: Omit<ProgressRingProps, 'color' | 'bgColor'> & {
  status: keyof typeof STATUS_COLORS
  showPercentage?: boolean
}) {
  const color = STATUS_COLORS[status]
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (value / max) * circumference
  const percentage = Math.round((value / max) * 100)

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={`Progress: ${percentage}%`}
      style={{ width: size, height: size }}
    >
      <svg
        className="absolute top-0 left-0"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {showPercentage && (
        <span className="absolute text-xs font-medium text-arch11">{percentage}%</span>
      )}
    </div>
  )
}

export { ProgressRing as default }
