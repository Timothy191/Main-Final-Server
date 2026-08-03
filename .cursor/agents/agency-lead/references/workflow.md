# Agency Lead Background Workflow

Swarm loops: [`_shared/references/swarm-edge-critique-refine.md`](../../_shared/references/swarm-edge-critique-refine.md).

1. Read current status: Check `.crush/agency/status.json` or build logs.
2. Delegate (Analyze / edge scan):
   - Call `gap-analyst` to scan for compilation, test, and runtime gaps.
   - Call `spec-auditor` to verify OpenSpec and rule compliance.
   - Call `routing-optimizer` to check key pool, provider health, and handoff-edge scores.
3. Merge outputs into `.crush/agency/gap-report.md`.
4. When a **root cause hypothesis** exists (from gap analysis or user), delegate `root-cause-healer` to verify, fix, audit imports, and review AI-surface hardening. Otherwise trigger `patch-builder` for structural gaps only (Generate).
5. After any import/path change, ensure `import-auditor` ran clean.
6. Close loop: `sceptic` (Critique) → refine if needed → `agent-alignment-score` (Score); optional `skill-self-improve` if Hermes criteria match.
7. Trigger validation suite (`pnpm ai check` / scoped quality) to confirm the fix works.
