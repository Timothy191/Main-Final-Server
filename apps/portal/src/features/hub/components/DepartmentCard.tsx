'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  ArrowUpRight,
  Ban,
  Bookmark,
  CreditCard,
  Factory,
  FileText,
  HardHat,
  GraduationCap,
  Monitor,
  Pickaxe,
  Satellite,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import type { Department } from '@/lib/departments'
import { semanticIconClass } from '@/lib/semantic-icon'
import { Sparkline } from './Sparkline'
import { toast } from 'sonner'

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill: Pickaxe,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
  Satellite,
  CreditCard,
}

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  amber: {
    bg: 'border-accent-amber/20 text-accent-amber bg-accent-amber/5',
    text: 'text-accent-amber',
  },
  emerald: {
    bg: 'border-accent-green/20 text-accent-green bg-accent-green/5',
    text: 'text-accent-green',
  },
  blue: {
    bg: 'border-accent-blue/20 text-accent-blue bg-accent-blue/5',
    text: 'text-accent-blue',
  },
  violet: {
    bg: 'border-accent-blue/20 text-accent-blue bg-accent-blue/5',
    text: 'text-accent-blue',
  },
  red: {
    bg: 'border-accent-red/20 text-accent-red bg-accent-red/5',
    text: 'text-accent-red',
  },
  orange: {
    bg: 'border-accent-amber/20 text-accent-amber bg-accent-amber/5',
    text: 'text-accent-amber',
  },
  cyan: {
    bg: 'border-accent-blue/20 text-accent-blue bg-accent-blue/5',
    text: 'text-accent-blue',
  },
  indigo: {
    bg: 'border-accent-blue/20 text-accent-blue bg-accent-blue/5',
    text: 'text-accent-blue',
  },
}

interface DepartmentCardProps {
  department: Department
  index: number
  /** When false, card stays visible with no-entry cursor and does not navigate. */
  accessible?: boolean
}

export function DepartmentCard({ department, index, accessible = false }: DepartmentCardProps) {
  const router = useRouter()
  const [isPinned, setIsPinned] = useState(false)

  useEffect(() => {
    const pinned = localStorage.getItem(`pinned_dept_${department.name}`)
    setIsPinned(pinned === 'true')
  }, [department.name])

  const togglePin = (e: React.MouseEvent) => {
    e.stopPropagation()
    const nextState = !isPinned
    localStorage.setItem(`pinned_dept_${department.name}`, String(nextState))
    setIsPinned(nextState)
    if (nextState) {
      toast.success(`Pinned ${department.displayName} to dashboard`)
    } else {
      toast.success(`Unpinned ${department.displayName}`)
    }
  }

  const openDepartment = () => {
    if (!accessible) return
    router.push(`/${department.name}`)
  }

  const Icon = ICON_MAP[department.icon] || Factory
  const config = COLOR_MAP[department.color] || {
    bg: 'border-arch-border-subtle text-arch-text-primary',
    text: 'text-arch-text-primary',
  }

  return (
    <div
      style={
        {
          animation: `fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
          ['--shimmer-delay' as string]: `${-(index * 1.5)}s`,
        } as React.CSSProperties
      }
      className={cn('h-full', department.gridSpan)}
    >
      <div
        onClick={openDepartment}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openDepartment()
          }
        }}
        tabIndex={0}
        role="link"
        aria-disabled={!accessible}
        aria-label={
          accessible ? `Open ${department.displayName}` : `${department.displayName} — no access`
        }
        title={accessible ? undefined : 'No access to this department'}
        className={cn(
          'uiverse-card group relative outline-none h-full interactive-element',
          !accessible && 'cursor-not-allowed opacity-70'
        )}
      >
        {!accessible ? (
          <span
            className="pointer-events-none absolute right-3 top-3 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full border border-arch-border-default bg-white/90 text-accent-red shadow-sm"
            aria-hidden="true"
          >
            <Ban className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        ) : null}
        {/* Banner area */}
        <div className={cn('uiverse-card-banner', `uiverse-card-banner-${department.name}`)}>
          {/* Save/Pin Button */}
          <button
            type="button"
            onClick={togglePin}
            className="uiverse-card-pin hover:scale-110 active:scale-95"
            title={isPinned ? 'Unpin department' : 'Pin department'}
          >
            <Bookmark
              className={cn(
                'w-3.5 h-3.5 transition-all duration-200',
                isPinned ? 'fill-arch-accent-blue text-arch-accent-blue' : 'text-arch-text-tertiary'
              )}
            />
          </button>

          {/* Department Icon Bubble */}
          <div className={cn('uiverse-card-icon-bubble border-arch-border-emphasis/25', config.bg)}>
            <Icon className="w-5 h-5" />
          </div>
        </div>

        {/* Card Body */}
        <div className="uiverse-card-body">
          <div className="space-y-2">
            <div className="uiverse-card-title-row">
              <h3 className="uiverse-card-title">{department.displayName}</h3>
              {department.status && (
                <span className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={cn(
                      'w-1.5 h-1.5 rounded-full animate-pulse',
                      department.status === 'active' && 'bg-accent-green',
                      department.status === 'maintenance' && 'bg-accent-amber',
                      department.status === 'alert' && 'bg-accent-red'
                    )}
                  />
                  <span className="text-[10px] font-medium uppercase tracking-[0.05em] text-arch-text-tertiary">
                    {department.status}
                  </span>
                </span>
              )}
            </div>
            <p className="uiverse-card-subtitle">{department.description}</p>

            {department.actions && department.actions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                {department.actions.map((action) =>
                  accessible ? (
                    <Link
                      key={action.label}
                      href={action.href}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 h-5.5 rounded-full glass-action-button text-[10px] font-medium transition-all interactive-element"
                    >
                      <FileText className="w-2.5 h-2.5 shrink-0" />
                      <span>{action.label}</span>
                      <ArrowUpRight className="w-2.5 h-2.5 opacity-50 shrink-0" />
                    </Link>
                  ) : (
                    <span
                      key={action.label}
                      className="inline-flex items-center justify-center gap-1 px-2.5 py-0.5 h-5.5 rounded-full glass-action-button text-[10px] font-medium cursor-not-allowed opacity-60"
                      aria-disabled="true"
                    >
                      <FileText className="w-2.5 h-2.5 shrink-0" />
                      <span>{action.label}</span>
                      <Ban
                        className={cn('w-2.5 h-2.5 shrink-0', semanticIconClass('deny'))}
                        aria-hidden
                      />
                    </span>
                  )
                )}
              </div>
            )}
          </div>

          {/* Tag / Stats row */}
          {department.stats && (
            <div className="uiverse-card-tag-row">
              <div className="flex items-center gap-2">
                <span className="uiverse-card-tag-row-text">{department.stats.label}</span>
                {department.trend && (
                  <div className="opacity-80">
                    <Sparkline data={department.trend} width={52} height={14} />
                  </div>
                )}
              </div>
              <span className="uiverse-card-tag-row-value">{department.stats.value}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
