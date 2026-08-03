'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@repo/ui/lib/utils'

interface AnimatedNumberProps {
  value: number
  className?: string
  duration?: number
  prefix?: string
  suffix?: string
}

export function AnimatedNumber({
  value,
  className,
  duration = 0.5,
  prefix = '',
  suffix = '',
}: AnimatedNumberProps) {
  const digits = value.toString().split('')

  return (
    <div className={cn('flex items-center tabular-nums', className)}>
      {prefix && <span>{prefix}</span>}
      <div className="flex relative items-center">
        {digits.map((digit, index) => (
          <SingleDigit
            key={`${index}-${digits.length}`}
            value={digit}
            index={index}
            duration={duration}
          />
        ))}
      </div>
      {suffix && <span>{suffix}</span>}
    </div>
  )
}

function SingleDigit({
  value,
  index,
  duration,
}: {
  value: string
  index: number
  duration: number
}) {
  const [height, setHeight] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isSymbol = isNaN(Number.parseInt(value))

  useEffect(() => {
    if (containerRef.current) {
      setHeight(getComputedStyle(containerRef.current).height)
    }
  }, [])

  if (isSymbol) {
    return (
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        className="inline-block"
      >
        {value}
      </motion.span>
    )
  }

  return (
    <div
      className="relative"
      style={{
        height: height || 'auto',
        overflow: 'hidden',
        overflowX: 'clip',
      }}
      ref={containerRef}
    >
      <DigitStrip value={value} eleHeight={height} duration={duration} />
    </div>
  )
}

const zeroToNine = Array.from({ length: 10 }, (_, k) => k)

function DigitStrip({
  eleHeight,
  value,
  duration,
}: {
  eleHeight: string | null
  value: string
  duration: number
}) {
  const heightInNumber = Number.parseInt(eleHeight?.replace('px', '') || '48')
  const prev = useRef(value)

  const currentVal = parseInt(value)
  const prevVal = parseInt(prev.current)
  const diff = prevVal - currentVal
  const dir = currentVal > prevVal ? heightInNumber * diff * -1 : heightInNumber * diff

  useEffect(() => {
    prev.current = value
  }, [value])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={value}
        initial={{ y: dir }}
        animate={{ y: 0 }}
        exit={{ y: 0, transition: { duration: 0.1 } }}
        transition={{ duration, ease: 'easeOut' }}
        className="flex relative flex-col items-center"
      >
        {/* Numbers smaller than current */}
        <span className="flex flex-col items-center absolute bottom-full left-0">
          {zeroToNine
            .filter((val) => val < currentVal)
            .map((val, idx) => (
              <span key={`${val}_${idx}`}>{val}</span>
            ))}
        </span>

        {/* Current Number */}
        <span>{value}</span>

        {/* Numbers larger than current */}
        <span className="flex flex-col items-center absolute top-full left-0">
          {zeroToNine
            .filter((val) => val > currentVal)
            .map((val, idx) => (
              <span key={`${val}_${idx}`}>{val}</span>
            ))}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
