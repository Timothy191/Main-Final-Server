import { Suspense } from 'react'
import { getDepartmentContext } from '@/lib/dept-context'
import { GlassCard } from '@repo/ui/GlassCard'
import nextDynamic from 'next/dynamic'
import { Skeleton } from '@repo/ui/components/ui/skeleton'
import {
  getAccessControlMetrics,
  getRecentAccessActivity,
  getEntityBadgeStatus,
  getHourlyAccessStats,
  getBadgeStatusDistribution,
} from './actions'

const DashboardKPIGrid = nextDynamic(() => import('./components/DashboardKPIGrid'), {
  loading: () => <Skeleton className="h-[140px] w-full" />,
})
const DashboardChartsRow = nextDynamic(() => import('./components/DashboardChartsRow'), {
  loading: () => <Skeleton className="h-[260px] w-full" />,
})
const DashboardActivityFeed = nextDynamic(() => import('./components/DashboardActivityFeed'), {
  loading: () => <Skeleton className="h-[360px] w-full" />,
})
const DashboardEntityStatus = nextDynamic(() => import('./components/DashboardEntityStatus'), {
  loading: () => <Skeleton className="h-[360px] w-full" />,
})

// Server component wrappers for streaming
async function ChartsRowSection({ deptId, today }: { deptId: string; today: string }) {
  const [hourlyStats, distribution] = await Promise.all([
    getHourlyAccessStats(deptId, today),
    getBadgeStatusDistribution(deptId),
  ])
  return <DashboardChartsRow hourlyStats={hourlyStats} distribution={distribution} />
}

async function ActivityFeedSection({ deptId }: { deptId: string }) {
  const activity = await getRecentAccessActivity(deptId, 8)
  return <DashboardActivityFeed activity={activity} />
}

async function EntityStatusSection({ deptId }: { deptId: string }) {
  const entityStatus = await getEntityBadgeStatus(deptId)
  return <DashboardEntityStatus entityStatus={entityStatus} />
}

export default async function AccessControlDashboardPage() {
  const { deptId, today } = await getDepartmentContext({
    department: 'access-control',
  })

  // Only fetch the metrics for the top row to unblock the initial shell paint
  const metrics = await getAccessControlMetrics(deptId)

  return (
    <div className="space-y-6">
      {/* Top summary row with real DB data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-green/10 rounded-lg">
              <span className="text-accent-green font-bold text-sm">BADGES</span>
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Badges
              </p>
              <p className="text-2xl font-bold text-arch-text-primary mt-1">
                {metrics.activeQrCodes}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-400/10 rounded-lg">
              <span className="text-cyan-400 font-bold text-sm">VISITORS</span>
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Active Visitors
              </p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics.accessEventsToday}</p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-blue/10 rounded-lg">
              <span className="text-accent-blue font-bold text-sm">ALERTS</span>
            </div>
            <div>
              <p className="text-arch-text-muted text-xs font-medium uppercase tracking-wider">
                Alerts Today
              </p>
              <p className="text-2xl font-bold text-accent-blue mt-1">{metrics.deniedToday}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* KPI Bento Grid with real data */}
      <DashboardKPIGrid metrics={metrics} />

      {/* Charts Row with real data */}
      <Suspense fallback={<Skeleton className="h-[260px] w-full" />}>
        <ChartsRowSection deptId={deptId} today={today} />
      </Suspense>

      {/* Bottom Row: Activity Feed + Entity Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
            <ActivityFeedSection deptId={deptId} />
          </Suspense>
        </div>
        <div className="xl:col-span-1">
          <Suspense fallback={<Skeleton className="h-[360px] w-full" />}>
            <EntityStatusSection deptId={deptId} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
