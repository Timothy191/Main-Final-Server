import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import type { Metadata } from 'next'
import { AlertTriangle, CheckCircle2, Clock, ShieldAlert, Eye, Activity } from 'lucide-react'
import {
  getSafetyMetrics,
  getRecentSafetyIncidents,
  type SafetyMetrics,
  type RecentSafetyIncident,
} from './actions'

export const metadata: Metadata = {
  title: 'Safety | Arch OS',
  description: 'Incident logs, compliance and inspections.',
}

/* ------------------------------------------------------------------ */
/*  Server component wrappers for streaming                            */
/* ------------------------------------------------------------------ */

async function SafetyMetricsSection({ deptId }: { deptId: string }) {
  const metrics = await getSafetyMetrics(deptId)
  return <SafetyKPIGrid metrics={metrics} />
}

async function SafetyIncidentsSection({ deptId }: { deptId: string }) {
  const incidents = await getRecentSafetyIncidents(deptId, 8)
  return <SafetyIncidentsTable incidents={incidents} />
}

/* ------------------------------------------------------------------ */
/*  UI sub-components                                                  */
/* ------------------------------------------------------------------ */

function SafetyKPIGrid({ metrics }: { metrics: SafetyMetrics }) {
  const kpis = [
    {
      label: 'Open Incidents',
      value: metrics.openIncidents,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-400/10',
    },
    {
      label: 'Resolved This Month',
      value: metrics.resolvedThisMonth,
      icon: CheckCircle2,
      color: 'text-accent-green',
      bg: 'bg-accent-green/10',
    },
    {
      label: 'Under Investigation',
      value: metrics.underInvestigation,
      icon: Eye,
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10',
    },
    {
      label: 'Lost-Time Incidents',
      value: metrics.lostTimeIncidents,
      icon: Clock,
      color: 'text-orange-400',
      bg: 'bg-orange-400/10',
    },
    {
      label: 'Near-Miss Reports',
      value: metrics.nearMissCount,
      icon: ShieldAlert,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
    },
    {
      label: 'Incidents Today',
      value: metrics.incidentsTodayCount,
      icon: Activity,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon
        return (
          <GlassCard key={kpi.label}>
            <div className="flex items-center gap-3">
              <div className={`p-2 ${kpi.bg} rounded-lg flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                  {kpi.label}
                </p>
                <p
                  className={`text-2xl font-bold mt-0.5 ${
                    kpi.label === 'Open Incidents' && kpi.value > 0
                      ? 'text-red-400'
                      : 'text-arch-text-primary'
                  }`}
                >
                  {kpi.value}
                </p>
              </div>
            </div>
          </GlassCard>
        )
      })}
    </div>
  )
}

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  'near-miss': 'Near Miss',
  incident: 'Incident',
  'lost-time': 'Lost Time',
  'equipment-damage': 'Equipment',
}

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-400/20 text-red-400',
  'under-investigation': 'bg-yellow-400/20 text-yellow-400',
  resolved: 'bg-accent-green/20 text-accent-green',
  closed: 'bg-white/10 text-arch-text-muted',
}

function SafetyIncidentsTable({ incidents }: { incidents: RecentSafetyIncident[] }) {
  return (
    <GlassCard>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Recent Incidents
        </h3>
      </div>
      {incidents.length === 0 ? (
        <p className="text-arch-text-muted text-sm">No incidents recorded. Great work! ✅</p>
      ) : (
        <div className="space-y-2">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="flex items-start justify-between gap-4 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-arch-text-muted">
                    {incident.incidentDate}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      incident.shiftType === 'day'
                        ? 'bg-yellow-400/20 text-yellow-400'
                        : 'bg-blue-400/20 text-blue-400'
                    }`}
                  >
                    {incident.shiftType}
                  </span>
                  <span className="text-xs text-arch-text-muted">
                    {INCIDENT_TYPE_LABELS[incident.incidentType] ?? incident.incidentType}
                  </span>
                </div>
                <p className="text-sm text-arch-text-primary truncate">{incident.description}</p>
                {incident.location && (
                  <p className="text-xs text-arch-text-muted mt-0.5">📍 {incident.location}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    STATUS_STYLES[incident.status] ?? 'bg-white/10 text-arch-text-muted'
                  }`}
                >
                  {incident.status}
                </span>
                {incident.injuredParties > 0 && (
                  <span className="text-xs text-red-400 font-medium">
                    ⚠ {incident.injuredParties} injured
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function SafetyPage() {
  const { deptId } = await getDepartmentContext({ department: 'safety' })

  return (
    <div className="space-y-6">
      {/* KPI cards — cached, streamed independently */}
      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full" />
            ))}
          </div>
        }
      >
        <SafetyMetricsSection deptId={deptId} />
      </Suspense>

      {/* Recent incidents feed — dynamic, streamed independently */}
      <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
        <SafetyIncidentsSection deptId={deptId} />
      </Suspense>
    </div>
  )
}
