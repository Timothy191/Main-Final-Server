# Composition rules (branded / landing)

- **One composition** — first viewport reads as one unit, not a dashboard
- **Brand first** — product name is hero-level; no headline overpowers brand
- **Brand test** — without nav, viewport still reads as this brand
- **Typography** — expressive `next/font`; avoid Inter/Roboto/Arial for display
- **Background** — no flat single-color; use gradient, imagery, or pattern
- **Full-bleed hero** — edge-to-edge plane; no inset/floating hero cards
- **Hero budget** — brand + headline + one sentence + CTA + one image only
- **No hero overlays** — no floating badges/stickers on hero media
- **Cards** — default none in hero; only when interaction requires
- **One job per section** — one headline, one supporting sentence
- **Motion** — 2–3 intentional motions; Framer sparingly
- **Responsive** — desktop + mobile

## In-app product UI

Light-only macOS glass from `@repo/theme`. SSOT: `apps/portal/src/app/(auth)/login/page.tsx` — `--os-shell-*`, `--login-*` (DECISIONS #003 / #010).
