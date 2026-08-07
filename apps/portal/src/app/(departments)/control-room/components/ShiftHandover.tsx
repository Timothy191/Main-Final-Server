'use client'

import { useState } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { toast } from 'sonner'
import { ClipboardCheck, FileSignature, CheckSquare, Loader2 } from 'lucide-react'

export function ShiftHandover() {
  const [operatorName, setOperatorName] = useState('')
  const [signingEmployeeId, setSigningEmployeeId] = useState('')
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [generatedReport, setGeneratedReport] = useState<any>(null)

  // Checklist states
  const [checklist, setChecklist] = useState({
    scadaHealthy: false,
    noCriticalAlarms: false,
    downtimesLogged: false,
    handoverNotesPosted: false,
  })

  const toggleCheck = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const allChecked = Object.values(checklist).every(Boolean)

  const handleSignOff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!operatorName.trim()) {
      toast.error('Operator name is required to sign off.')
      return
    }

    if (!allChecked) {
      toast.error('Please complete all shift handover checklist items.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportName: `Shift-Handover-${operatorName.trim().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`,
          reportType: 'shift-handover',
          signedBy: signingEmployeeId || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setGeneratedReport(data.report)
        toast.success('Shift handover report compiled & signed off successfully!')
      } else {
        toast.error('Failed to compile handover report.')
      }
    } catch (err) {
      toast.error('Connection error compiling report.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Shift Handover Protocol & Sign-Off
        </h3>
      </div>

      {generatedReport ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4">
          <div className="p-3 bg-accent-green/10 rounded-full text-accent-green animate-bounce">
            <ClipboardCheck className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-arch-text-primary">Shift Handover Complete!</h4>
            <p className="text-xs text-arch-text-muted mt-1">
              The shift report has been archived and locked.
            </p>
          </div>
          <div className="p-3 rounded bg-white/5 border border-white/10 w-full text-left text-xs font-mono space-y-1">
            <div className="flex justify-between">
              <span className="text-arch-text-muted">Report ID:</span>
              <span className="text-arch-text-secondary">{generatedReport.id.slice(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-arch-text-muted">Name:</span>
              <span className="text-arch-text-secondary">{generatedReport.report_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-arch-text-muted">Archive Path:</span>
              <span className="text-arch-text-secondary truncate max-w-[180px]">
                {generatedReport.file_path}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-arch-text-muted">Tonnage Today:</span>
              <span className="text-arch-text-secondary">
                {generatedReport.metrics.totalTonnageToday} t
              </span>
            </div>
          </div>
          <button
            onClick={() => setGeneratedReport(null)}
            className="text-xs text-red-400 hover:text-red-300 underline font-medium"
          >
            Start New Handover
          </button>
        </div>
      ) : (
        <form onSubmit={handleSignOff} className="flex-1 flex flex-col justify-between">
          {/* Checklist */}
          <div className="space-y-2">
            <p className="text-[10px] uppercase font-bold tracking-wider text-arch-text-muted mb-1">
              Required Protocol Checklist
            </p>
            {[
              {
                key: 'scadaHealthy',
                label: 'Verify all Modbus telemetry systems are active & healthy',
              },
              {
                key: 'noCriticalAlarms',
                label: 'Confirm all active critical SCADA alarms are resolved',
              },
              {
                key: 'downtimesLogged',
                label: 'Verify shift downtime delay logs are saved & complete',
              },
              {
                key: 'handoverNotesPosted',
                label: 'Post handover observations in shift communication log',
              },
            ].map((item) => (
              <div
                key={item.key}
                onClick={() => toggleCheck(item.key as keyof typeof checklist)}
                className="flex items-start gap-2.5 p-2 rounded hover:bg-white/5 border border-transparent hover:border-white/5 cursor-pointer transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center mt-0.5 transition-colors ${
                    checklist[item.key as keyof typeof checklist]
                      ? 'bg-red-600 border-red-500 text-white'
                      : 'border-arch-border bg-arch-surface/50 text-transparent'
                  }`}
                >
                  <CheckSquare className="w-3 h-3" />
                </div>
                <span className="text-xs text-arch-text-secondary leading-tight select-none">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Form Fields */}
          <div className="space-y-3 pt-3 border-t border-white/10">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-arch-text-muted uppercase">
                  Outgoing Operator
                </label>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  disabled={loading}
                  className="w-full h-8 rounded border border-arch-border bg-arch-surface/50 px-2 text-xs text-arch-text-primary focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-arch-text-muted uppercase">
                  Employee ID (Signature)
                </label>
                <input
                  type="text"
                  placeholder="UUID (optional)"
                  value={signingEmployeeId}
                  onChange={(e) => setSigningEmployeeId(e.target.value)}
                  disabled={loading}
                  className="w-full h-8 rounded border border-arch-border bg-arch-surface/50 px-2 text-xs text-arch-text-primary focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !allChecked}
              className={`w-full h-9 rounded text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                allChecked
                  ? 'bg-red-600 hover:bg-red-700 active:scale-[0.98]'
                  : 'bg-white/5 border border-white/10 text-arch-text-muted cursor-not-allowed'
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileSignature className="w-4 h-4" />
              )}
              <span>Generate Report & Sign Off Shift</span>
            </button>
          </div>
        </form>
      )}
    </GlassCard>
  )
}
