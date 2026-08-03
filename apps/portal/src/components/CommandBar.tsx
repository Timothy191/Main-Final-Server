'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@repo/ui/lib/utils'
import { getServiceUrls } from '@repo/ui/lib/urls'

const urls = getServiceUrls()
import {
  Search,
  X,
  Pickaxe,
  Factory,
  Shield,
  ShieldCheck,
  Wrench,
  Monitor,
  GraduationCap,
  Satellite,
  LayoutDashboard,
  Settings,
  LogOut,
  User,
  Workflow,
  Bot,
} from 'lucide-react'

interface CommandItem {
  id: string
  label: string
  shortcut?: string
  href?: string
  action?: () => void
  category: string
  icon?: React.ReactNode
}

const DEPARTMENT_COMMANDS: CommandItem[] = [
  {
    id: 'dept-drilling',
    label: 'Drilling Operations',
    href: '/drilling',
    category: 'Departments',
    icon: <Pickaxe className="w-4 h-4" />,
  },
  {
    id: 'dept-production',
    label: 'Production',
    href: '/production',
    category: 'Departments',
    icon: <Factory className="w-4 h-4" />,
  },
  {
    id: 'dept-control',
    label: 'Control Room',
    href: '/control-room',
    category: 'Departments',
    icon: <Monitor className="w-4 h-4" />,
  },
  {
    id: 'dept-safety',
    label: 'Safety Dashboard',
    href: '/safety',
    category: 'Departments',
    icon: <Shield className="w-4 h-4" />,
  },
  {
    id: 'dept-engineering',
    label: 'Engineering',
    href: '/engineering',
    category: 'Departments',
    icon: <Wrench className="w-4 h-4" />,
  },
  {
    id: 'dept-access',
    label: 'Access Control',
    href: '/access-control',
    category: 'Departments',
    icon: <ShieldCheck className="w-4 h-4" />,
  },
  {
    id: 'dept-training',
    label: 'Training',
    href: '/training',
    category: 'Departments',
    icon: <GraduationCap className="w-4 h-4" />,
  },
  {
    id: 'dept-satellite',
    label: 'Satellite Monitoring',
    href: '/satellite-monitoring',
    category: 'Departments',
    icon: <Satellite className="w-4 h-4" />,
  },
]

const NAV_COMMANDS: CommandItem[] = [
  {
    id: 'nav-hub',
    label: 'Hub Dashboard',
    href: '/',
    category: 'Navigation',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: 'nav-profile',
    label: 'Profile',
    href: '/admin',
    category: 'Navigation',
    icon: <User className="w-4 h-4" />,
  },
  {
    id: 'nav-settings',
    label: 'Settings',
    href: '/admin',
    category: 'Navigation',
    icon: <Settings className="w-4 h-4" />,
  },
  {
    id: 'nav-logout',
    label: 'Log Out',
    action: () => {
      fetch('/api/auth/logout', { method: 'POST' })
        .then(() => {
          window.location.href = '/login'
        })
        .catch(console.error)
    },
    category: 'Navigation',
    icon: <LogOut className="w-4 h-4" />,
  },
]

const TOOLS_COMMANDS: CommandItem[] = [
  {
    id: 'tool-n8n',
    label: 'n8n',
    href: `${urls.api}`,
    category: 'Tools',
    icon: <Workflow className="w-4 h-4" />,
  },
  {
    id: 'tool-flowise',
    label: 'Flowise',
    href: `${urls.portal}`,
    category: 'Tools',
    icon: <Bot className="w-4 h-4" />,
  },
]

const ALL_COMMANDS = [...DEPARTMENT_COMMANDS, ...NAV_COMMANDS, ...TOOLS_COMMANDS]

export function CommandBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const filtered = ALL_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase())
  )

  const grouped = filtered.reduce<Record<string, CommandItem[]>>((acc, cmd) => {
    const list = (acc[cmd.category] ??= [])
    list.push(cmd)
    return acc
  }, {})

  const flatList = Object.values(grouped).flat()

  const handleSelect = useCallback(
    (item: CommandItem) => {
      setOpen(false)
      setQuery('')
      if (item.href) {
        if (item.href.startsWith('http')) {
          window.open(item.href, '_blank', 'noopener,noreferrer')
        } else {
          router.push(item.href)
        }
      }
      if (item.action) item.action()
    },
    [router]
  )

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    const onOpenEvent = () => {
      setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('arch-open-command-bar', onOpenEvent)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('arch-open-command-bar', onOpenEvent)
    }
  }, [])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    if (!open || flatList.length === 0) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % flatList.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + flatList.length) % flatList.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const item = flatList[selectedIndex]
        if (item) handleSelect(item)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, flatList, selectedIndex, handleSelect])

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-overlay flex items-start justify-center pt-[20vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg mx-4 rounded-2xl liquid-glass-light border border-white/40 shadow-window overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/20 bg-transparent">
          <Search className="w-4 h-4 text-arch-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search departments, tools, or pages..."
            className="flex-1 bg-transparent text-sm text-arch-text-primary placeholder:text-arch-text-tertiary outline-none"
          />
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-md hover:bg-arch-surface-tertiary text-arch-text-tertiary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {flatList.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-arch-text-tertiary">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 py-1.5 text-[10px] font-bold text-arch-text-tertiary uppercase tracking-wider">
                  {category}
                </div>
                {items.map((item) => {
                  const globalIndex = flatList.indexOf(item)
                  const isSelected = globalIndex === selectedIndex
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-arch-accent-blue/10 text-arch-accent-blue'
                          : 'text-arch-text-secondary hover:bg-arch-surface-tertiary'
                      )}
                    >
                      <span
                        className={cn(
                          'shrink-0',
                          isSelected ? 'text-arch-accent-blue' : 'text-arch-text-tertiary'
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="flex-1 text-sm font-medium">{item.label}</span>
                      {item.shortcut && (
                        <kbd className="px-1.5 py-0.5 rounded bg-arch-surface-tertiary text-[10px] font-mono text-arch-text-tertiary">
                          {item.shortcut}
                        </kbd>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-arch-border-subtle text-[10px] text-arch-text-tertiary">
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-arch-surface-tertiary font-mono">↑</kbd>
            <kbd className="px-1 rounded bg-arch-surface-tertiary font-mono">↓</kbd>
            to navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1 rounded bg-arch-surface-tertiary font-mono">Enter</kbd>
            to select
          </span>
        </div>
      </div>
    </div>
  )
}
