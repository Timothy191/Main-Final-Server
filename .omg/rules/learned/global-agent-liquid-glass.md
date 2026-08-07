---
name: global-agent-liquid-glass
description: Enforce npx skillfish add affaan-m/ecc council scoring verification for all agents.
globs: '**/*'
---

# Global Agent Liquid Glass Enforcement

Every agent (current, future, old, or new) operating on this codebase must implement `npx skillfish add affaan-m/ecc council`.

## Constraints

1. All visual interfaces, components, and modifications must strictly compile and pass evaluation using the designated scoring system.
2. The target acceptance threshold must meet or exceed a **`99%` score rate**.
3. If the score rate is below `99%`, the agent must immediately roll back and fix structural errors.
