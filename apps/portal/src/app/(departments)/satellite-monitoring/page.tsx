import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Satellite, Radio, Eye, Layers3, ArrowRight, Activity } from 'lucide-react'
import { getSatelliteMetrics, type SatelliteMetrics } from './actions'

export const metadata: Metadata = {
  title: 'Satellite Monitoring | Arch OS',
  description: 'SAR/InSAR, hyperspectral and high-resolution imagery.',
}

/* ------------------------------------------------------------------ */
/*  Streaming wrappers                                                 */
/* ------------------------------------------------------------------ */

async function SatelliteMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getSatelliteMetrics(deptId)
  return <SatelliteOverview metrics={metrics} />
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

function SatelliteOverview({ metrics }: { metrics: SatelliteMetrics }) {
  return (
    <div className="space-y-6">
      {/* KPI summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-400/10 rounded-lg flex-shrink-0">
              <Satellite className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Total Sensors
              </p>
              <p className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {metrics.totalSensors}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-green/10 rounded-lg flex-shrink-0">
              <Activity className="w-5 h-5 text-accent-green" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Sensors
              </p>
              <p className="text-2xl font-bold text-accent-green mt-0.5">{metrics.activeSensors}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-400/10 rounded-lg flex-shrink-0">
              <Layers3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Recent Passes
              </p>
              <p className="text-2xl font-bold text-arch-text-primary mt-0.5">
                {metrics.recentLogsCount}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-400/10 rounded-lg flex-shrink-0">
              <Eye className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Last Pass Date
              </p>
              <p className="text-sm font-semibold text-arch-text-primary mt-1">
                {metrics.lastLogDate ?? '—'}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Sensor type breakdown */}
      {metrics.machineTypes.length > 0 && (
        <GlassCard>
          <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider mb-4">
            Sensor Inventory by Type
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {metrics.machineTypes.map(({ type, count, active }) => (
              <div
                key={type}
                className="flex items-center justify-between p-3 rounded-lg bg-white/5"
              >
                <div>
                  <p className="text-sm font-medium text-arch-text-primary">{type}</p>
                  <p className="text-xs text-arch-text-muted mt-0.5">{active} active</p>
                </div>
                <span className="text-lg font-bold text-arch-text-primary">{count}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

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

      {/* Sensor inventory metrics — cached, streamed independently */}
      <Suspense
        fallback={
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-[88px] w-full" />
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
