# 🗺️ Arch System — Master Map of Content (MOC)

This Map of Content (MOC) serves as the primary structural hub of the **Arch-System** documentation vault. It interlinks all codebase domain clusters, resolves silos, and connects isolated nodes to provide a coherent project context.

---

## 🎨 1. Frontend & Design System Cluster

The visual layer of Arch System is governed by a strict glassmorphic design token system:

- **Component Primitives**: [`packages/ui`](../../../packages/ui/) contains reusable components.
- **Style Dictionary Tokens**: [`packages/theme`](../../../packages/theme/) defines visual parameters.
- **Design System Specs**: See the [`docs/design-system/`](../../../docs/design-system/) directory for RULES, SPEC, and DESIGN.

---

## ⚙️ 2. Backend & BFF Layer Cluster

The Edge proxy, route access control, and API contracts:

- **Edge Gateway Auth**: [`apps/portal/src/proxy.ts`](../../../apps/portal/src/proxy.ts) intercepts and validates sessions.
- **Access Control Slugs**: [`packages/acl`](../../../packages/acl/) defines active department route permissions.
- **API Contracts & Errors**: [`packages/contract`](../../../packages/contract/) and [`packages/errors`](../../../packages/errors/).

---

## ⚡ 3. Caching & Performance Cluster

L1/L2 cache topology and performance configuration:

- **Caching Architecture Hub**: [docs/caching/README.md](../../../docs/caching/README.md)
- **Performance Insights Hub**: [docs/performance-insights/README.md](../../../docs/performance-insights/README.md)
- **Hybrid Cache Map**: [`docs/HYBRID-CACHE-MAP.md`](../../../docs/HYBRID-CACHE-MAP.md)

---

## 🗄️ 4. Data Layer & Systems Architecture

Database clients, schema migrations, and high-availability setups:

- **Systems Architecture Hub**: [docs/architecture/README.md](../../../docs/architecture/README.md)
- **Codebase Maps Hub**: [docs/codebase-maps/README.md](../../../docs/codebase-maps/README.md)
- **Data Packages**: [`packages/supabase`](../../../packages/supabase/) and [`packages/database`](../../../packages/database/).

---

## 🤖 5. Agent Rules & Operational Tooling

Configurations and guidelines governing development agents:

- **Agent Rules Index**: [.agents/rules/INDEX.md](../../../.agents/rules/INDEX.md)
- **Agent Skills Index**: [.agents/skills/INDEX.md](../../../.agents/skills/INDEX.md)
- **Project Memory Index**: [memory/antigravity-memory/INDEX.md](../INDEX.md)

---

## 🌐 6. Operational Metrics & Resiliency

Logs, test checklists, and fallback blueprints:

- **Site Reliability Runbooks**: [docs/runbooks/README.md](../../../docs/runbooks/README.md)
- **Onboarding Guide**: [docs/onboarding/index.md](../../../docs/onboarding/index.md)
- **Babysitter Operations Logs**: [`repowiki/LIVE_SYS_STATUS.md`](../../../repowiki/LIVE_SYS_STATUS.md)

---

## 🎨 Custom Graph Snippet Customization

To view this documentation graph in a minimalist light mode with translucent glassmorphic blurs, apply the styles defined in [`docs/design-system/graph-minimal-glass.css`](../../../docs/design-system/graph-minimal-glass.css) within your workspace configuration.
