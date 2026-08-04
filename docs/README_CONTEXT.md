# Context-Efficiency Enforcement

## Why This Exists

- **Stateless agents** (e.g., Claude, Cline) rely on in‑file context to know the stack, conventions, and how to stay productive.
- The **Context‑Efficiency Suite** ensures that the repository stays clean, maintainable, and predictable across all agent sessions.

## What the Suite Does

1. **Immutable Onboarding (`CLAUDE.md`)** – Keeps the Claude onboarding concise (WHY/WHAT/HOW) with **progressive‑disclosure**: task‑specific details are referenced from `agent_docs/` files rather than inline.

2. **Hard‑Enforced Guardrails (`.scripts/check_context.sh`)** – A runtime script that validates:
   - CLAUDE.md length and command‑free content
   - No stray `.md` files that could leak session‑specific data
   - Token linting for `@repo/theme`
   - ACL import consistency (`proxy.ts` ↔ `@repo/acl`)
   - Generated CSS integrity
   - Existence of required docs (`REPO-CHANGE-INDEX.md`, `context_efficiency.md`)

3. **Standardized Agent Tracing (`.agents/AGENT_TRACER.md`)** – Every change is logged with a dated entry (agent, purpose, changes, dependencies, notes). This creates a durable, file‑based memory that survives agent hand‑offs.

4. **Knowledge‑Base Re‑org (`.agents/knowledge/` and `agent_docs/`)** – Moves task‑specific or historical information into a discoverable, searchable structure. Skills, runbooks, and architecture decisions live here, not in ad‑hoc session files.

5. **CI Enforcement (`.github/workflows/context-check.yml`)** – The script runs in CI on **every push to `main` and every PR**. If any guardrail fails, the pipeline stops and reports the exact issue.

## How to Run Locally

```bash
# From the repository root
pnpm install            # (once)
bash .scripts/check_context.sh
```

If any check fails, the script prints the problem and exits with code 1.

## Manual Audits (Optional but Recommended)

- **Weekly** review of the `.agents/knowledge/` directory for stale entries.
- **Monthly** look at `docs/REPO-CHANGE-INDEX.md` and flag any `none` in "Docs updated".
- **Quarterly** run `pnpm gates` to ensure the token‑lint and design‑ratchet still pass.

## Feedback & Maintenance

- Found a false‑positive? Open an issue and tag it with `context-feedback`.
- Need a new guardrail? Open a PR that updates `.scripts/check_context.sh` and amend the `docs/context_efficiency.md` policy.
- Want to learn more? Look at the `AGENT_TRACER.md` entries and `agent_docs/` files for deep dives into past changes.

---

**Bottom line:** This suite keeps the repository in a **predictable, stateless‑friendly** state so that agents can work efficiently without reinventing the wheel or accidentally leaving behind session‑specific artefacts.
