'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Ban, Play, Info, ArrowUpRight } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'
import type { Department } from '@/lib/departments'
import { semanticIconClass } from '@/lib/semantic-icon'
import { HERO_ARCH_PILL } from '@/features/hub/constants/hero-pill'

type HeroDepartment = Department & { accessible?: boolean }

interface HeroCta {
  href: string
  label: string
  icon: React.ReactNode
  locked?: boolean
}

interface HeroPanel {
  id: string
  title: string
  description: string
  primary: HeroCta
  secondary: HeroCta | null
}

interface HeroRotatorProps {
  defaultTitle: string
  defaultDescription: string
  primaryHref: string
  primaryLabel: string
  secondaryHref: string
  secondaryLabel: string
  /** Full catalog; locked depts stay visible with no-entry CTAs. */
  departments: HeroDepartment[]
}

function LockedCta({ label, icon }: { label: string; icon: React.ReactNode }) {
  return (
    <span
      aria-disabled="true"
      title="No access to this department"
      className={cn(
        HERO_ARCH_PILL,
        'inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium cursor-not-allowed min-h-[44px]'
      )}
    >
      {icon}
      <span className="opacity-70">{label}</span>
      <Ban className={cn('w-3.5 h-3.5 shrink-0', semanticIconClass('deny'))} aria-hidden="true" />
    </span>
  )
}

function OpenCta({
  href,
  label,
  icon,
  variant,
}: {
  href: string
  label: string
  icon: React.ReactNode
  variant: 'primary' | 'secondary'
}) {
  const isPrimary = variant === 'primary'
  return (
    <Link
      href={href}
      data-cta={isPrimary ? 'primary-hero' : 'secondary-hero'}
      className={cn(
        HERO_ARCH_PILL,
        'inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium hover:bg-black/[0.06] active:scale-[0.97] min-h-[44px]'
      )}
    >
      {icon}
      {label}
    </Link>
  )
}

function HeroDisplayTitle({ title }: { title: string }) {
  // Long display names (e.g. CONTROL ROOM, ACCESS CARD ACTIONS) need
  // tighter tracking + fluid size so nowrap letters stay inside the card.
  const isLong = title.length >= 12

  return (
    <h1
      className={cn(
        'hub-hero-title font-display font-normal uppercase leading-none max-w-full',
        'text-[clamp(1.375rem,3.5vw+0.75rem,3rem)]',
        isLong ? 'tracking-[0.06em] sm:tracking-[0.08em]' : 'tracking-[0.1em] sm:tracking-[0.12em]',
        'max-sm:whitespace-normal sm:whitespace-nowrap',
        'pr-4' /* room for extrusion shadow so last glyph isn’t clipped */
      )}
      aria-label={title}
    >
      {Array.from(title).map((ch, i) => (
        <span key={`${i}-${ch}`} className="hub-hero-title-letter" aria-hidden="true">
          {ch === ' ' ? '\u00A0' : ch}
        </span>
      ))}
    </h1>
  )
}

export function HeroRotator({
  defaultTitle,
  defaultDescription,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
  departments,
}: HeroRotatorProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setPrefersReducedMotion(mediaQuery.matches)
    sync()
    mediaQuery.addEventListener('change', sync)
    return () => mediaQuery.removeEventListener('change', sync)
  }, [])

  const panels: HeroPanel[] = [
    {
      id: 'default',
      title: defaultTitle,
      description: defaultDescription,
      primary: {
        href: primaryHref,
        label: primaryLabel,
        icon: (
          <Play
            className={cn('w-4 h-4 fill-current shrink-0', semanticIconClass('play'))}
            aria-hidden="true"
          />
        ),
      },
      secondary: {
        href: secondaryHref,
        label: secondaryLabel,
        icon: (
          <Info className={cn('w-4 h-4 shrink-0', semanticIconClass('info'))} aria-hidden="true" />
        ),
      },
    },
    ...departments.map((dept) => {
      // AGENT-TRACE: Fail-closed — only explicit accessible:true unlocks CTAs.
      const locked = dept.accessible !== true
      const primaryHrefDept = dept.actions?.[0]?.href ?? `/${dept.name}`
      const primaryLabelDept = dept.actions?.[0]?.label ?? `Go to ${dept.displayName}`
      const secondaryHrefDept = dept.actions?.[1]?.href
      const secondaryLabelDept = dept.actions?.[1]?.label
      const navIcon = (
        <ArrowUpRight
          className={cn('w-4 h-4 shrink-0', semanticIconClass(locked ? 'deny' : 'navigate'))}
          aria-hidden="true"
        />
      )

      return {
        id: dept.name,
        title: dept.displayName,
        description: dept.description,
        primary: {
          href: primaryHrefDept,
          label: primaryLabelDept,
          icon: navIcon,
          locked,
        },
        secondary: secondaryHrefDept
          ? {
              href: secondaryHrefDept,
              label: secondaryLabelDept ?? 'Open',
              icon: navIcon,
              locked,
            }
          : null,
      }
    }),
  ]

  useEffect(() => {
    if (panels.length <= 1 || prefersReducedMotion) return

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev >= panels.length - 1 ? 0 : prev + 1))
    }, 6000)

    return () => clearInterval(interval)
  }, [panels.length, prefersReducedMotion])

  return (
    <>
      <div className="overflow-hidden w-full">
        <div
          className={cn(
            'flex ease-[cubic-bezier(0.16,1,0.3,1)]',
            prefersReducedMotion ? 'transition-none' : 'transition-transform duration-700'
          )}
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {panels.map((panel, idx) => (
            <div
              key={panel.id}
              className={cn(
                'w-full shrink-0 flex flex-col justify-start',
                prefersReducedMotion ? 'transition-none' : 'transition-opacity duration-700',
                Math.abs(activeIndex - idx) <= 1 ? 'opacity-100' : 'opacity-0'
              )}
            >
              <div className="space-y-3">
                <HeroDisplayTitle title={panel.title} />
                <p className="font-sans font-normal login-muted-text text-base sm:text-lg md:text-xl leading-relaxed max-w-3xl text-pretty">
                  {panel.description}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-2 mt-5">
                {panel.primary.locked ? (
                  <LockedCta label={panel.primary.label} icon={panel.primary.icon} />
                ) : (
                  <OpenCta
                    href={panel.primary.href}
                    label={panel.primary.label}
                    icon={panel.primary.icon}
                    variant="primary"
                  />
                )}
                {panel.secondary ? (
                  panel.secondary.locked ? (
                    <LockedCta label={panel.secondary.label} icon={panel.secondary.icon} />
                  ) : (
                    <OpenCta
                      href={panel.secondary.href}
                      label={panel.secondary.label}
                      icon={panel.secondary.icon}
                      variant="secondary"
                    />
                  )
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anchored to hero os-shell (nearest positioned ancestor), bottom-center */}
      {panels.length > 1 && (
        <div
          className="pointer-events-none absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2"
          aria-hidden="true"
        >
          {panels.map((_, idx) => (
            <div
              key={idx}
              className={cn(
                'w-2 h-2 rounded-full transition-all duration-300',
                idx === activeIndex ? 'bg-arch-accent-charcoal w-4' : 'bg-arch-border-emphasis'
              )}
            />
          ))}
        </div>
      )}
    </>
  )
}
