# Codegraph Documentation Index

## Purpose

This directory contains documentation for the **Codegraph** MCP server — a graph-based code understanding service that provides semantic and structural analysis of the Arch-System monorepo.

## Contents

| File                                             | Description                                                                                                 |
| ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| [`README.md`](./README.md)                       | Overview, architecture, and usage patterns for the Codegraph service                                        |
| [`COMPLETENESS-RULE.md`](./COMPLETENESS-RULE.md) | Rule ensuring all agent implementation actions are fully completed (imports, config, docs, tests, CI gates) |

## Quick Reference

- **Endpoint**: `http://localhost:6010/mcp`
- **Type**: Remote MCP server
- **Configured in**: `.mcp.json`, `.claude/mcp.json`, `.kilo/kilo.jsonc`

## Related

- [`docs/WAYFINDER.md`](../WAYFINDER.md) — Concept → entry point → ADR map
- [`docs/REPO-CHANGE-INDEX.md`](../REPO-CHANGE-INDEX.md) — Append-only change log
- [Root AGENTS.md](../../AGENTS.md) — Repository-wide conventions and commands
