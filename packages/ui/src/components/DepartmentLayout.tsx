'use client'

import { cn } from '../lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MacTitleBar } from './MacTitleBar'
import { Logo } from './Logo'

interface Tab {
  name: string
  label: string
  icon: string
}

interface DepartmentLayoutProps {
  department: {
    name: string
    displayName: string
    icon: string
    color: string
  }
  tabs: readonly Tab[]
  children: React.ReactNode
}

function TabGlyph({ active }: { active?: boolean }) {
  return (
    <span
      className={cn(
        'inline-block w-1.5 h-1.5 rounded-full shrink-0',
        active ? 'bg-[var(--accent-blue)]' : 'bg-[var(--text-muted)]'
      )}
      aria-hidden
    />
  )
}

export function DepartmentLayout({ department, tabs, children }: DepartmentLayoutProps) {
  const pathname = usePathname()
  const basePath = `/${department.name}`

  return (
    <div className="flex h-[calc(100vh-28px)]">
      <aside
        className="w-60 shrink-0 border-r border-black/[0.08] bg-[var(--vibrancy-surface)] backdrop-blur-2xl flex flex-col"
        style={{ borderRight: '1px solid rgba(0,0,0,0.07)' }}
      >
        <MacTitleBar title={department.displayName} />

        <div className="px-3 pt-3 pb-1 flex items-center justify-between">
          <Link
            href="/hub"
            className="flex items-center gap-1.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--accent-blue)] transition-colors group px-2 py-1 rounded"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform text-sm">‹</span>
            <span>Back to Hub</span>
          </Link>
          <Logo className="w-4 h-4 opacity-60 mr-2" />
        </div>

        <div className="px-4 py-2 flex items-center gap-2.5">
          <div
            className={cn(
              'p-1.5 rounded-lg',
              department.color === 'blue' && 'bg-dept-drilling/10 text-dept-drilling',
              department.color === 'emerald' && 'bg-dept-production/10 text-dept-production',
              department.color === 'violet' && 'bg-dept-engineering/10 text-dept-engineering',
              department.color === 'red' && 'bg-dept-control-room/10 text-dept-control-room',
              department.color === 'cyan' && 'bg-dept-training/10 text-dept-training',
              department.color === 'indigo' && 'bg-dept-satellite/10 text-dept-satellite'
            )}
          >
            <TabGlyph active />
          </div>
          <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-wider">
            {department.displayName}
          </span>
        </div>

        <nav className="flex-1 px-2 pb-2 space-y-0.5 overflow-y-auto">
          {tabs.map((tab) => {
            const href = tab.name === 'dashboard' ? basePath : `${basePath}/${tab.name}`
            const isActive =
              pathname === href || (tab.name === 'dashboard' && pathname === basePath)
            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-[13px] transition-all relative group',
                  isActive
                    ? 'bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] font-medium'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-heading)] hover:bg-black/[0.04]'
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--accent-blue)]" />
                )}
                <TabGlyph active={isActive} />
                {tab.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-black/[0.06] flex items-center justify-between gap-2">
          <div className="flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md bg-[var(--accent-green)]/8 border border-[var(--accent-green)]/15">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)] animate-pulse" />
            <span className="text-[11px] text-[var(--text-muted)] font-medium tracking-wide">
              Connection Secure
            </span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-white/40 backdrop-blur-sm p-6">{children}</main>
    </div>
  )
}
