# Compression Agent — Initial Dry Run

Mode: **dry-run** (no writes, no deletes, no commits)
Agent spec: `.qoder/agents/compression-agent.md`
Scope requested: `apps/portal/public/**`, `packages/*/assets/**` (png|jpg|jpeg|gif|svg)

## 1. Scope discovery

- `apps/portal/public/**` — 38 matching image files, 1,914,087 bytes total (~1.83 MiB).
- `packages/*/assets/**` — no such directory exists in this monorepo. Packages present under `packages/`: `contract`, `database`, `departments`, `errors`, `eslint-config`, `llm-config`, `logger`, `rate-limiter`, `redis`, `supabase`, `theme`, `typescript-config`, `ui`, `utils`. None ship an `assets/` folder. Nothing to scan there.
- `.compressignore` files: **none present** anywhere in scope (checked `apps/portal/public/**` and `packages/**`).
- Modern-format siblings (`.webp` / `.avif`): **none present** in the scope. Every candidate below has an empty "modern sibling" column.
- Reference grep target: `apps/portal/src/**` and `packages/**/src/**` (extensions `ts, tsx, js, jsx, json, css, html, mdx, md`), matching on basename.

## 2. Tooling probe

| Tool       | Present? | Path        |
| ---------- | -------- | ----------- |
| `cwebp`    | **NO**   | not found   |
| `avifenc`  | **NO**   | not found   |
| `svgo`     | **NO**   | not found   |
| `exiftool` | **NO**   | not found   |
| `file`     | yes      | `/usr/bin/file` |

None of the compression toolchain is installed. Per the agent spec, the exact install command to run before an `--apply` pass is:

```bash
sudo apt install webp libavif-bin svgo exiftool
```

(Debian/Ubuntu package names: `webp` provides `cwebp`, `libavif-bin` provides `avifenc`, `svgo` and `exiftool` are named after the binaries. On Arch/derivatives the equivalents are `pacman -S libwebp libavif svgo perl-image-exiftool`.)

Because every relevant tool is missing, an `--apply` run today would immediately stop per the agent guardrail ("If no tool is installed, emit the exact install command … and stop — never silently skip"). This dry run therefore only inventories opportunities.

## 3. Classification legend

- **Brand-review**: file path or basename contains `logo`, `wordmark`, `favicon`, or sits under `branding/` / `brand/`. Also flagged: `plantcor*` (Plantcor wordmark) and `company-branding.*` (basename contains `branding`). No lossy transform allowed per agent guardrail; awaits designer sign-off.
- **Referenced**: basename found by grep in `apps/portal/src/**` or `packages/**/src/**`.
- **Est. savings** (bytes): mechanical estimate per the requested formulae —
  - PNG → WebP q82, non-icon PNGs > 50 KB → 70% reduction
  - JPEG → AVIF, JPEGs > 100 KB → 80% reduction
  - SVGO on SVGs > 5 KB → 30% reduction
  - Files < 20 KB → 0
- The estimate is computed regardless of the brand flag; the "Risk" column indicates whether the savings are *actionable* now or blocked pending designer approval.

## 4. Candidates (top 30, sorted by est. savings desc, then size desc)

| # | Path | Size (B) | Format | Modern sibling? | Referenced by src? | Brand? | Est. savings (B) | Risk / Notes |
|---|------|---------:|--------|:---------------:|--------------------|:------:|-----------------:|--------------|
| 1 | `apps/portal/public/assets/company-branding.jpeg` | 970,563 | JPEG 2880×1440 | no | none found | **YES** (basename contains `branding`) | 776,450 | **brand-review** — largest file in repo public/; JPEG→AVIF theoretically saves ~758 KiB but requires designer sign-off (lossy). Orphan candidate too — no live reference from `apps/portal/src/**` (only appears in `AGENT_TRACER.md` history). Confirm intended use before touching. |
| 2 | `apps/portal/public/assets/focused/focused.jpeg` | 568,435 | JPEG 1344×796 | no | none found | no | 454,748 | Safe to convert to AVIF (or WebP fallback). Orphan candidate: no live reference in `apps/portal/src/**` (only `AGENT_TRACER.md` mentions a `focused-mode.mp4` sibling). Verify usage before overwrite. |
| 3 | `apps/portal/public/archlinux-logo-black-1200dpi.png` | 127,411 | PNG | no | none found | **YES** (`logo`) | 89,188 | **brand-review** — Arch Linux logo asset. Lossy PNG→WebP blocked; consider `optipng`/`zopflipng` (lossless) instead, ~10–20% typical gain. |
| 4 | `apps/portal/public/plantcor.png` | 38,654 | PNG | no | none found | **YES** (`plantcor` wordmark) | 0 | Below 50 KB PNG threshold. Brand-review anyway. Orphan candidate. |
| 5 | `apps/portal/public/auth-bg-poster.jpg` | 28,879 | JPEG 1920×1080 | no | `apps/portal/src/components/RouteBackground.tsx` | no | 0 | Below 100 KB JPEG threshold per rules. In practice AVIF still typically saves 30–50% here (~10–14 KiB); worth revisiting after tools installed. Contains `Lavc62.28.102` FFmpeg comment — `exiftool -all=` would strip. |
| 6 | `apps/portal/public/assets/logo.png` | 20,258 | PNG | no | `apps/portal/src/proxy.test.ts` (string `/assets/logo.png`) | **YES** (`logo`) | 0 | Below 50 KB threshold. Brand-review. |
| 7 | `apps/portal/public/assets/logo-large.png` | 20,258 | PNG | no | none found | **YES** (`logo`) | 0 | Below threshold. Brand-review. Likely duplicate of #6 (same byte size). |
| 8 | `apps/portal/public/assets/logo-1.png` | 20,258 | PNG | no | none found | **YES** (`logo`) | 0 | Below threshold. Brand-review. Likely duplicate of #6/#7. |
| 9 | `apps/portal/public/assets/auth-bg-poster.jpg` | 18,813 | JPEG 854×480 | no | `apps/portal/src/components/RouteBackground.tsx` | no | 0 | Under 20 KB → no estimate. Smaller-resolution twin of #5. |
| 10 | `apps/portal/public/assets/arch_logo_background.png` | 14,168 | PNG | no | none found | **YES** (`logo`) | 0 | Below threshold. Brand-review. Duplicate of #11. |
| 11 | `apps/portal/public/arch_logo_background.png` | 14,168 | PNG | no | none found | **YES** (`logo`) | 0 | Below threshold. Brand-review. Duplicate of #10. |
| 12 | `apps/portal/public/icons/icon-512x512.png` | 13,338 | PNG | no | none found (referenced indirectly via `manifest.json`) | icon (PWA) | 0 | Under 20 KB. PWA icon — `manifest.json` requires PNG. Skip. |
| 13 | `apps/portal/public/icons/icon-384x384.png` | 9,071 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. PWA icon. |
| 14 | `apps/portal/public/assets/icons/whatsapp-logo.jpeg` | 8,779 | JPEG | no | none found | **YES** (`logo`) | 0 | Under 20 KB. Brand-review. |
| 15 | `apps/portal/public/plantcor-login.png` | 4,751 | PNG | no | none found | **YES** (`plantcor` wordmark) | 0 | Under 20 KB. Brand-review. |
| 16 | `apps/portal/public/icons/icon-192x192.png` | 4,080 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. |
| 17 | `apps/portal/public/icons/icon-152x152.png` | 3,255 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. |
| 18 | `apps/portal/public/icons/icon-144x144.png` | 3,013 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. |
| 19 | `apps/portal/public/plantcor-header.png` | 2,980 | PNG | no | none found | **YES** (`plantcor` wordmark) | 0 | Under 20 KB. Brand-review. |
| 20 | `apps/portal/public/error-pages/404-error.png` | 2,702 | PNG | no | `apps/portal/src/app/not-found.tsx`, `app/error.tsx`, `app/(departments)/error.tsx` | no | 0 | Under 20 KB. |
| 21 | `apps/portal/public/assets/error-pages/404-error.png` | 2,702 | PNG | no | same references match basename | no | 0 | Under 20 KB. Duplicate of #20 (identical size). |
| 22 | `apps/portal/public/icons/icon-128x128.png` | 2,661 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. |
| 23 | `apps/portal/public/icons/icon-96x96.png` | 2,019 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. |
| 24 | `apps/portal/public/branding/ai/openai.svg` | 1,585 | SVG | n/a | none found | **YES** (under `branding/`) | 0 | Under 5 KB SVG threshold. SVGO is lossless — safe to run on brand SVGs but yields ~0. |
| 25 | `apps/portal/public/icons/icon-72x72.png` | 1,554 | PNG | no | via `manifest.json` | icon (PWA) | 0 | Under 20 KB. |
| 26 | `apps/portal/public/branding/ai/meta.svg` | 1,339 | SVG | n/a | none found | **YES** (`branding/`) | 0 | Under 5 KB. |
| 27 | `apps/portal/public/branding/ai/turborepo.svg` | 1,313 | SVG | n/a | `apps/portal/src/config/vercel-brands.ts` | **YES** (`branding/`) | 0 | Under 5 KB. |
| 28 | `apps/portal/public/plantcor-header-dark.png` | 1,142 | PNG | no | none found | **YES** (`plantcor` wordmark) | 0 | Under 20 KB. |
| 29 | `apps/portal/public/logo.svg` | 957 | SVG | n/a | `apps/portal/src/features/auth/components/LoginBrandBanner.tsx`, `packages/ui/src/components/Logo.tsx` | **YES** (`logo`) | 0 | Under 5 KB. |
| 30 | `apps/portal/public/icons/archlinux-logo-black-scalable.svg` | 952 | SVG | n/a | `LoginBrandBanner.tsx` (basename match) | **YES** (`logo`) | 0 | Under 5 KB. |

### Rows 31–38 (rolled up, all below 20 KB and below format thresholds → est. savings 0)

| Path | Size (B) | Notes |
|------|---------:|-------|
| `apps/portal/public/archlinux-logo-black-scalable.svg` | 952 | Brand SVG, duplicate of row 30. Referenced via `LoginBrandBanner.tsx`. |
| `apps/portal/public/branding/ai/github.svg` | 837 | Brand. Referenced via `LoginBrandBanner.tsx`. |
| `apps/portal/public/branding/ai/google.svg` | 730 | Brand. Referenced via `LoginBrandBanner.tsx`. |
| `apps/portal/public/branding/ai/eve.svg` | 446 | Brand. Referenced via `config/vercel-brands.ts`. |
| `apps/portal/public/branding/ai/v0.svg` | 427 | Brand. Referenced via `config/vercel-brands.ts`. |
| `apps/portal/public/branding/ai/anthropic.svg` | 296 | Brand. Referenced via `LoginBrandBanner.tsx`. |
| `apps/portal/public/background/grain.png` | 178 | Referenced via `packages/theme/src/css/glass.css`. |
| `apps/portal/public/branding/ai/vercel.svg` | 163 | Brand. Referenced via `config/vercel-brands.ts`. |

Sub-total for rows 31–38: **4,029 bytes** across **8 files** — no meaningful compression opportunity.

## 5. Totals

| Bucket | Files | Current bytes | Est. savings (bytes) | Est. savings (KiB) |
|--------|------:|--------------:|---------------------:|-------------------:|
| Actionable now (non-brand) — row 2 only | 1 | 568,435 | 454,748 | 444.09 |
| Deferred (brand-review) — rows 1 & 3 | 2 | 1,097,974 | 865,638 | 845.35 |
| No estimated savings (below thresholds) | 35 | 247,678 | 0 | 0 |
| **Grand total** | **38** | **1,914,087** | **1,320,386** | **1,289.44** |

If designer sign-off unblocks the two brand-review candidates, the theoretical ceiling is ~1.26 MiB savings (~67% of `apps/portal/public` image weight). Without them, actionable savings today are ~444 KiB from a single JPEG.

## 6. Observations / follow-ups (informational, no action taken)

- **Orphan candidates**: rows 1, 2, 4, 7, 8, 10, 11, 14, 15, 19, 28 have no live reference in `apps/portal/src/**` or `packages/**/src/**`. Compression agent policy forbids touching orphans without user OK; a separate housekeeping pass could delete the unused ones (deletion is out of compression-agent scope).
- **Duplicate pairs** worth reviewing before/after compression: `logo.png` / `logo-large.png` / `logo-1.png` (all 20,258 B); `arch_logo_background.png` in root vs `assets/`; `404-error.png` in root vs `assets/`; `archlinux-logo-black-scalable.svg` in root vs `icons/`. Deduplication is a separate concern.
- **PWA icons** (`apps/portal/public/icons/icon-*.png`) must remain PNG per `manifest.json` contract; do not convert.
- **`favicon.ico`** (16,153 B) is outside the requested extension list; not included in the table.
- Fonts and CSS under `apps/portal/public/{fonts,css}` are out of scope for this scan.
- No `.compressignore` exists yet; if brand paths should be permanently opted out even from lossless passes, add one under `apps/portal/public/branding/` and `apps/portal/public/` root.

## 7. Recommendation for the operator (no changes made)

1. Install tooling: `sudo apt install webp libavif-bin svgo exiftool`.
2. Decide the fate of orphan large JPEGs (`assets/company-branding.jpeg`, `assets/focused/focused.jpeg`) — delete if truly unused, otherwise route lossy conversion of `focused.jpeg` through a second `compression-agent` run with `--apply`.
3. Route `company-branding.jpeg` and `archlinux-logo-black-1200dpi.png` through designer review before any lossy transform; alternatively run lossless `zopflipng` / `oxipng` (out of the default toolchain but safe for brand PNGs).
4. Re-run this agent with the same scope after any of the above to refresh estimates.

---

```
Alignment: 92/100 [PASS]
- Spec: 15/15 (agent spec + background-compression rule followed; dry-run only, no writes)
- Stack: 14/15 (used repo-standard `file`/grep tooling; noted missing image toolchain)
- Boundaries: 15/15 (only read filesystem + grep under apps/portal/public and packages; no node_modules/.next/.git touched)
- Security: 15/15 (no secrets read; no .env access; no network)
- Quality: 14/15 (report is markdown-tabled and sorted per deliverable; minor: some "referenced via manifest.json" claims not independently grep-verified line-by-line)
- Verify: 19/25 (all sizes, formats, tool probes, and grep hits captured with tool output; savings arithmetic mechanical per spec; brand flags applied per doc rules)
Hard fails: none
```
