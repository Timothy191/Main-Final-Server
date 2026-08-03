# Vercel-family asset sources

Canonical page: https://vercel.com/geist/brands

| Brand  | Zip download                                                                                               | Light SVG (preferred)                     |
| ------ | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Vercel | [vercel-assets.zip](https://k2mkucxia43oc7fa.public.blob.vercel-storage.com/front/press/vercel-assets.zip) | `Vercel/icon/light/vercel-icon-light.svg` |
| eve    | [eve-assets.zip](https://k2mkucxia43oc7fa.public.blob.vercel-storage.com/front/press/eve-assets.zip)       | `eve/light/eve-logo-light.svg`            |
| v0     | [v0-assets.zip](https://k2mkucxia43oc7fa.public.blob.vercel-storage.com/front/press/v0-assets.zip)         | `v0/Light/v0-logo-light.svg`              |

## Repo copies

Stored under `apps/portal/public/branding/ai/`:

- `vercel.svg` — triangle symbol
- `eve.svg` — E/E bar logotype
- `v0.svg` — v0 logotype

## Brand rules

- **eve** — always lowercase in UI copy, URLs, and labels (never Eve or EVE)
- Do not modify official SVG paths or colors beyond SVGO cleanup
- No `@vercel/geistcn-assets` unless design-phase approves new dependency
- Usage: truthful attribution only (hosted on / uses Vercel products)

## Shared config

`apps/portal/src/config/vercel-brands.ts` — single source for taskbar + login marquee sizes.
