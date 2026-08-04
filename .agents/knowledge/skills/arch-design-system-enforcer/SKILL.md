---
name: arch-design-system-enforcer
description: Rules and token specifications for enforcing the Arch OS visual design system (GlassCard, CSS variables, wave/canvas animations).
---

# Arch Design System Enforcer Skill

Use this skill when building or modifying visual surfaces in `apps/portal`, `@repo/ui`, or `@repo/theme`.

## 1. Non-Negotiable Design Rules (`docs/design-system/RULES.md`)

- **Single Glass Schema**: Use `<GlassCard>` from `@repo/ui/GlassCard` for all card containers.
- **No Ad-Hoc Tailwinds for Glass**: Never use `backdrop-blur-*` or `bg-white/` directly on structural panels. Use the canonical CSS variable tokens:
  - `--arch-glass-bg`
  - `--arch-border`
  - `--arch-border-subtle`
  - `--arch-text-primary`
  - `--arch-text-muted`
- **Modern Typography**: Rely on clean font stacks and curated color palettes (emerald, cyan, blue, amber, rose).

## 2. Component Usage Guidelines

```tsx
import { GlassCard } from '@repo/ui/GlassCard'
import { ShieldCheck } from 'lucide-react'

export function StatusBadge({ status }: { status: string }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-arch-text-muted uppercase tracking-wider font-semibold">
          System Status
        </span>
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
      </div>
      <p className="text-xl font-bold text-arch-text-primary mt-1">{status}</p>
    </GlassCard>
  )
}
```

## 3. Verification Gate Before Marking Done

Run the full gate suite (must be cold-cache — turbo caches stale lint PASS):

```bash
pnpm exec turbo run lint type-check test --force   # MUST show "0 cached"
pnpm gates                                          # agents:verify + design:ratchet + theme:shape + lint:tokens
pnpm format:check
```
