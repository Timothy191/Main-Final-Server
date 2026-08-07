# Compliance Architecture Hub

> [!NOTE] Neural Connections
> 🔙 **Upward Node:** [Master Map of Content](../../memory/antigravity-memory/long/MAP_OF_CONTENT.md)
> 🔀 **Lateral Nodes:** [Architecture Hub](../architecture/README.md) | [Research & Gap Analysis](../research/README.md) | [Runbooks](../runbooks/README.md)

This directory contains the compliance architecture, audit specs, and regulatory framework mappings for the Arch-System operational stack.

## Indexed Nodes

- [Compliance Architecture](compliance-architecture.md) — Top-level compliance blueprint (ISO 45001, IEC 61511, ISA/IEC 62443, ISO 27001, ISO 9001, ALCOA+, GAMP 5). Document ID: CA-ARCH-2026-001.
- [Research & Gap Analysis](../research/architecture-compliance-caching-gaps.md) — Official frameworks, specs-based audits, and 15 caching gaps (C-1..C-15) with remediation mappings and compliance impact analysis.

## Quick Reference

| Framework            | Applicable Systems                     | Key Clause / Control                                                                      |
| -------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- |
| **ISO 45001:2018**   | SYS-001, SYS-002, SYS-006              | §6.1, §7.5, §9.1, Clause 10                                                               |
| **IEC 61511:2017**   | Interface agreement only               | SIS vs. non-SIS boundary                                                                  |
| **ISA/IEC 62443**    | All operational systems                | SL-AL assessment, zone/conduit model                                                      |
| **ISO 27001:2022**   | All IT systems                         | A.5, A.8, A.14, A.16                                                                      |
| **ISO 9001:2015**    | Production/reporting systems           | §7.5, §8.5, §9.1, §10.2                                                                   |
| **ALCOA+**           | Data integrity for all production data | Attributable, Legible, Contemporaneous, Original, Accurate, Complete, Enduring, Available |
| **GAMP 5 (2nd Ed.)** | Software validation lifecycle          | Categories 1–5; URS→RA→VP→IQ→OQ→PQ→TM→VSR                                                 |

## Compliance Status

```text
Framework Coverage:  ████████████████████░░░░░░░░░░░░░░░░░░░░  52.4%
Gap Register:       ████████████████████░░░░░░░░░░░░░░░░░░░░  52.4%
Audit Readiness:    ████████████████░░░░░░░░░░░░░░░░░░░░░░░░  38.1%
```

## Related Resources

- [Runbooks](../runbooks/README.md) — Operational recovery and incident response
- [Caching Hub](../caching/README.md) — L1/L2 Redis topology and cache strategy
- [WAYFINDER.md](../WAYFINDER.md) — Concept-to-entry-point navigation for all domains
