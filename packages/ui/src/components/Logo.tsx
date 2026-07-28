import Image from 'next/image'
import { cn } from '../lib/utils'

interface LogoProps {
  className?: string
  /** Retained for API compatibility; the official logo no longer uses stencil slits. */
  variant?: 'default' | 'display' | 'focus'
  /** Retained for API compatibility. */
  stencilId?: string
}

/** Official Arch Linux crystal icon — downloaded from the Arch Linux artwork repository. */
export function Logo({ className, variant = 'default', stencilId = 'default' }: LogoProps) {
  void variant
  void stencilId

  return (
    <Image
      src="/logo.svg"
      alt="Arch Linux logo"
      width={128}
      height={128}
      className={cn('h-full w-auto object-contain', className)}
      aria-hidden="true"
    />
  )
}
