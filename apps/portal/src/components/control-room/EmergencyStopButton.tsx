'use client'

import { useState, useEffect } from 'react'
import { AlertOctagon, Power } from 'lucide-react'
import { toast } from 'sonner'

export function EmergencyStopButton() {
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (confirming) {
      const timer = setTimeout(() => {
        setConfirming(false)
      }, 4000) // Reset confirmation state after 4 seconds
      return () => clearTimeout(timer)
    }
  }, [confirming])

  const handleTrigger = async () => {
    if (!confirming) {
      setConfirming(true)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/control-room/emergency-stop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operatorId: null }),
      })

      if (res.ok) {
        toast.error('EMERGENCY SHUTDOWN ACTIVATED! ALL SYSTEMS HALTED.')
        setConfirming(false)
      } else {
        toast.error('Failed to trigger emergency shutdown.')
      }
    } catch (e) {
      toast.error('Connection error triggering shutdown.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTrigger}
      disabled={loading}
      className={`w-full py-2.5 px-3 rounded-lg border transition-all duration-300 flex items-center justify-center gap-2 font-bold tracking-wider text-xs ${
        confirming
          ? 'bg-red-600 hover:bg-red-700 text-white border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
          : 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30'
      }`}
    >
      {confirming ? (
        <>
          <AlertOctagon className="w-4 h-4 text-white" />
          <span>CONFIRM SHUTDOWN</span>
        </>
      ) : (
        <>
          <Power className="w-4 h-4 text-red-500" />
          <span>EMERGENCY STOP</span>
        </>
      )}
    </button>
  )
}
