'use client'

import { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'

interface QRCodeSectionProps {
  data: string
  size?: number
}

const qrOptions = {
  width: 160,
  height: 160,
  margin: 4,
  dotsOptions: {
    color: '#1a1a2e',
    type: 'rounded' as const,
  },
  cornersSquareOptions: {
    color: '#2563eb',
    type: 'extra-rounded' as const,
  },
  cornersDotOptions: {
    color: '#1e40af',
    type: 'dot' as const,
  },
  backgroundOptions: {
    color: '#ffffff',
  },
}

export function QRCodeSection({ data, size = 160 }: QRCodeSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)

  useEffect(() => {
    if (!ref.current) return

    if (!qrRef.current) {
      qrRef.current = new QRCodeStyling({
        ...qrOptions,
        width: size,
        height: size,
        data,
      })
      qrRef.current.append(ref.current)
    } else {
      qrRef.current.update({
        ...qrOptions,
        width: size,
        height: size,
        data,
      })
    }
  }, [data, size])

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={ref} className="rounded-xl border border-arch-border-default bg-white p-2" />
      <p className="text-xs text-arch-text-muted font-mono select-all">{data}</p>
    </div>
  )
}
