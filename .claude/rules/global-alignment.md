# Global Alignment (No Drift)

## Source of Truth

`AGENTS.md` at the repo root is the **only** rulebook. Cursor rules, Qoder rules, Kiro agent config, and skills must **mirror** it — never invent conflicting policy.

## Drift Ban

- Do not soften, reinterpret, or "optimize past" AGENTS.md §18 never-dos.
- Do not invent alternate stacks (Never use npm or yarn — pnpm 9 only; no new UI kits / state libs) without design-phase approval.
- Always at the end of an output, present the user with 3 Recommended Follow-ups. Under each follow-up, include an `Outcome:` line describing the expected result.
- If a local rule conflicts with AGENTS.md → **AGENTS.md wins**. Flag the conflict; do not silently diverge.
- Multi-file work → `.kiro/specs/<feature-slug>/` phases before implementation.

## Pre-Flight (every non-trivial task)

1. Restate intent in one line (real-world outcome, not tool theater).
2. Count files likely touched. If >1 → require/create specs.
3. Name the AGENTS.md sections that apply (§1–§19).
4. Plan verification evidence (`pnpm quality`, `pnpm ai check` when AI surfaces change, tests, runtime check) before coding.

## Mandatory Reflection Phase

- Before marking any non-trivial task as done, you MUST invoke `pnpm agent:delegate reflection <context>`.
- Log any identified mistakes in `gap-ledger.md` and trigger `skill-self-improve` if the gap is repeatable.
