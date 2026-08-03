'use client'

import { GlassCard } from '@repo/ui/GlassCard'
import { Button } from '@repo/ui/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AccessCardActionsError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center py-16">
        <GlassCard className="max-w-md text-center">
          <div className="flex flex-col items-center gap-4 py-6 px-4">
            <div className="w-12 h-12 rounded-full bg-red-50/70 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="font-medium text-arch-text-primary text-lg">Something went wrong</h2>
            <p className="text-sm text-arch-text-muted">
              An error occurred while loading this page. Please try again.
            </p>
            <Button onClick={reset} size="sm" variant="outline" className="mt-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try again
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
