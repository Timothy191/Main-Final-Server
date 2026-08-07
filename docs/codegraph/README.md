# Codegraph Documentation

## Overview

**Codegraph** is a graph-based code understanding service that runs at `http://localhost:6010/mcp`. It provides semantic and structural analysis of the codebase, enabling advanced queries about code relationships, dependencies, and patterns.

## Architecture

Codegraph operates as a **remote MCP server** and is configured in:

- `.mcp.json` → `codegraph` server at `http://localhost:6010/mcp`
- `.claude/mcp.json` → same configuration
- `.kilo/kilo.jsonc` → `codegraph` as type `remote`

### Service Details

| Property      | Value                          |
| ------------- | ------------------------------ |
| Endpoint      | `http://localhost:6010/mcp`    |
| Type          | Remote MCP server              |
| Purpose       | Graph-based code understanding |
| Connected via | MCP protocol (SSE/stdio)       |

## Available Capabilities

Codegraph provides the following tools for codebase analysis:

### Graph Queries

- **Semantic code search** — Find code patterns using natural language or structured queries
- **Dependency analysis** — Trace import/export relationships across packages
- **Code navigation** — Jump to definitions, find references, follow call chains
- **Pattern detection** — Identify architectural patterns and anti-patterns

### Integration with Other Tools

Codegraph complements the other MCP servers by providing:

- **cocoindex-code (ccc)** — AST-based structural search
- **codebase-memory** — Persistent memory of codebase context
- **supermemory** — Long-term knowledge storage

## Usage Patterns

### Starting Codegraph

```bash
# Codegraph is typically started as part of the agent environment
# Check if it's running:
curl -s http://localhost:6010/mcp

# If not running, it may need to be started via the environment setup
```

### Querying Code Relationships

Use Codegraph when you need to:

1. Understand cross-package dependencies in the monorepo
2. Trace data flow through the application
3. Identify refactoring candidates
4. Validate architectural boundaries

## Related Resources

- [MCP Configuration](../.mcp.json) — Root MCP server configuration
- [CLAUDE.md](../CLAUDE.md) — Claude-specific configuration
- [Kilo Configuration](../.kilo/kilo.jsonc) — Kilo IDE configuration
