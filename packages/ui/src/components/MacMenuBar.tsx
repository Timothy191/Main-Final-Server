'use client'

import * as React from 'react'
import Link from 'next/link'
import { cn } from '../lib/utils'
import { Logo } from './Logo'

interface MacMenuBarProps {
  className?: string
  /** Platform partner marks — left cluster after window controls. */
  leftSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  /** When provided, replaces the default Arch app menu with a custom panel. */
  appMenu?: (ctx: { close: () => void }) => React.ReactNode
}

const APP_MENU_ITEMS = [
  { label: 'About Arch', href: '/' },
  { label: 'System Dashboard', href: '/' },
  { label: 'Settings', href: '/settings' },
  { label: 'Support', href: '/support' },
] as const

const ARCH_MENU_ID = 'arch-taskbar-menu'

function MenuChevron({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'h-3 w-3 shrink-0 text-[var(--text-muted)] transition-transform duration-200',
        open && 'rotate-180'
      )}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  )
}

/**
 * Floating pill taskbar chrome (traffic lights + Start/Apple-style app menu).
 */
export function MacMenuBar({
  className,
  leftSlot,
  centerSlot,
  rightSlot,
  appMenu,
}: MacMenuBarProps) {
  const [appMenuOpen, setAppMenuOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const closeMenu = React.useCallback(() => {
    setAppMenuOpen(false)
    triggerRef.current?.focus()
  }, [])

  const toggleMenu = React.useCallback(() => {
    setAppMenuOpen((open) => !open)
  }, [])

  React.useEffect(() => {
    if (!appMenuOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setAppMenuOpen(false)
      }
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [appMenuOpen, closeMenu])

  const handleTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setAppMenuOpen(true)
    }
  }

  return (
    <header
      className={cn(
        'os-shell os-shell--taskbar os-shell-enter-1 fixed top-2 left-3 right-3 z-50 flex h-8 items-center gap-2 px-3',
        'sm:left-4 sm:right-4',
        className
      )}
    >
      <div ref={menuRef} className="relative shrink-0">
        <button
          ref={triggerRef}
          type="button"
          id="arch-taskbar-trigger"
          aria-label="Arch menu"
          aria-haspopup="menu"
          aria-expanded={appMenuOpen}
          aria-controls={ARCH_MENU_ID}
          onClick={toggleMenu}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'flex h-[26px] items-center gap-1.5 rounded-full border px-2.5 text-[12px] font-medium',
            'select-none outline-none transition-colors active:scale-[0.97]',
            'border-border-subtle bg-black/[0.03] text-text-heading',
            'hover:bg-black/[0.06] focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/50',
            appMenuOpen && 'border-border-default bg-black/[0.1] shadow-sm'
          )}
        >
          <Logo className="h-3.5 w-3.5 shrink-0 text-text-heading" />
          <span className="font-display text-[11px] font-normal uppercase tracking-[0.18em]">
            Arch
          </span>
          <MenuChevron open={appMenuOpen} />
        </button>

        {appMenuOpen && (
          <div
            id={ARCH_MENU_ID}
            role="menu"
            aria-labelledby="arch-taskbar-trigger"
            className={cn(
              'absolute left-0 top-full z-[60] mt-1.5 overflow-hidden text-[13px]',
              appMenu
                ? 'w-[min(100vw-2rem,36rem)] rounded-2xl border border-border-subtle bg-transparent p-0 shadow-window'
                : 'w-56 rounded-xl border border-border-subtle bg-white/95 p-1 shadow-window backdrop-blur-xl'
            )}
          >
            {appMenu ? (
              appMenu({ close: closeMenu })
            ) : (
              <>
                {APP_MENU_ITEMS.map((item, index) => (
                  <React.Fragment key={item.label}>
                    {index === 2 && (
                      <div role="separator" className="my-1 border-t border-border-subtle" />
                    )}
                    <Link
                      href={item.href}
                      role="menuitem"
                      tabIndex={0}
                      onClick={closeMenu}
                      className="flex items-center justify-between rounded-lg px-3 py-1.5 text-[var(--text-heading)] hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/50"
                    >
                      <span>{item.label}</span>
                    </Link>
                  </React.Fragment>
                ))}
                <div role="separator" className="my-1 border-t border-border-subtle" />
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={0}
                  onClick={closeMenu}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[var(--text-heading)] hover:bg-black/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/50"
                >
                  <span>Hide Arch</span>
                  <span className="text-[11px] text-[var(--text-muted)]">⌘H</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-1.5" role="group" aria-label="Window controls">
        <button
          type="button"
          aria-label="Open WhatsApp Web in split view"
          title="WhatsApp Web (split view)"
          onClick={() => {
            if (typeof window === 'undefined') return
            window.dispatchEvent(
              new CustomEvent('open-split-view', { detail: { service: 'whatsapp' } })
            )
          }}
          className={cn(
            'h-3 w-3 rounded-full border border-black/15 bg-mac-red',
            'transition-transform hover:scale-110 active:scale-95',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]/50 focus-visible:ring-offset-1'
          )}
        />
        <button
          type="button"
          aria-label="Minimize (unavailable)"
          title="Minimize"
          disabled
          className="h-3 w-3 rounded-full border border-black/15 bg-mac-yellow opacity-80 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          aria-label="Maximize (unavailable)"
          title="Maximize"
          disabled
          className="h-3 w-3 rounded-full border border-black/15 bg-mac-green opacity-80 disabled:cursor-not-allowed"
        />
      </div>

      {leftSlot ? (
        <>
          <div role="separator" aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-border-subtle" />
          <div className="flex shrink-0 items-center">{leftSlot}</div>
        </>
      ) : null}

      {centerSlot ? (
        <div className="mx-1 flex min-w-0 flex-1 justify-center">{centerSlot}</div>
      ) : (
        <div className="min-w-0 flex-1" aria-hidden />
      )}
      <div className="flex shrink-0 items-center gap-2">{rightSlot}</div>
    </header>
  )
}
