'use client'

import React, { useTransition } from 'react'
import { triggerManualAudit } from './actions'
import { Button } from '@repo/ui'

export function TriggerButton() {
  const [isPending, startTransition] = useTransition()

  const handleTrigger = () => {
    startTransition(async () => {
      try {
        await triggerManualAudit()
      } catch (err) {
        alert(`Failed to trigger audit report: ${err instanceof Error ? err.message : String(err)}`)
      }
    })
  }

  return (
    <Button
      onClick={handleTrigger}
      disabled={isPending}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition"
    >
      {isPending ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Generating Audit Report...
        </span>
      ) : (
        'Run Daily Audit Now'
      )}
    </Button>
  )
}
