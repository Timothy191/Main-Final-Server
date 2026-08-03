import React from 'react'
import { CloudOff } from 'lucide-react'
import type { Metadata } from 'next'
import ReloadButton from './ReloadButton'

export const metadata: Metadata = {
  title: 'Offline | Arch OS',
  description: 'You are currently offline.',
}

export default function OfflinePage(): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="p-4 bg-arch-surface-tertiary/60 rounded-full mb-6">
        <CloudOff className="w-12 h-12 text-arch-text-muted" />
      </div>
      <h1 className="text-2xl font-semibold text-arch-text-primary mb-2">You're Offline</h1>
      <p className="text-arch-text-muted max-w-md mb-8">
        It looks like you've lost your network connection. Some features of the Arch Portal are
        unavailable until your connection is restored.
      </p>
      <ReloadButton />
    </div>
  )
}
