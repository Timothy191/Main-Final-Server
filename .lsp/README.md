# .lsp/ — Language Server Protocol Guidance for Agents

> **Research note:** `.lsp/` is **not** a universal filesystem standard.
> Real-world usage (2025) is as a state cache for LSP-over-MCP bridge tools.
> This directory contains **agent guidance** on how to use language servers
> in this repo, and a server capability manifest for orchestrators.

## Available Language Servers

This monorepo is configured with the following language servers (via TypeScript project
references, VSCode extensions, and MCP LSP bridges):

| Server                       | Language             | Entry Config                    | Key Capabilities                                 |
| ---------------------------- | -------------------- | ------------------------------- | ------------------------------------------------ |
| `typescript-language-server` | TypeScript / TSX     | `tsconfig.json`                 | Go-to-definition, find refs, rename, inlay hints |
| `prisma-language-server`     | Prisma               | `packages/supabase/`            | Schema completion, format                        |
| `eslint-ls`                  | JS/TS linting        | `.eslintignore` + ESLint config | Lint-on-save, auto-fix                           |
| `tailwindcss-intellisense`   | Tailwind CSS classes | `tailwind.config`               | Class autocomplete                               |
| `css-languageserver`         | CSS                  | `packages/theme/src/css/`       | Custom property completion                       |

## How Agents Should Use LSP

**Always prefer LSP/graph tools over `grep` for code navigation.**

### Preferred tool priority (high → low)

1. **`codebase-memory` MCP** — AST-indexed semantic search (`search_graph`, `trace_path`, `get_code_snippet`)
2. **`codegraph` MCP** — Graph-based relationship queries
3. **LSP via MCP bridge** (`mcp-language-server` if configured) — hover, go-to-def, references
4. **`grep_search`** — Only for string literals, error messages, config values not in AST

### Never do

- Grep entire `node_modules/` for type definitions — use LSP hover instead
- Grep for function callers — use `trace_path` in `codebase-memory` MCP
- Guess import paths — use `search_graph` to find the canonical export

## LSP-over-MCP Bridge

If you are an agent orchestrator setting up an LSP bridge:

```json
{
  "mcpServers": {
    "lsp-typescript": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-language-server",
        "--workspace",
        "/home/timothy/Documents/Arch-System",
        "--lsp",
        "typescript-language-server",
        "--stdio"
      ]
    }
  }
}
```

Add this entry to `.mcp/mcp.json` and restart your MCP client to enable
`mcp_lsp_goto_definition`, `mcp_lsp_find_references`, `mcp_lsp_hover` tools.

## State Cache (Auto-Generated)

The `.lsp/state/` subdirectory (gitignored) is used by LSP bridge tools to cache
warm symbol indexes so language servers don't re-index on every agent turn.
