'use client'

import { MacMenuBar } from '@repo/ui/MacMenuBar'
import { ArchStartMenu } from '@/components/system/ArchStartMenu'

interface ArchMacMenuBarProps {
  leftSlot?: React.ReactNode
  rightSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  className?: string
}

/**
 * Portal taskbar: MacMenuBar with Windows 11–style Arch Start menu.
 * Client wrapper so the appMenu render prop is not passed from a Server Component.
 */
export function ArchMacMenuBar({
  leftSlot,
  rightSlot,
  centerSlot,
  className,
}: ArchMacMenuBarProps) {
  return (
    <MacMenuBar
      className={className}
      leftSlot={leftSlot}
      centerSlot={centerSlot}
      rightSlot={rightSlot}
      appMenu={({ close }) => <ArchStartMenu onClose={close} />}
    />
  )
}
