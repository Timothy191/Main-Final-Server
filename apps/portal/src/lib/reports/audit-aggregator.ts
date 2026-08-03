import type { SupabaseClient } from '@repo/supabase'

export interface DepartmentAuditMetrics {
  accessControl: {
    checkIns: number
    checkOuts: number
    denials: number
  }
  drilling: {
    totalHoles: number
    totalMeters: number
    totalDowntimeMinutes: number
  }
  production: {
    totalCoalTonnes: number
    totalWasteTonnes: number
  }
}

export interface AuditReportData {
  reportDate: string // YYYY-MM-DD
  generatedAt: string
  metrics: DepartmentAuditMetrics
}

/**
 * Fetch and aggregate compliance metrics for the previous 24 hours relative to targetDate.
 */
export async function getAggregatedAuditData(
  supabase: SupabaseClient,
  targetDate: Date
): Promise<AuditReportData> {
  const targetDateStr = targetDate.toISOString().split('T')[0]!

  // Calculate "yesterday" relative to targetDate
  const yesterday = new Date(targetDate.getTime())
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]!

  // ISO timestamps for the 24-hour window from 08:00 AM yesterday to 08:00 AM today
  const endTimestamp = targetDate.toISOString()
  const startTimestamp = new Date(targetDate.getTime() - 24 * 60 * 60 * 1000).toISOString()

  // 1. Fetch access logs metrics
  const { data: accessLogs, error: accessError } = await supabase
    .from('access_logs')
    .select('access_granted, direction')
    .gte('scanned_at', startTimestamp)
    .lte('scanned_at', endTimestamp)

  if (accessError) {
    throw new Error(`Failed to fetch access logs: ${accessError.message}`)
  }

  let checkIns = 0
  let checkOuts = 0
  let denials = 0

  accessLogs?.forEach((log) => {
    if (!log.access_granted) {
      denials++
    } else if (log.direction === 'IN') {
      checkIns++
    } else if (log.direction === 'OUT') {
      checkOuts++
    }
  })

  // 2. Fetch drilling operations metrics for yesterday
  const { data: drillOps, error: drillError } = await supabase
    .from('drill_operations')
    .select('holes, meters_drilled, production_delays, non_productional_delays, engineering_delays')
    .eq('operation_date', yesterdayStr)

  if (drillError) {
    throw new Error(`Failed to fetch drilling operations: ${drillError.message}`)
  }

  let totalHoles = 0
  let totalMeters = 0
  let totalDowntimeMinutes = 0

  drillOps?.forEach((op) => {
    totalHoles += op.holes || 0
    totalMeters += Number(op.meters_drilled || 0)
    totalDowntimeMinutes +=
      Number(op.production_delays || 0) +
      Number(op.non_productional_delays || 0) +
      Number(op.engineering_delays || 0)
  })

  // 3. Fetch production logs metrics for yesterday
  const { data: prodLogs, error: prodError } = await supabase
    .from('production_logs')
    .select('coal_tonnes, waste_tonnes, daily_logs!inner(log_date)')
    .eq('daily_logs.log_date', yesterdayStr)

  if (prodError) {
    throw new Error(`Failed to fetch production logs: ${prodError.message}`)
  }

  let totalCoalTonnes = 0
  let totalWasteTonnes = 0

  prodLogs?.forEach((log) => {
    totalCoalTonnes += Number(log.coal_tonnes || 0)
    totalWasteTonnes += Number(log.waste_tonnes || 0)
  })

  return {
    reportDate: targetDateStr,
    generatedAt: new Date().toISOString(),
    metrics: {
      accessControl: { checkIns, checkOuts, denials },
      drilling: { totalHoles, totalMeters, totalDowntimeMinutes },
      production: { totalCoalTonnes, totalWasteTonnes },
    },
  }
}
