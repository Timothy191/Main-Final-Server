import { createServerSupabaseClient } from '@repo/supabase/server'
import { TriggerButton } from './TriggerButton'
import { GlassCard, PageHeader } from '@repo/ui'
import {
  ShieldCheck,
  FileDown,
  Activity,
  ClipboardCheck,
  AlertTriangle,
  Factory,
} from 'lucide-react'
import React from 'react'

export default async function AuditDashboardPage() {
  const supabase = await createServerSupabaseClient()

  // Fetch past generated audit reports
  const { data: reports, error } = await supabase
    .from('generated_reports')
    .select('*')
    .eq('shift_type', 'daily_audit')
    .order('report_date', { ascending: false })
    .limit(15)

  const latestReport = reports?.[0]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const latestData = latestReport?.report_data as any

  return (
    <div className="space-y-8 max-w-6xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader title="Compliance Audit Dashboard" showDate={true} />
        <div className="flex items-center gap-3">
          <TriggerButton />
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
              Access Check-Ins
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {latestData?.metrics?.accessControl?.checkIns ?? 'N/A'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
              Access Denials
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {latestData?.metrics?.accessControl?.denials ?? 'N/A'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
              Meters Drilled
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {latestData?.metrics?.drilling?.totalMeters
                ? `${latestData.metrics.drilling.totalMeters.toFixed(1)}m`
                : 'N/A'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Activity className="w-5 h-5" />
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-semibold uppercase tracking-wider block">
              Coal Produced
            </span>
            <span className="text-2xl font-bold text-slate-800 mt-2 block">
              {latestData?.metrics?.production?.totalCoalTonnes
                ? `${latestData.metrics.production.totalCoalTonnes.toFixed(1)}t`
                : 'N/A'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Factory className="w-5 h-5" />
          </div>
        </GlassCard>
      </div>

      {/* Main Logs Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ClipboardCheck className="w-5 h-5 text-blue-600" />
          Daily Audit & Compliance History
        </h2>

        {error && (
          <GlassCard className="p-6 border-red-200 bg-red-50/50">
            <p className="text-sm text-red-600">
              Failed to load compliance records: {error.message}
            </p>
          </GlassCard>
        )}

        <div className="space-y-3">
          {reports && reports.length > 0 ? (
            reports.map((report) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const data = report.report_data as any
              return (
                <GlassCard
                  key={report.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                        {report.report_date}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Generated{' '}
                        {new Date(report.generated_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-[13px]">
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                          Access Badging
                        </span>
                        <span className="font-semibold text-slate-700">
                          {data?.metrics?.accessControl?.checkIns || 0} In /{' '}
                          {data?.metrics?.accessControl?.denials || 0} Denials
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                          Drilling Performance
                        </span>
                        <span className="font-semibold text-slate-700">
                          {data?.metrics?.drilling?.totalHoles || 0} holes /{' '}
                          {data?.metrics?.drilling?.totalMeters?.toFixed(1) || 0}m
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                          Drill Downtime
                        </span>
                        <span className="font-semibold text-slate-700">
                          {data?.metrics?.drilling?.totalDowntimeMinutes || 0} min
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] uppercase tracking-wider">
                          Production Output
                        </span>
                        <span className="font-semibold text-slate-700">
                          {data?.metrics?.production?.totalCoalTonnes?.toFixed(1) || 0}t Coal /{' '}
                          {data?.metrics?.production?.totalWasteTonnes?.toFixed(1) || 0}t Waste
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:justify-end">
                    {report.pdf_url ? (
                      <a
                        href={report.pdf_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm rounded-lg transition"
                      >
                        <FileDown className="w-4 h-4" />
                        Download PDF
                      </a>
                    ) : (
                      <span className="text-slate-400 text-sm italic">PDF unavailable</span>
                    )}
                  </div>
                </GlassCard>
              )
            })
          ) : (
            <GlassCard className="p-12 text-center text-slate-400">
              No daily compliance audit reports have been generated yet. Use the button above to
              execute a manual audit run.
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  )
}
