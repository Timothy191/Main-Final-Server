'use client'

import React from 'react'

interface DropdownMenuContextValue {
  open: boolean
  setOpen: (next: boolean) => void
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null)

function useDropdownMenuContext(): DropdownMenuContextValue {
  const ctx = React.useContext(DropdownMenuContext)
  if (!ctx) {
    return { open: false, setOpen: () => {} }
  }
  return ctx
}

interface DropdownMenuProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : uncontrolledOpen
  const rootRef = React.useRef<HTMLDivElement>(null)

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [isControlled, onOpenChange]
  )

  React.useEffect(() => {
    if (!currentOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [currentOpen, setOpen])

  const value = React.useMemo<DropdownMenuContextValue>(
    () => ({ open: currentOpen, setOpen }),
    [currentOpen, setOpen]
  )

  return (
    <DropdownMenuContext.Provider value={value}>
      <div ref={rootRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

interface DropdownMenuTriggerProps {
  children: React.ReactElement | React.ReactNode
  asChild?: boolean
}

export function DropdownMenuTrigger({ children, asChild }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useDropdownMenuContext()

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        setOpen(!open)
      },
    })
  }

  return (
    <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
      {children}
    </button>
  )
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
  align?: 'start' | 'end' | 'center'
  sideOffset?: number
}

export function DropdownMenuContent({
  children,
  className,
  align = 'end',
  sideOffset = 4,
}: DropdownMenuContentProps) {
  const { open } = useDropdownMenuContext()

  if (!open) return null

  const alignment =
    align === 'end' ? 'right-0' : align === 'start' ? 'left-0' : 'left-1/2 -translate-x-1/2'
  const base = `absolute ${alignment} z-50`
  const fallback =
    'w-56 origin-top-right rounded-md bg-white/80 backdrop-blur-xl border border-white/40 shadow-window focus:outline-none'

  return (
    <div
      role="menu"
      style={{ marginTop: sideOffset }}
      className={`${base} ${className ?? fallback}`}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps {
  children: React.ReactElement | React.ReactNode
  onSelect?: (e: React.SyntheticEvent) => void
  onClick?: (e: React.MouseEvent) => void
  className?: string
  asChild?: boolean
}

export function DropdownMenuItem({
  children,
  onSelect,
  onClick,
  className,
  asChild,
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdownMenuContext()

  const handleSelect = (e: React.SyntheticEvent) => {
    onSelect?.(e)
    setOpen(false)
  }

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        handleSelect(e)
      },
    })
  }

  return (
    <button
      type="button"
      role="menuitem"
      onClick={(e) => {
        onClick?.(e)
        handleSelect(e)
      }}
      className={
        className ?? 'block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100'
      }
    >
      {children}
    </button>
  )
}

export function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={className ?? 'border-t border-gray-100 my-1'} />
}

export function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

export function DropdownMenuSubTrigger({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function DropdownMenuSubContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={className}>{children}</div>
}

export function DropdownMenuPortal({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
