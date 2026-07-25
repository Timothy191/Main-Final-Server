import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Radio, Eye, Layers3, ArrowRight } from 'lucide-react'
import { getSatelliteMetrics } from './actions'
import { getSystemHealth, getAlertMetrics } from './system-health-actions'
import { MonitoringDashboard } from './MonitoringDashboard'

export const metadata: Metadata = {
  title: 'Satellite Monitoring | Arch OS',
  description: 'SAR/InSAR, hyperspectral and high-resolution imagery.',
}

/* ------------------------------------------------------------------ */
/*  Streaming wrappers                                                 */
/* ------------------------------------------------------------------ */

async function SatelliteMetricsSection({ deptId }: { deptId: string }) {
  const [metrics, health, alerts] = await Promise.all([
    getSatelliteMetrics(deptId),
    getSystemHealth(deptId),
    getAlertMetrics(deptId),
  ])
  return <MonitoringDashboard metrics={metrics} health={health} alerts={alerts} />
}

/* ------------------------------------------------------------------ */
/*  UI sub-components                                                  */
/* ------------------------------------------------------------------ */

const PRODUCT_SECTIONS = [
  {
    href: 'satellite-monitoring/sar',
    label: 'SAR / InSAR',
    description: 'Synthetic aperture radar, deformation & displacement mapping',
    icon: Radio,
    color: 'text-blue-400',
    bg: 'from-blue-500/10 to-blue-600/5',
    border: 'border-blue-500/20',
  },
  {
    href: 'satellite-monitoring/hyperspectral',
    label: 'Hyperspectral',
    description: 'Multi-band spectral analysis & material classification',
    icon: Layers3,
    color: 'text-purple-400',
    bg: 'from-purple-500/10 to-purple-600/5',
    border: 'border-purple-500/20',
  },
  {
    href: 'satellite-monitoring/highres',
    label: 'High-Resolution',
    description: 'Optical sub-metre imagery for site inspection',
    icon: Eye,
    color: 'text-cyan-400',
    bg: 'from-cyan-500/10 to-cyan-600/5',
    border: 'border-cyan-500/20',
  },
]

function ProductSectionCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {PRODUCT_SECTIONS.map((section) => {
        const Icon = section.icon
        return (
          <Link key={section.href} href={`/${section.href}`}>
            <div
              className={`relative group p-5 rounded-xl border ${section.border} bg-gradient-to-br ${section.bg} hover:scale-[1.02] transition-all duration-200 cursor-pointer`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <Icon className={`w-5 h-5 ${section.color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-arch-text-muted group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className={`font-semibold ${section.color} mb-1`}>{section.label}</h3>
              <p className="text-arch-text-muted text-xs leading-relaxed">{section.description}</p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SatelliteMonitoringPage() {
  const { deptId } = await getDepartmentContext({ department: 'satellite-monitoring' })

  return (
    <div className="space-y-6">
      {/* Product section navigation cards (static — no data fetch needed) */}
      <ProductSectionCards />

      {/* Sensor inventory metrics & system health — cached, streamed */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full" />
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`ring-${i}`} className="h-[120px] w-full rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-[160px] w-full" />
          </div>
        }
      >
        <SatelliteMetricsSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
