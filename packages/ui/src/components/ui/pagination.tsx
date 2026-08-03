'use client'

import React from 'react'
import { cn } from '../../lib/utils'

/**
 * @deprecated Use `CursorPagination` for new implementations.
 * This offset-based component is retained for backward compatibility only.
 * All new paginated views should use cursor-based pagination via
 * `CursorPagination` + `CursorPaginationControls`.
 */
/* ------------------------------------------------------------------ */
/*  Offset-based pagination (page / pageSize)  [DEPRECATED]           */
/* ------------------------------------------------------------------ */

export interface PaginationProps {
  currentPage: number
  totalPages: number
  totalCount?: number
  pageSize?: number
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

export function Pagination({
  currentPage,
  totalPages,
  totalCount,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const start = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const end =
    totalCount === undefined ? currentPage * pageSize : Math.min(currentPage * pageSize, totalCount)

  const pageNumbers = getVisiblePages(currentPage, totalPages)

  return (
    <div className={cn('flex flex-wrap items-center justify-between gap-3 px-4 py-3', className)}>
      <div className="flex items-center gap-3">
        {totalCount !== undefined && (
          <span className="text-xs text-arch-text-muted">
            Showing {start} to {end} of {totalCount} entries
          </span>
        )}
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-xs text-arch-text-muted">
            Show
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-arch-surface-secondary border border-arch-border-default rounded px-1.5 py-0.5 text-xs text-arch-text-primary focus:outline-none focus:ring-1 focus:ring-arch-accent-charcoal"
            >
              {[10, 20, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors border border-arch-border-default',
            currentPage <= 1
              ? 'bg-arch-surface-primary text-arch-text-muted opacity-50 cursor-not-allowed'
              : 'bg-arch-surface-secondary hover:bg-arch-surface-tertiary text-arch-text-primary'
          )}
        >
          Previous
        </button>

        {pageNumbers.map((page, idx) =>
          page === '…' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-xs text-arch-text-muted">
              …
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[2rem] px-2 py-1.5 rounded text-xs font-medium transition-colors border border-arch-border-default',
                page === currentPage
                  ? 'bg-arch-accent-charcoal text-white'
                  : 'bg-arch-surface-secondary hover:bg-arch-surface-tertiary text-arch-text-primary'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors border border-arch-border-default',
            currentPage >= totalPages
              ? 'bg-arch-surface-primary text-arch-text-muted opacity-50 cursor-not-allowed'
              : 'bg-arch-surface-secondary hover:bg-arch-surface-tertiary text-arch-text-primary'
          )}
        >
          Next
        </button>
      </div>
    </div>
  )
}

function getVisiblePages(currentPage: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages: Array<number | '…'> = [1]
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  if (start > 2) pages.push('…')
  for (let p = start; p <= end; p++) pages.push(p)
  if (end < totalPages - 1) pages.push('…')
  pages.push(totalPages)
  return pages
}

/* ------------------------------------------------------------------ */
/*  Cursor-based pagination (replaces offset-based for large lists)    */
/* ------------------------------------------------------------------ */

export interface CursorPaginationProps {
  /** Base64-encoded cursor for the next page, or null if no more pages */
  nextCursor: string | null
  /** Base64-encoded cursor stack for previous pages (oldest first), or [] */
  previousCursors: string[]
  /** Whether there are more pages forward */
  hasNextPage: boolean
  /** Current page size */
  pageSize: number
  /** Total number of items loaded so far (for display) */
  loadedCount?: number
  /** Optional estimated total (if known) */
  totalCount?: number
  /** Callback when user clicks Next — receives the nextCursor */
  onNext: (cursor: string) => void
  /** Callback when user clicks Previous — receives the previous cursor (or 'start' for first page) */
  onPrevious: (cursor: string | 'start') => void
  /** Optional page size selector callback */
  onPageSizeChange?: (size: number) => void
  /** className for the outer container */
  className?: string
}

export function CursorPagination({
  nextCursor,
  previousCursors,
  hasNextPage,
  pageSize,
  loadedCount,
  totalCount,
  onNext,
  onPrevious,
  onPageSizeChange,
  className,
}: CursorPaginationProps) {
  const hasPreviousPage = previousCursors.length > 0
  const currentPage = previousCursors.length + 1

  return (
    <div
      className={cn(
        'flex items-center justify-between px-4 py-3 border-t border-arch-border-default',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {loadedCount !== undefined && (
          <span className="text-xs text-arch-text-muted">
            {totalCount !== undefined
              ? `${loadedCount} of ${totalCount} entries`
              : `${loadedCount} entries loaded`}
          </span>
        )}
        {onPageSizeChange && (
          <label className="flex items-center gap-1.5 text-xs text-arch-text-muted">
            Show
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-arch-surface-secondary border border-arch-border-default rounded px-1.5 py-0.5 text-xs text-arch-text-primary focus:outline-none focus:ring-1 focus:ring-arch-accent-charcoal"
            >
              {[10, 25, 50, 100].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-arch-text-muted">
          Page {currentPage}
          {totalCount !== undefined && <> of ~{Math.ceil(totalCount / pageSize)}</>}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!hasPreviousPage) return
            onPrevious(
              previousCursors.length > 0 ? previousCursors[previousCursors.length - 1]! : 'start'
            )
          }}
          disabled={!hasPreviousPage}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
            'border border-arch-border-default',
            hasPreviousPage
              ? 'bg-arch-surface-secondary hover:bg-arch-surface-tertiary text-arch-text-primary'
              : 'bg-arch-surface-primary text-arch-text-muted opacity-50 cursor-not-allowed'
          )}
          aria-label="Previous page"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => {
            if (!hasNextPage || !nextCursor) return
            onNext(nextCursor)
          }}
          disabled={!hasNextPage || !nextCursor}
          className={cn(
            'px-3 py-1.5 rounded text-xs font-medium transition-colors',
            'border border-arch-border-default',
            hasNextPage && nextCursor
              ? 'bg-arch-surface-secondary hover:bg-arch-surface-tertiary text-arch-text-primary'
              : 'bg-arch-surface-primary text-arch-text-muted opacity-50 cursor-not-allowed'
          )}
          aria-label="Next page"
        >
          Next →
        </button>
      </div>
    </div>
  )
}
