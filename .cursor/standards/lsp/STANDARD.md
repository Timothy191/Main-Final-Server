# LSP Service Standard — Language Servers for Agent Delegation

All agents delegated via `pnpm agent:delegate` get access to language servers for
correct code intelligence: go-to-definition, references, rename, diagnostics, hover.

## Architecture

```
Agent (opencode/devin)
     │
     ├── LSP Router (scripts/lsp-router.sh)
     │     ├── TypeScript/JavaScript → bundled TS server (apps/portal/node_modules/.bin/typescript-language-server)
     │     ├── Go                  → gopls
     │     ├── Python              → pyright / pylsp
     │     ├── Rust                → rust-analyzer (if available)
     │     └── SQL                 → sql-language-server (if available)
     │
     └── MCP Servers (see .cursor/mcp-servers.json)
           ├── filesystem    — file read/write/search
           ├── memory        — persistent knowledge graph
           ├── sequential-thinking — step-by-step reasoning
           ├── context7      — library docs lookup
           ├── github        — issue/PR management
           └── ...           — per-profile
```

## Available LSP Servers

| Language   | LSP Server                  | Detection            |
| ---------- | --------------------------- | -------------------- |
| TypeScript | typescript-language-server  | `node_modules/.bin/` |
| JavaScript | typescript-language-server  | shares TS config     |
| Go         | gopls                       | `$PATH`              |
| Python     | pyright / python-lsp-server | `$PATH` / uv managed |
| Rust       | rust-analyzer               | `$PATH`              |
| SQL        | sql-language-server / sqls  | `$PATH`              |
| JSON       | vscode-json-languageserver  | `node_modules/.bin/` |
| YAML       | yaml-language-server        | `node_modules/.bin/` |

## How Agents Use LSP

Each agent run function in `scripts/delegate-agent.sh` now injects:

1. **AVAILABLE_LSP** — JSON list of detected language servers with their capabilities
2. **MCP_SERVERS** — JSON list of running MCP servers
3. **LSP_COMMAND** — the shell command template for manual LSP invocation

Agents should prefer `lsp` (the xd://lsp tool device) over text-based search when
doing code intelligence work (references, rename, go-to-definition, code actions).

## Startup

```bash
# Start LSP for TypeScript
pnpm lsp:start typescript

# Start all detected LSP servers
pnpm lsp:start --all

# Status
pnpm lsp:status
```

## Config

Settings in `.env`:

- `LSP_AUTO_START=true` — automatically start LSP servers on delegation
- `TYPESCRIPT_LS_PATH` — override TS language server path (default: auto-detect in node_modules)
