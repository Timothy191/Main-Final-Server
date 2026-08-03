'use client'

import dynamic from 'next/dynamic'
import type { TrendDataPoint } from './ProductionTrend'

const ProductionTrendInner = dynamic(
  () => import('./ProductionTrend').then((m) => m.ProductionTrend),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse bg-arch-surface-tertiary rounded-xl" />,
  }
)

interface ProductionTrendProps {
  data: TrendDataPoint[]
}

export function ProductionTrend({ data }: ProductionTrendProps) {
  return <ProductionTrendInner data={data} />
}
