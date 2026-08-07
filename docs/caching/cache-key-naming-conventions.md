# Cache Key Naming Conventions

This document outlines the standard conventions for cache keys across the Arch-System monorepo to prevent collisions, ensure TTL predictability, and enable tag-based invalidation.

## Key Structure

All cache keys must follow the standard segment format using colons (`:`) as separators:

```text
arch:<category>:<identifier>[:<attribute>]
```

### Segments

1. **Prefix** (`arch`): The global namespace prefix for the application cache.
2. **Category** (`<category>`): The functional domain or database table identifier (e.g., `auth`, `hub`, `safety`, `drilling`, `geology`). Must match a registered `CacheCategory` constant.
3. **Identifier** (`<identifier>`): The unique identifier for the specific entity or context (e.g. `userId`, `date`, `machineId`).
4. **Attribute** (Optional `<attribute>`): A sub-property or subset descriptor (e.g., `counts`, `trend`, `status`).

## Examples

| Cache Key                        | Category | Identifier    | Attribute | TTL       |
| :------------------------------- | :------- | :------------ | :-------- | :-------- |
| `arch:auth:usr_9981a2:details`   | `auth`   | `usr_9981a2`  | `details` | 1 hour    |
| `arch:hub:2026-08-07:counts`     | `hub`    | `2026-08-07`  | `counts`  | 1 minute  |
| `arch:safety:machine_452:status` | `safety` | `machine_452` | `status`  | 5 minutes |

## General Rules

1. **Lowercase Only**: Always use lowercase characters for segment names and static text.
2. **Never Use Spaces or Special Characters**: Use hyphens (`-`) or underscores (`_`) instead of spaces or special characters.
3. **Registry Mapping**: Always define cache keys and category TTLs in `packages/redis/src/registry.ts` to ensure consistency.
