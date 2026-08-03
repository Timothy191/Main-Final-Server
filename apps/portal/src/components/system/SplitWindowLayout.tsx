'use client'

import React, { useEffect, useState } from 'react'
import { useSplitWindow } from '@/hooks/useSplitWindow'
import { cn } from '@repo/ui/lib/utils'
import { X, GitBranch } from 'lucide-react'

interface SplitWindowLayoutProps {
  children: React.ReactNode
}

/* ─────────────────────────── Service Config ─────────────────────────── */

const SERVICE_META: Record<
  'github' | 'whatsapp',
  { label: string; shortLabel: string; Icon: React.ReactNode }
> = {
  github: {
    label: 'GitHub: Timothy191/ArchMK2',
    shortLabel: 'GitHub',
    Icon: (
      <svg className="w-3.5 h-3.5 text-black fill-current" viewBox="0 0 24 24">
        <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
      </svg>
    ),
  },
  whatsapp: {
    label: 'WhatsApp: Operations Chat',
    shortLabel: 'WhatsApp',
    Icon: (
      <svg className="w-3.5 h-3.5 text-emerald-600 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.79-4.896c1.675.993 3.324 1.558 5.207 1.559 5.405 0 9.803-4.375 9.806-9.754.002-2.607-1.002-5.06-2.83-6.892-1.829-1.83-4.263-2.836-6.868-2.837-5.39 0-9.786 4.377-9.79 9.753-.001 2.03.535 3.738 1.555 5.262l-.994 3.63 3.74-.981z" />
      </svg>
    ),
  },
}

/* ─────────────────────────── SplitWindowLayout ─────────────────────────── */

export function SplitWindowLayout({ children }: SplitWindowLayoutProps) {
  const { isOpen, tabs, activeTabId, openTab, closeTab, activateTab, closeAll } = useSplitWindow()

  // Listen to custom window events dispatched from the navigation taskbar
  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ service: 'github' | 'whatsapp' }>
      if (customEvent.detail?.service) {
        openTab(customEvent.detail.service)
      }
    }
    window.addEventListener('open-split-view', handleToggle)
    return () => window.removeEventListener('open-split-view', handleToggle)
  }, [openTab])

  const activeTab = tabs.find((t) => t.id === activeTabId)

  return (
    <div className="relative flex min-h-[calc(100vh-4rem)] w-full overflow-hidden">
      {/* Left side: Main Workspace */}
      <div
        className={cn(
          'flex-1 min-w-0 transition-all duration-300 ease-in-out',
          isOpen ? 'pr-[400px] md:pr-[450px]' : 'pr-0'
        )}
      >
        {children}
      </div>

      {/* Right side: Split window pane */}
      <div
        className={cn(
          'fixed top-16 right-2 bottom-2 w-[390px] md:w-[440px] z-40',
          'liquid-glass-light border border-white/40 shadow-window rounded-2xl flex flex-col',
          'transition-all duration-300 ease-glass transform',
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'
        )}
      >
        {/* Tab Bar */}
        <div className="flex items-center justify-between px-2 py-2 border-b border-black/[0.06] bg-black/[0.01]">
          <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto">
            {tabs.map((tab) => {
              const meta = SERVICE_META[tab.service]
              const isActive = tab.id === activeTabId
              return (
                <div
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  data-testid={`tab-${tab.service}`}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold',
                    'transition-colors select-none whitespace-nowrap',
                    isActive
                      ? 'bg-white border border-black/[0.08] shadow-card text-arch-text-primary'
                      : 'text-arch-text-muted hover:text-arch-text-secondary hover:bg-black/[0.03]'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => activateTab(tab.id)}
                    className="flex items-center gap-1.5"
                  >
                    {meta.Icon}
                    <span>{meta.shortLabel}</span>
                  </button>
                  <button
                    type="button"
                    data-testid={`close-tab-${tab.service}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      closeTab(tab.id)
                    }}
                    className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center hover:bg-black/[0.08] transition-colors"
                    aria-label={`Close ${meta.shortLabel} tab`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Global close */}
          <button
            type="button"
            onClick={closeAll}
            className="w-6 h-6 rounded-full flex items-center justify-center bg-black/[0.04] hover:bg-black/[0.08] transition-colors shrink-0 ml-1"
            aria-label="Close all tabs"
            title="Close all"
          >
            <X className="w-3.5 h-3.5 text-arch-text-secondary" />
          </button>
        </div>

        {/* Pane Contents */}
        <div
          className={cn(
            'flex-1 min-h-0',
            activeTab?.service === 'github' ? 'overflow-y-auto' : 'overflow-hidden'
          )}
        >
          {activeTab?.service === 'github' && <GitHubMockView />}
          {activeTab?.service === 'whatsapp' && <WhatsAppWebView />}
        </div>
      </div>
    </div>
  )
}

/* ─────────────────────────── GitHub Mock View ─────────────────────────── */

function GitHubMockView() {
  const [tab, setTab] = useState<'code' | 'pulls' | 'issues'>('code')

  const commits = [
    {
      hash: '7d0a059',
      msg: 'chore: clean build artifacts, fix pre-commit hook, format project',
      author: 'Timothy',
      date: 'Today, 09:17',
    },
    {
      hash: 'f2b33cf',
      msg: 'wip: sync accumulated changes across portal, cms, overview, and packages',
      author: 'Timothy',
      date: 'Yesterday, 14:32',
    },
    {
      hash: 'c87f5f0',
      msg: 'fix: add missing ESLint configs for cms/overview, fix lint errors',
      author: 'Timothy',
      date: '2 days ago',
    },
  ]

  return (
    <div className="p-4 space-y-4 text-[13px]">
      {/* Branch & Status */}
      <div className="flex items-center justify-between bg-black/[0.02] border border-black/[0.05] p-3 rounded-xl">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-arch-text-secondary" />
          <span className="font-semibold text-arch-text-primary">master</span>
        </div>
        <div className="flex items-center gap-1.5 text-arch-accent-green font-medium">
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <span>CI Quality Gate Passed</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black/[0.06] text-[12px] font-semibold text-arch-text-muted">
        <button
          type="button"
          onClick={() => setTab('code')}
          className={cn(
            'pb-2 px-3 border-b-2 transition-all',
            tab === 'code'
              ? 'border-arch-accent-charcoal text-arch-accent-charcoal'
              : 'border-transparent hover:text-arch-text-secondary'
          )}
        >
          Commits
        </button>
        <button
          type="button"
          onClick={() => setTab('pulls')}
          className={cn(
            'pb-2 px-3 border-b-2 transition-all',
            tab === 'pulls'
              ? 'border-arch-accent-charcoal text-arch-accent-charcoal'
              : 'border-transparent hover:text-arch-text-secondary'
          )}
        >
          Pull Requests (1)
        </button>
        <button
          type="button"
          onClick={() => setTab('issues')}
          className={cn(
            'pb-2 px-3 border-b-2 transition-all',
            tab === 'issues'
              ? 'border-arch-accent-charcoal text-arch-accent-charcoal'
              : 'border-transparent hover:text-arch-text-secondary'
          )}
        >
          Issues (2)
        </button>
      </div>

      {/* Tab Content */}
      <div className="space-y-3">
        {tab === 'code' && (
          <div className="space-y-2.5">
            <p className="font-semibold text-[11px] text-arch-text-muted uppercase tracking-wider">
              Recent Commits
            </p>
            {commits.map((c) => (
              <div
                key={c.hash}
                className="bg-black/[0.015] border border-black/[0.04] p-3 rounded-lg flex flex-col gap-1 hover:bg-black/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-600 hover:underline cursor-pointer">
                    {c.hash}
                  </span>
                  <span className="text-[11px] text-arch-text-muted">{c.date}</span>
                </div>
                <p className="text-[12px] text-arch-text-primary leading-snug">{c.msg}</p>
                <span className="text-[10px] text-arch-text-muted">By {c.author}</span>
              </div>
            ))}
          </div>
        )}

        {tab === 'pulls' && (
          <div className="bg-black/[0.015] border border-black/[0.04] p-4 rounded-lg space-y-2">
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 text-arch-accent-green mt-0.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <div>
                <p className="font-bold text-[13px] text-arch-text-primary leading-snug">
                  #104 Feature: Centered Connection Status & Clock Calendar Popover
                </p>
                <p className="text-[11px] text-arch-text-muted mt-1">
                  Opened by Timothy • 3 checks passed
                </p>
              </div>
            </div>
          </div>
        )}

        {tab === 'issues' && (
          <div className="space-y-2">
            <div className="bg-black/[0.015] border border-black/[0.04] p-3 rounded-lg flex items-start gap-2">
              <svg
                className="w-4 h-4 text-amber-500 mt-0.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div>
                <p className="font-bold leading-snug text-arch-text-primary">
                  #102 Alignment problem in ServicesDropdown
                </p>
                <p className="text-[10.5px] text-arch-text-muted mt-0.5">
                  Reported by Oper-3 • High priority
                </p>
              </div>
            </div>
            <div className="bg-black/[0.015] border border-black/[0.04] p-3 rounded-lg flex items-start gap-2">
              <svg
                className="w-4 h-4 text-blue-500 mt-0.5 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <div>
                <p className="font-bold leading-snug text-arch-text-primary">
                  #98 Setup persistent location coordinates for weather widget
                </p>
                <p className="text-[10.5px] text-arch-text-muted mt-0.5">
                  Reported by ITAdmin • Backlog
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─────────────────────────── WhatsApp Web View ─────────────────────────── */

function WhatsAppWebView() {
  return (
    <div className="w-full h-full bg-white flex flex-col items-stretch justify-stretch">
      <iframe
        src="https://web.whatsapp.com"
        title="WhatsApp Web"
        className="w-full h-full border-0"
        allow="clipboard-read; clipboard-write; camera; microphone; geolocation"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads allow-modals"
      />
    </div>
  )
}
