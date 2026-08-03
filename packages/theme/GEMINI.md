# Design System (@repo/theme)

Single source of truth for visual design, tokens, and Tailwind configuration.

> **Canonical policy:** root `AGENTS.md`. **Shared knowledge base:** `.agents/knowledge/` (repowiki) — read `index.md` before non-trivial work; theme decisions live in `DECISIONS.md` and are cross-linked from `.agents/knowledge/decisions/index.md`.

## 🚀 Key Commands

- `pnpm codegen`: Generate TypeScript tokens from `tokens.json` using Style Dictionary.
- `pnpm tokens:watch`: Rebuild tokens automatically on change.
- `pnpm lint:tokens`: Validate token naming and structure.
- `pnpm lint:css`: Lint global CSS files.

## 🛠️ Development Conventions

### Color System (OKLCH)

- **Palette**: Neutral-heavy with functional accents (≤10%).
- **Tokens**: Primitives are named `arch0` to `arch15`.
- **Semantic Aliases**: Always prefer semantic aliases (e.g., `bg-primary`, `text-heading`, `accent-blue`) over primitives.
- **Theme**: Light-only (macOS Sonoma visual language). Dark mode is explicitly NOT supported.

### Tailwind Configuration

- The preset lives in `src/tailwind/preset.ts`.
- Components in the monorepo import this preset to ensure consistent styling.

### Animation Rules

- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo).
- **Durations**: 150ms (micro), 250ms (structural), 400ms (modal).
- **Restrictions**: Never animate layout properties (`width`, `height`, etc.). Only `opacity`, `transform`, and colors.

### Login page — reference implementation

Canonical sign-in surface: `apps/portal/src/app/(auth)/login/page.tsx` + `LoginForm`. Light frosted card on dark wallpaper ≠ dark-mode UI (DECISIONS #003 / #010).

| Element              | Implementation                                                                                                    |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Shell                | `.os-shell.os-shell--login` + `.os-shell-enter-2`; paints via `--os-shell-*` ← `--palette-glass-*`                |
| Card layout          | `--login-card-*` tokens + `.login-card-viewport`, `.login-card-shell`, `.login-card-body`, `.login-card-chrome-x` |
| Title bar            | macOS traffic lights (decorative) + centered title + `LoginSecureBadge` in chrome row                             |
| Brand mark           | Folded `@repo/ui/Logo` variant `display` (`.login-brand-mark`, `.login-brand-fold`, `.login-brand-neon`)          |
| Wordmark             | `.login-wordmark` + `font-display` **ARCH-SYSTEM** (Anurati; elevated specular on light glass)                    |
| Body copy            | `--font-sans` via `.login-muted-text`, `.login-text-emphasis`, `.login-field-label`                               |
| Fields / CTA / OAuth | `.login-field` / `.login-cta` / `.login-oauth` ← light-glass `--login-*`; `Input variant="login"`                 |
| Form behavior        | `LoginForm`: remember me, forgot password, OAuth (Google / Microsoft / GitHub)                                    |
| Notice               | `LoginEveNotice` — eve integration status (`.login-notice--eve`)                                                  |
| Focus                | `--login-focus-gold-*` (incl. `--login-focus-inset-highlight` on field focus)                                     |
| Footer               | `LoginBrandBanner` marquee — partner + AI logos from `/branding/ai/`                                              |

Control paints SSOT: `--login-*` in `variables.css` + classes in `glass.css`. Canonical page: `apps/portal/src/app/(auth)/login/page.tsx`.

### Agent Tracing & Context Hand-off (MANDATORY RULE)

- **Workflow Traces**: All agents MUST update the `AGENT_TRACER.md` file in the root of the package/app they are modifying. You must log a timestamp, your purpose, the changes made, and what the next agent should know.
- **Context Breadcrumbs**: When implementing complex architectural logic, agents MUST leave inline `// AGENT-TRACE: <explanation>` or `/* AGENT-TRACE: ... */` comments. This ensures future AI agents understand the implicit business rules or domain context immediately upon reading the file.
- **Runtime Telemetry**: Where applicable, ensure functions are instrumented (e.g., `prom-client` or OpenTelemetry spans) so runtime behavior can be analyzed by subsequent debugging agents.
