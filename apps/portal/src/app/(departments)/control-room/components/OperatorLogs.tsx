'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@repo/ui/GlassCard'
import { toast } from 'sonner'
import { MessageSquare, Send, User } from 'lucide-react'

interface LogEntry {
  id: string
  operator_name: string
  message: string
  created_at: string
}

export function OperatorLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [operatorName, setOperatorName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/control-room/operator-logs')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.logs || [])
      }
    } catch (e) {
      console.error('Error fetching operator logs:', e)
    }
  }

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 10000) // Poll every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!operatorName.trim() || !message.trim()) {
      toast.error('Both operator name and message are required.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/control-room/operator-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operatorName, message }),
      })

      if (res.ok) {
        toast.success('Log entry added to shift audit trail.')
        setMessage('')
        fetchLogs()
      } else {
        toast.error('Failed to add log entry.')
      }
    } catch (err) {
      toast.error('Connection error adding log.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GlassCard className="flex flex-col h-[400px]">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-4 h-4 text-arch-text-muted" />
        <h3 className="text-sm font-semibold text-arch-text-primary uppercase tracking-wider">
          Operator Communication Log & Audit Trail
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-1">
        {logs.length === 0 ? (
          <p className="text-arch-text-muted text-xs italic text-center py-8">
            No communication logs for this shift.
          </p>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="p-2.5 rounded bg-white/5 border border-white/10 flex flex-col gap-1"
            >
              <div className="flex items-center justify-between text-[10px] text-arch-text-muted font-medium">
                <span className="flex items-center gap-1 text-arch-text-secondary font-bold">
                  <User className="w-3 h-3 text-red-400" />
                  {log.operator_name}
                </span>
                <span>{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-arch-text-primary leading-relaxed">{log.message}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 pt-2 border-t border-white/10">
        <div className="grid grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="Operator Name"
            value={operatorName}
            onChange={(e) => setOperatorName(e.target.value)}
            disabled={loading}
            className="col-span-1 h-8 rounded border border-arch-border bg-arch-surface/50 px-2 text-xs text-arch-text-primary focus:outline-none"
          />
          <input
            type="text"
            placeholder="Log message / observations..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
            className="col-span-2 h-8 rounded border border-arch-border bg-arch-surface/50 px-2 text-xs text-arch-text-primary focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="h-8 rounded bg-red-600 hover:bg-red-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Post Log Entry</span>
        </button>
      </form>
    </GlassCard>
  )
}
