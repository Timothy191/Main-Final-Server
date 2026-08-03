# Hub ↔ Login Theme Parity — Requirements

## Intent

Hub `/hub` main content must share the login page’s light liquid-glass theme, color palette, and effects (`--os-shell-*`, `--login-*`), not a separate dark cyber look.

## Acceptance criteria

1. Hub `<main>` surfaces use the same light frosted-glass language as login (`os-shell` / liquid glass), not opaque dark panels.
2. Primary CTAs on hub hero match login CTA paint (charcoal / `.login-cta` family); secondary CTAs match login secondary/oauth glass.
3. Section cards and department module cards use shell-edge / glass blur consistent with login card chrome; department accent banners may remain for identity.
4. Focus treatment may reuse login gold focus tokens where interactive shells receive focus-within.
5. Ambient background (grain / soft aurora) stays light; no near-black primary chrome (DECISIONS #003 / #010).
6. Locked department UX from always-visible-departments remains (visible + non-navigating).
7. `prefers-reduced-motion` continues to reduce motion; WCAG AA contrast for text on glass.
8. Scope is hub main content only — BottomNav / taskbar / dock unchanged unless already on os-shell.

## Non-goals

- Dark-mode primary theme
- New npm dependencies
- Redesigning department routes
