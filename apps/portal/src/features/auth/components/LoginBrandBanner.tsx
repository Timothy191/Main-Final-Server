import Image from 'next/image'
import { Marquee } from '@repo/ui/Marquee'
import { VERCEL_FAMILY_MARQUEE_BRANDS } from '@/config/vercel-brands'

interface BrandLogo {
  src?: string
  name: string
  width: number
  height: number
}

const BRAND_LOGOS: BrandLogo[] = [
  { src: '/logo.svg', name: 'Arch', width: 72, height: 20 },
  { src: '/archlinux-logo-black-scalable.svg', name: 'Arch Linux', width: 72, height: 20 },
  { name: 'Plantcor', width: 80, height: 22 },
  { src: '/branding/ai/anthropic.svg', name: 'Anthropic', width: 20, height: 20 },
  { src: '/branding/ai/google.svg', name: 'Google', width: 20, height: 20 },
  { src: '/branding/ai/github.svg', name: 'GitHub', width: 20, height: 20 },
  ...VERCEL_FAMILY_MARQUEE_BRANDS,
]

/**
 * Animated brand / AI-provider logo strip for the login card footer.
 */
export function LoginBrandBanner() {
  const maskStyle = {
    maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
    WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
  }

  return (
    <div className="w-full">
      <p className="login-footer mb-2 text-center login-muted-text text-[13px] font-medium tracking-wide select-none leading-relaxed px-1">
        Plantcor Mainframe · Powered by Arch Systems · Integrated Intelligence
      </p>
      <div
        role="separator"
        aria-hidden="true"
        className="login-footer-divider mx-auto mb-2.5 h-px w-full max-w-[280px] bg-border-subtle"
      />
      <div
        className="login-footer-logos w-full overflow-hidden py-1"
        style={maskStyle}
        role="region"
        aria-label="Partner and AI provider brands"
      >
        <Marquee pauseOnHover className="[--duration:42s] [--gap:0.75rem] p-0">
          {BRAND_LOGOS.flatMap((logo, index) => {
            const key = logo.src ?? logo.name
            const item = (
              <div key={key} className="flex h-8 shrink-0 items-center gap-2" title={logo.name}>
                {logo.src ? (
                  <Image
                    src={logo.src}
                    alt=""
                    width={logo.width}
                    height={logo.height}
                    className="h-5 w-auto max-w-[5rem] object-contain"
                    style={{ width: 'auto', height: 'auto' }}
                    unoptimized
                  />
                ) : null}
                <span className="whitespace-nowrap login-muted-text text-[13px] font-medium tracking-wide">
                  {logo.name}
                </span>
              </div>
            )

            if (index === 0) return [item]

            return [
              <span
                key={`sep-${key}`}
                aria-hidden
                className="flex h-8 shrink-0 items-center login-muted-text text-[13px] leading-none select-none"
              >
                |
              </span>,
              item,
            ]
          })}
        </Marquee>
      </div>
    </div>
  )
}
