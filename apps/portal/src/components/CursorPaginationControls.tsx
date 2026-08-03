'use client'

import { CursorPagination, type CursorPaginationProps } from '@repo/ui/components/ui/pagination'

interface CursorPaginationControlsProps {
  nextCursor: string | null
  previousCursors: string[]
  hasNextPage: boolean
  pageSize: number
  loadedCount?: number
  totalCount?: number
  /** Current page cursor from URL (pushed onto stack when going next) */
  currentCursor?: string | null
  className?: string
}

/**
 * Client island: URL-driven cursor pagination for Server Component pages.
 * Keeps event handlers out of RSC props.
 */
export function CursorPaginationControls({
  nextCursor,
  previousCursors,
  hasNextPage,
  pageSize,
  loadedCount,
  totalCount,
  currentCursor,
  className,
}: CursorPaginationControlsProps) {
  const navigate: CursorPaginationProps['onNext'] = (nextC) => {
    const url = new URL(window.location.href)
    url.searchParams.set('cursor', nextC)
    const stack = [...previousCursors]
    if (currentCursor) stack.push(currentCursor)
    url.searchParams.set('cursors', stack.join(','))
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  const goPrevious: CursorPaginationProps['onPrevious'] = (prevC) => {
    const url = new URL(window.location.href)
    if (prevC === 'start') {
      url.searchParams.delete('cursor')
      url.searchParams.delete('cursors')
    } else {
      url.searchParams.set('cursor', prevC)
      const stack = previousCursors.slice(0, -1)
      if (stack.length > 0) {
        url.searchParams.set('cursors', stack.join(','))
      } else {
        url.searchParams.delete('cursors')
      }
    }
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  const changePageSize: NonNullable<CursorPaginationProps['onPageSizeChange']> = (newSize) => {
    const url = new URL(window.location.href)
    url.searchParams.set('limit', newSize.toString())
    url.searchParams.delete('cursor')
    url.searchParams.delete('cursors')
    url.searchParams.delete('page')
    window.location.href = url.toString()
  }

  return (
    <CursorPagination
      nextCursor={nextCursor}
      previousCursors={previousCursors}
      hasNextPage={hasNextPage}
      pageSize={pageSize}
      loadedCount={loadedCount}
      totalCount={totalCount}
      onNext={navigate}
      onPrevious={goPrevious}
      onPageSizeChange={changePageSize}
      className={className}
    />
  )
}
