# Vercel-family logo placement

## Active (implemented)

| Surface              | Component           | Slot                                                                                      |
| -------------------- | ------------------- | ----------------------------------------------------------------------------------------- |
| Global taskbar       | `PartnerBrandStrip` | `ArchMacMenuBar` `leftSlot` — Vercel + Turborepo + v0 (left cluster after traffic lights) |
| Login eve notice     | `LoginEveNotice`    | Login card body, replaces VPN notice                                                      |
| Login footer marquee | `LoginBrandBanner`  | Imports `VERCEL_FAMILY_MARQUEE_BRANDS` from config                                        |

## Future (out of scope unless requested)

| Surface            | Component          | Notes                                             |
| ------------------ | ------------------ | ------------------------------------------------- |
| Hub trust row      | `TrustLogos`       | Pass logos prop on hub page                       |
| Start menu footer  | `ArchStartMenu`    | Partner row at panel bottom                       |
| Department sidebar | `DepartmentLayout` | Only if product requires persistent partner strip |

## Styling

- Taskbar opacity: `.taskbar-partner-logos` in `packages/theme/src/css/glass.css`
- Login marquee: `.login-footer-logos` (existing)
