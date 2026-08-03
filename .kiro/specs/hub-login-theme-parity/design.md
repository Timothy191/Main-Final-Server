# Hub ↔ Login Theme Parity — Design

## Architecture

Reuse existing theme SSOT; do not invent a third token family.

| Surface        | Login source                                          | Hub target                                                  |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Shell glass    | `.os-shell`, `--os-shell-*`, `--login-shell-*`        | Hero panel, telemetry card, section shells                  |
| Controls / CTA | `.login-cta`, `.login-oauth`, field tokens            | `HeroRotator` primary/secondary                             |
| Text           | `.login-muted-text`, `.login-text-emphasis`, wordmark | Eyebrow pills, body copy, section titles                    |
| Effects        | Gold focus glow, `os-shell-enter`, liquid glass       | Optional focus-within on hero; keep `animate-fade-up` light |
| Ambient        | Route / login backdrop grain                          | `HeroBackground` — light grain + soft blobs only            |

## Files

- `apps/portal/src/app/hub/layout.tsx` — main wrapper token classes
- `apps/portal/src/app/hub/page.tsx` — hero / section chrome
- `apps/portal/src/features/hub/components/HeroRotator.tsx`
- `apps/portal/src/features/hub/components/HeroBackground.tsx`
- `apps/portal/src/features/hub/components/DepartmentCard.tsx`
- `packages/theme/src/css/glass.css` / `cards.css` / `variables.css` — only if hub needs shared utility (prefer class reuse)

## Boundaries

- Server layout/page stay server; client leaves for rotator/background/cards.
- No secrets; visual-only.

## Token strategy

Prefer mapping hub classes → existing `--os-shell-*` / selective `--login-*`. Add `--hub-*` only if design proves a gap.

## Reference

User mock: light frosted cards + soft aurora + colored dept banners. Translate as light glass parity with login, keep vivid dept banners inside glass cards.
