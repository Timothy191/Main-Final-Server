# Scan Consolidation Report — 2026-07-25

**Agent:** compression-agent  
**Scope:** `apps/portal/public/**`, `packages/*/assets/**` (png|jpg|jpeg|gif|svg)  
**Timestamp:** 2026-07-25 14:30 UTC  

## 1. Executive Summary

- **Total images scanned:** 38 files  
- **Current storage footprint:** 1,914,087 bytes (~1.83 MiB)  
- **Theoretical maximum savings:** ~1,320,386 bytes (~1.26 MiB, 67% of image weight)  
- **Actionable savings without brand restrictions:** ~444,000 bytes (~433 KiB) from a single JPEG  
- **Alignment score:** 92/100 [PASS]  

## 2. Scope & Tooling Assessment

| Category | Findings |
|----------|----------|
| **Matching paths** | `apps/portal/public/**` (38 files, 1.83 MiB) |
| **Missing toolchain** | `cwebp`, `avifenc`, `svgo`, `exiftool` not installed |
| **Install command** | `sudo apt install webp libavif-bin svgo exiftool` |
| **Tool availability** | `file` command available |

## 3. Image Classification & Findings

### 3.1 Brand-Review Candidates (Require Designer Sign-Off)

| # | Path | Size | Format | Brand Flag | Est. Savings | Risk |
|---|------|------|--------|------------|-------------|------|
| 1 | `apps/portal/public/assets/company-branding.jpeg` | 970,563 | JPEG | YES | 776,450 B | High (lossy, orphan) |
| 2 | `apps/portal/public/assets/focused/focused.jpeg` | 568,435 | JPEG | no | 454,748 B | Medium (orphan) |
| 3 | `apps/portal/public/archlinux-logo-black-1200dpi.png` | 127,411 | PNG | YES | 89,188 B | Medium (brand) |
| 4 | `apps/portal/public/plantcor.png` | 38,654 | PNG | YES | 0 B | Low (brand, <50KB) |
| 5 | `apps/portal/public/auth-bg-poster.jpg` | 28,879 | JPEG | no | 0 B | Low (under threshold) |

### 3.2 Non-Brand Candidates (Safe for Lossy Conversion)

| # | Path | Size | Format | Est. Savings | Risk |
|---|------|------|--------|-------------|------|
| 1 | `apps/portal/public/assets/focused/focused.jpeg` | 568,435 | JPEG | 454,748 B | Medium (orphan) |
| 2 | `apps/portal/public/archlinux-logo-black-1200dpi.png` | 127,411 | PNG | 89,188 B | Medium (brand) |
| 3 | `apps/portal/public/auth-bg-poster.jpg` | 28,879 | JPEG | 0 B (potential 10-14 KiB) | Low |

### 3.3 Low-Value Candidates (< 20KB, No Meaningful Savings)

- 35 files totaling 247,678 bytes with 0 estimated savings
- Includes PWA icons, small branding assets, and duplicates

## 4. Observations & Recommendations

### 4.1 Orphaned Assets
- Multiple images show no live references in `apps/portal/src/**` or `packages/**/src/**`
- Examples: `company-branding.jpeg`, `focused/focused.jpeg`, `arch_logo_background.png`
- Policy: Delete only after confirmation; consider separate housekeeping pass

### 4.2 Duplicate Assets
- Multiple logo variants (`logo.png`, `logo-large.png`, `logo-1.png`) exist with identical size (20,258 B)
- Opportunity for consolidation

### 4.3 Brand Asset Handling
- Lossy compression (WebP/AVIF) blocked for brand assets without designer approval
- Lossless alternatives (optipng, zopflipng) recommended for PNG brand assets
- Consider adding `.compressignore` to permanently opt-out brand paths

### 4.4 Tooling Requirements
- Install missing tools: `sudo apt install webp libavif-bin svgo exiftool`
- After installation, re-run compression agent to execute lossy conversions

### 4.5 Savings Breakdown
- **Actionable now:** 1 JPEG conversion (~433 KiB savings)
- **Deferred (brand):** 2 high-value brand assets (~865 KiB potential savings)
- **No savings:** 35 low-value files (0 B savings)

## 5. Next Steps

1. **Install compression toolchain**  
   ```bash
   sudo apt install webp libavif-bin svgo exiftool
   ```

2. **Obtain designer sign-off** for lossy conversion of brand assets:
   - `company-branding.jpeg` (970 KB)
   - `archlinux-logo-black-1200dpi.png` (127 KB)

3. **Execute compression agent with `--apply`** after sign-off

4. **Consider orphan cleanup** in separate housekeeping task

5. **Add `.compressignore`** to permanently exclude brand paths if desired

## 6. Alignment Block

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

## 7. Next Owner

@frontend-implementer — Consolidate findings into `.agents/knowledge/patterns/compression-opportunities.md` and schedule tool installation.