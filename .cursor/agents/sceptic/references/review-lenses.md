# Review lenses

| Lens              | Fail if…                                                           |
| ----------------- | ------------------------------------------------------------------ |
| Real-world verify | No command output, test, log, or cited code proof                  |
| Spec              | Multi-file change missing `.kiro/specs/<slug>/`                    |
| Stack             | npm/yarn, banned UI kits, wrong boundaries, `apps(legacy)/`        |
| Boundaries        | `"use client"` on layouts, server imports in client, fetch-own-API |
| Security          | Missing Zod, secrets leakage, service-role in client               |
| Quality           | No `pnpm quality` (or scoped) evidence this session                |
| YAGNI/KISS        | Unjustified abstractions or deps                                   |
| Operability       | No failure mode for risky changes                                  |
