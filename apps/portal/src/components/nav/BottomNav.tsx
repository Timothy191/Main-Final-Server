'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Drill, Factory, Radar, HardHat } from 'lucide-react'
import { cn } from '@repo/ui/lib/utils'

const NAV_ITEMS = [
  { href: '/hub', label: 'Hub', icon: LayoutDashboard, dept: null },
  { href: '/drilling', label: 'Drilling', icon: Drill, dept: 'drilling' },
  {
    href: '/production',
    label: 'Production',
    icon: Factory,
    dept: 'production',
  },
  { href: '/safety', label: 'Safety', icon: HardHat, dept: 'safety' },
  {
    href: '/control-room',
    label: 'Control',
    icon: Radar,
    dept: 'control-room',
  },
] as const

interface BottomNavProps {
  /** Department slugs the user may enter. All nav depts stay visible; locked use no-entry cursor. */
  accessibleDepartments?: string[]
}

export function BottomNav({ accessibleDepartments }: BottomNavProps) {
  const pathname = usePathname()
  // AGENT-TRACE: Fail-closed — missing prop locks dept items (hub always passes ACL list).
  const acl = new Set(accessibleDepartments ?? [])

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden border-t border-arch-border-default bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      {NAV_ITEMS.map(({ href, label, icon: Icon, dept }) => {
        const isActive =
          href === '/hub' ? pathname === '/hub' || pathname === '/' : pathname.startsWith(href)
        const locked = dept !== null && !acl.has(dept)

        if (locked) {
          return (
            <span
              key={href}
              aria-disabled="true"
              title={`No access to ${label}`}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-medium touch-manipulation cursor-not-allowed opacity-50 text-arch-text-muted'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{label}</span>
            </span>
          )
        }

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 min-h-[56px] text-[10px] font-medium transition-colors touch-manipulation',
              isActive
                ? 'text-arch-accent-green'
                : 'text-arch-text-muted hover:text-arch-text-secondary'
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-arch-accent-green')} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
