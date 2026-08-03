import Image from 'next/image'
import { cn } from '../lib/utils'

interface LogoProps {
  className?: string
  /** Retained for API compatibility; the official logo no longer uses stencil slits. */
  variant?: 'default' | 'display' | 'focus'
  /** Retained for API compatibility. */
  stencilId?: string
}

/** Official BlackArch Linux logo — downloaded from the BlackArch artwork repository. */
export function Logo({ className, variant = 'default', stencilId = 'default' }: LogoProps) {
  void variant
  void stencilId

  return (
    <Image
      src="/logo-blackarch.png"
      alt="BlackArch Linux logo"
      width={128}
      height={128}
      className={cn('h-full w-auto object-contain', className)}
      aria-hidden="true"
    />
  )
}
