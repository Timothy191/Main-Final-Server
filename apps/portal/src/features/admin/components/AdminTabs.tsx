'use client'

import type { ReactNode } from 'react'

interface AdminTabsProps {
  value: string
  onValueChange: (value: string) => void
  children: ReactNode
}

/**
 * AdminTabs — navigation tabs for admin panel.
 * Used by AdminTabsClient to wrap admin tab content with URL-based tab switching.
 */
export function AdminTabs({ value, onValueChange: _onValueChange, children }: AdminTabsProps) {
  return (
    <div className="admin-tabs" data-active-tab={value}>
      {/* Tab navigation and content are rendered via children */}
      {children}
    </div>
  )
}
