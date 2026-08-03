/**
 * TrustLogos — Hero trust section component.
 *
 * Renders a row of partner/accreditation logos. When no logo assets are
 * available, falls back to styled text badges so the section never looks
 * broken.
 *
 * Usage:
 *   <TrustLogos logos={[
 *     { src: "/logo/arch-mining.svg", alt: "Arch Mining" },
 *     { src: "/logo/iso-27001.svg",  alt: "ISO 27001 Certified" },
 *   ]} />
 *
 * TASK: Replace placeholder text badges with official SVG assets once
 *       brand team provides them in /public/logo/.
 *       Track: https://github.com/your-org/Arch-Mk2/issues/[issue-number]
 */

import Image from 'next/image'
import { Building2, Cpu, ShieldCheck, type LucideIcon } from 'lucide-react'
import { Logo } from '@repo/ui/Logo'
import { cn } from '@repo/ui/lib/utils'
import { semanticIconClass } from '@/lib/semantic-icon'

interface TrustLogo {
  src: string
  alt: string
}

interface TrustLogosProps {
  logos?: TrustLogo[]
}

interface TrustPlaceholder {
  label: string
  icon: LucideIcon | 'arch-logo'
}

const Sparkles = Building2
const Database = Cpu

const PLACEHOLDERS: TrustPlaceholder[] = [
  { label: 'Arch Systems', icon: 'arch-logo' },
  { label: 'Caterpillar', icon: Sparkles },
  { label: 'Komatsu', icon: ShieldCheck },
  { label: 'Deere', icon: Cpu },
  { label: 'Hitachi', icon: Database },
]

const TRUST_BADGE_CLASS =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border border-arch-border-primary bg-arch-surface-secondary/40 text-arch-text-secondary select-none'

function TrustBadgeIcon({ icon }: { icon: TrustPlaceholder['icon'] }) {
  if (icon === 'arch-logo') {
    return <Logo className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
  }
  const Icon = icon
  return (
    <Icon className={cn('w-3.5 h-3.5 shrink-0', semanticIconClass('neutral'))} aria-hidden="true" />
  )
}

export function TrustLogos({ logos }: TrustLogosProps) {
  const hasLogos = logos && logos.length > 0

  return (
    <div className="pt-6 border-t border-arch-border-subtle">
      <p className="font-display text-[11px] font-normal uppercase tracking-[0.18em] text-text-heading mb-3">
        Trusted by forward-thinking teams
      </p>

      {hasLogos ? (
        <div className="flex flex-wrap items-center gap-4 opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
          {logos.map((logo) => (
            <Image
              key={logo.src}
              src={logo.src}
              alt={logo.alt}
              className="h-6 w-auto object-contain"
              width={96}
              height={24}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {PLACEHOLDERS.map((p) => (
            <span key={p.label} className={TRUST_BADGE_CLASS}>
              <TrustBadgeIcon icon={p.icon} />
              {p.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
