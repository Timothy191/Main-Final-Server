'use client'

import * as React from 'react'
import { RevoGrid } from '@revolist/react-datagrid'
import type { SortingConfig, ColumnFilterConfig } from '@revolist/revogrid'
import { cn } from '@repo/ui/lib/utils'
import { GlassCard } from '../GlassCard'

type RevoColumn = React.ComponentProps<typeof RevoGrid>['columns']
type RevoSource = React.ComponentProps<typeof RevoGrid>['source']

export interface DataGridProps {
  columns: RevoColumn
  source: RevoSource
  className?: string
  height?: string
  resize?: boolean
  filter?: boolean | ColumnFilterConfig
  sorting?: boolean | SortingConfig
  canFocus?: boolean
  // eslint-disable-next-line no-unused-vars
  onAfterEdit?: (_event: any) => void
  stretch?: boolean | string
}

/**
 * Arch-themed wrapper around RevoGrid.
 * Provides virtual scrolling, Excel copy/paste, in-cell editing,
 * and glass-surface styling consistent with the macOS Sonoma design language.
 *
 * Usage in Next.js App Router requires dynamic import with ssr: false,
 * because RevoGrid uses StencilJS web components that reference `window`.
 */
export function DataGrid({
  columns,
  source,
  className,
  height = '600px',
  resize = true,
  filter = false,
  sorting = false,
  canFocus = true,
  onAfterEdit,
  stretch,
}: DataGridProps) {
  const gridRef = React.useRef<any>(null)

  const sortingProp =
    typeof sorting === 'boolean' ? (sorting ? { additive: false } : undefined) : sorting

  return (
    <GlassCard className={cn('overflow-hidden p-0', className)}>
      <div
        className="w-full"
        style={{
          height,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        <RevoGrid
          ref={gridRef}
          columns={columns}
          source={source}
          resize={resize}
          filter={filter}
          sorting={sortingProp}
          canFocus={canFocus}
          onAfteredit={onAfterEdit}
          theme="compact"
          rowClass="arch-revo-row"
          stretch={stretch}
        />
      </div>
    </GlassCard>
  )
}
