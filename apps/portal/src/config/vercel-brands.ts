export interface PartnerBrand {
  src: string
  name: string
  width: number
  height: number
  href?: string
}

/** Official Vercel-family marks — source: vercel.com/geist/brands */
export const VERCEL_FAMILY_BRANDS: PartnerBrand[] = [
  {
    src: '/branding/ai/vercel.svg',
    name: 'Vercel',
    width: 16,
    height: 16,
    href: 'https://vercel.com',
  },
  {
    src: '/branding/ai/eve.svg',
    name: 'eve',
    width: 44,
    height: 16,
    href: 'https://eve.dev',
  },
  {
    src: '/branding/ai/v0.svg',
    name: 'v0',
    width: 34,
    height: 16,
    href: 'https://v0.app',
  },
]

/** Taskbar strip — eve lives on the login card notice. Platform stack: Vercel → Turborepo → v0. */
export const TASKBAR_PARTNER_BRANDS: PartnerBrand[] = [
  {
    src: '/branding/ai/vercel.svg',
    name: 'Vercel',
    width: 16,
    height: 16,
    href: 'https://vercel.com',
  },
  {
    src: '/branding/ai/turborepo.svg',
    name: 'Turborepo',
    width: 16,
    height: 16,
    href: 'https://turbo.build/repo',
  },
  {
    src: '/branding/ai/v0.svg',
    name: 'v0',
    width: 34,
    height: 16,
    href: 'https://v0.app',
  },
]

export const EVE_BRAND: PartnerBrand = VERCEL_FAMILY_BRANDS.find((brand) => brand.name === 'eve')!

/** Marquee sizing for login footer (wider logotypes). */
export const VERCEL_FAMILY_MARQUEE_BRANDS: PartnerBrand[] = VERCEL_FAMILY_BRANDS.map((brand) => ({
  ...brand,
  width: brand.name === 'Vercel' ? 20 : brand.name === 'eve' ? 55 : 42,
  height: 20,
}))
