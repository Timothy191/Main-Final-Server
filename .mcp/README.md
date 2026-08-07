# .mcp/ — Canonical MCP Server Registry

> **For AI agents:** This directory is the single source of truth for all Model Context
> Protocol (MCP) server definitions used in this monorepo. Read `mcp.ci.json` in CI
> environments. Read `mcp.full.json` for a complete local dev setup.

## What is MCP?

The [Model Context Protocol](https://modelcontextprotocol.io) is an open standard that
lets AI agents connect to tools (databases, code search, memory, etc.) via a
structured JSON-RPC interface. Think of it as "USB-C for AI tools."

## Profile Files

| File            | Purpose                                                            | When to use                 |
| --------------- | ------------------------------------------------------------------ | --------------------------- |
| `mcp.json`      | Default workspace config (symlinked as root `.mcp.json`)           | Most agents / local dev     |
| `mcp.full.json` | **All** servers including heavy tools (postgres, redis, git, etc.) | Deep investigation sessions |
| `mcp.ci.json`   | Headless-safe servers only (no browser, no local DB)               | CI pipelines, remote agents |

## Registered Servers (Summary)

| Server                | Transport             | Purpose                                                 |
| --------------------- | --------------------- | ------------------------------------------------------- |
| `codebase-memory`     | stdio                 | AST-indexed semantic code search across entire monorepo |
| `supermemory`         | stdio                 | Persistent cross-session agent memory                   |
| `codegraph`           | HTTP `localhost:6010` | Graph-based code relationship queries                   |
| `sequential-thinking` | stdio                 | Multi-step reasoning scaffolding                        |
| `memory`              | stdio                 | In-session working memory (KV)                          |
| `filesystem`          | stdio                 | Direct filesystem read/write (scoped to repo root)      |
| `git`                 | stdio                 | Git log, diff, blame queries                            |
| `postgres`            | stdio                 | Local Supabase dev DB (`localhost:54322`)               |
| `redis`               | stdio                 | Local Redis queries (`localhost:6379`)                  |
| `sqlite`              | stdio                 | Benchmark cache DB                                      |
| `github`              | stdio                 | GitHub API — PRs, issues, search                        |
| `brave-search`        | stdio                 | Web search                                              |
| `genkit`              | stdio                 | Google Genkit AI tooling                                |

## Adding a New Server

1. Add the server definition to `mcp.full.json`.
2. If needed in the default workspace, add it to `mcp.json` too.
3. Only add to `mcp.ci.json` if it is headless-safe (no browser, no local infra deps).
4. Update the table above.

## IDE Config Mapping

Each IDE reads its own file but all resolve to the same server definitions:

| IDE / Agent       | Config file                                      |
| ----------------- | ------------------------------------------------ |
| Antigravity (agy) | `/.mcp.json` (root)                              |
| Claude Code       | `/.claude/mcp.json`                              |
| Cursor            | `/.cursor/mcp.json`                              |
| VS Code           | `/.vscode/mcp.json`                              |
| Kilo              | `/.kilo/kilo.jsonc`                              |
| Any new agent     | Point at `.mcp/mcp.json` or `.mcp/mcp.full.json` |
