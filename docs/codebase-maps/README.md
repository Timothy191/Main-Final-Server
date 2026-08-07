# Codebase Maps

> [!NOTE] Neural Connections
> 🔙 **Upward Node:** [Master Map of Content](../../memory/antigravity-memory/long/MAP_OF_CONTENT.md)
> 🔀 **Lateral Nodes:** [Architecture Hub](../architecture/README.md) | [Runbooks](../runbooks/README.md)

Visual, Mermaid-rendered maps of the Arch-System monorepo. Each map is a
single-domain view; read them together for the full picture. The temporal
companion is [`docs/REPO-CHANGE-INDEX.md`](../REPO-CHANGE-INDEX.md).

## Index

| Map                                                        | What it shows                                       |
| ---------------------------------------------------------- | --------------------------------------------------- |
| [`architecture-map.md`](./architecture-map.md)             | Layer overview: frontend, backend/BFF, database     |
| [`request-flow-map.md`](./request-flow-map.md)             | Browser → edge proxy → routes → cache → Postgres    |
| [`package-dependency-map.md`](./package-dependency-map.md) | Build / test dependency order across packages       |
| [`data-access-map.md`](./data-access-map.md)               | Supabase client factories, Kysely types, migrations |
| [`caching-map.md`](./caching-map.md)                       | Redis L1/L2 flow, cache tags, invalidation          |
| [`department-routes-map.md`](./department-routes-map.md)   | ACL slugs → `[department]` routes → edge gating     |
| [`ci-gates-map.md`](./ci-gates-map.md)                     | The 13-check `pnpm gates` pipeline                  |

## How to update

- Keep node labels pointing at real paths; add `AGENT-TRACE:` breadcrumbs at
  the integration points the maps describe.
- After changing any map, run `pnpm lint:markdown` (Mermaid fences are safe)
  and append a row to `docs/REPO-CHANGE-INDEX.md`.
