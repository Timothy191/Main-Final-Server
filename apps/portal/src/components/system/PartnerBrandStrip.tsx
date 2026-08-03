import Image from 'next/image'
import Link from 'next/link'
import { TASKBAR_PARTNER_BRANDS, type PartnerBrand } from '@/config/vercel-brands'

interface PartnerBrandStripProps {
  variant: 'taskbar' | 'inline'
  brands?: PartnerBrand[]
  className?: string
}

function BrandIcon({ brand, compact }: { brand: PartnerBrand; compact: boolean }) {
  const image = (
    <Image
      src={brand.src}
      alt=""
      width={brand.width}
      height={brand.height}
      className={
        compact ? 'h-3.5 w-auto max-h-3.5 object-contain' : 'h-5 w-auto max-w-[5rem] object-contain'
      }
      style={{ width: 'auto', height: 'auto' }}
      unoptimized
    />
  )

  if (!brand.href) {
    return image
  }

  return (
    <Link
      href={brand.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Visit ${brand.name}`}
      className="rounded-sm outline-none transition-opacity hover:opacity-100 focus-visible:ring-2 focus-visible:ring-arch-accent-charcoal/50"
    >
      {image}
    </Link>
  )
}

/**
 * Platform partner marks for taskbar left cluster (Vercel · Turborepo · v0).
 */
export function PartnerBrandStrip({
  variant,
  brands = TASKBAR_PARTNER_BRANDS,
  className = '',
}: PartnerBrandStripProps) {
  const compact = variant === 'taskbar'

  if (!compact) {
    return (
      <nav
        aria-label="Platform partners"
        className={`flex items-center gap-2.5 ${className}`.trim()}
      >
        {brands.map((brand) => (
          <BrandIcon key={brand.name} brand={brand} compact={false} />
        ))}
      </nav>
    )
  }

  return (
    <nav
      aria-label="Platform partners"
      className={`taskbar-partner-logos flex h-[22px] items-center gap-2 rounded-full border border-border-subtle bg-black/[0.03] px-2 ${className}`.trim()}
    >
      {brands.map((brand, index) => (
        <span key={brand.name} className="flex items-center gap-2">
          {index > 0 ? <span aria-hidden className="h-3 w-px shrink-0 bg-border-subtle" /> : null}
          <BrandIcon brand={brand} compact={compact} />
        </span>
      ))}
    </nav>
  )
}
