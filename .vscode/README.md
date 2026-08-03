# Workspace Integration & Agent Onboarding Guide

This directory contains workspace-level configurations to align the development environment for both human developers and AI agents.

> **Canonical shared knowledge:** the present, git-tracked source of truth for cross-agent codebase knowledge is `.agents/knowledge/` (repowiki), registered in the root `AGENTS.md`. The `.aistack/`-based MCP servers documented below are optional add-ons and may not be provisioned in every checkout; treat `.agents/knowledge/` as the authoritative store.

## VS Code & LSP Configuration

- **`settings.json`**: Configures editor integration for TypeScript, ESLint, and Prettier. It guarantees that workspace TypeScript SDK is used and enforces auto-formatting and lint fixing on save.
- **`extensions.json`**: Recommends key extensions (ESLint, Prettier, Cline, Roo Code) for onboarding developers or agents.

---

## Codebase Intelligence & MCP Servers

We have preconfigured the following Model Context Protocol (MCP) servers in `cline_mcp_settings.json` and `roo_mcp_settings.json`:

### 1. `preflight-mcp` (Diagnostic Utility)

- **Command**: `node tools/preflight-mcp/index.js`
- **Purpose**: A lightweight utility server used for workspace diagnostic checks.

### 2. `n8n-mcp` (Workflows Bridge)

- **Command**: `node tools/n8n-mcp/index.js`
- **Environment Variables**:
  - `N8N_URL` (default: `http://localhost:5678`)
  - `N8N_EMAIL` (your registered n8n account email)
  - `N8N_PASSWORD` (your n8n account password)

### 3. `codebase-memory` (Knowledge Graph)

- **Command**: `codebase-memory-mcp`
- **Purpose**: A custom codebase knowledge graph server used for graph queries, code intelligence, and dependency analysis.

### 4. `repowise-mcp` (Codebase Intelligence & Health)

- **Status**: Not provisioned by default. Structured cross-agent codebase knowledge is maintained in the git-tracked knowledge base at `.agents/knowledge/` (see the root `AGENTS.md` → Shared Knowledge Base).
- **If enabled**: `.aistack/tools/repowise` can provide dependency graphs, git history analytics, and code health scores as an optional add-on; it does not replace `.agents/knowledge/`.

### 5. `sense-mcp` (Go-based Codebase Navigation)

- **Command**: `.aistack/tools/sense/bin/sense`
- **Purpose**: Compiled Go codebase understanding tool providing symbol graphs, semantic search, and blast radius analysis.

### 6. `memex-mcp` (Developer Context Memory)

- **Command**: `uv run --project .aistack/tools/memex memex serve`
- **Purpose**: Builds and maintains a temporal knowledge graph of your codebase, tracking modules, symbols, decisions, and open problems.
- **Environment Variables**:
  - `NEO4J_URI` (default: `bolt://localhost:7687`)
  - `NEO4J_USER` (default: `neo4j`)
  - `NEO4J_PASSWORD`
  - `GEMINI_API_KEY` (Gemini API key for analytical processing)
- **Setup**: copy `.env.example` → `.env` and fill in the real Neo4j/Gemini values.

### 7. DeepGraph MCP Servers (Next.js, React, TypeScript Code Graphs)

- **Commands**:
  - `npx -y mcp-code-graph@latest vercel/next.js`
  - `npx -y mcp-code-graph@latest facebook/react`
  - `npx -y mcp-code-graph@latest microsoft/TypeScript`
- **Purpose**: Provides structural code graph representation and querying for Next.js, React, and TypeScript projects.

### 8. `github-official` (GitHub Integration)

- **Command**: `docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server`
- **Environment Variables**:
  - `GITHUB_PERSONAL_ACCESS_TOKEN` (your personal GitHub API token)
- **Purpose**: Exposes GitHub APIs (issues, pull requests, files) as MCP tools.

### 9. `redis` (Redis Database Manager)

- **Command**: `uvx --from redis-mcp-server@latest redis-mcp-server`
- **Environment Variables**:
  - `REDIS_URL` (your Redis database URL, e.g. `redis://localhost:6379`)
- **Purpose**: Exposes Redis keys, values, and database operations as MCP tools.

### 10. `trace-mcp` (Tracing Utility)

- **Command**: `npx -y trace-mcp@latest`
- **Purpose**: Standard tracing and debugger logging MCP server.

### 11. `agentic-tools-mcp` (Project Memory & Tasks)

- **Status**: Superseded for shared knowledge by the git-tracked knowledge base at `.agents/knowledge/` (repowiki). The legacy `.agentic-tools-mcp/` memory store is not present in this repo.
- **Purpose (if enabled)**: an optional local MCP server for task tracking only; durable cross-agent knowledge belongs in `.agents/knowledge/` per the root `AGENTS.md`.

---

## Local Tooling & Database Setup (Neo4j)

Both `memex` and `secrin` utilize a Neo4j graph database to store codebase representations. To avoid port conflicts, we run them in separate Docker containers:

### Start Database for Memex (Port 7687)

```bash
# Set in .env or inline; do not hardcode real passwords in committed files.
docker run -d --name neo4j-memex -p 7687:7687 -p 7474:7474 -e NEO4J_AUTH="${NEO4J_USER:-neo4j}/${NEO4J_PASSWORD}" neo4j:5.20.0
```

### Start Database for Secrin (Port 7688)

```bash
# Set NEO4J_USER and NEO4J_PASSWORD_SECRIN in .env or inline; do not hardcode real passwords in committed files.
docker run -d --name neo4j-secrin -p 7688:7687 -p 7475:7474 -e NEO4J_AUTH="${NEO4J_USER}/${NEO4J_PASSWORD_SECRIN}" neo4j:5.20.0
```

---

## Additional Context Tools

### Secrin (Wiki Software Encyclopedia)

Located in `tools/secrin`, **Secrin** parses the codebase into a Neo4j graph to generate a living software wiki and dashboard.

- **Setup & Install**: Run `uv sync --all-packages` inside `tools/secrin`.
- **Verify Connections**: `uv run --project tools/secrin python scripts/verify.py`
- **Build Graph**: `uv run --project tools/secrin secrin graph build --repo .`
- **Analyze Codebase**: `uv run --project tools/secrin secrin analyze`
- **Start Web Dashboard**:
  - Go to `tools/secrin/apps/web/`
  - Run `pnpm install` and `pnpm dev` to launch the Next.js visualizer on `http://localhost:3000`.

---

## Onboarding Custom AI Agents

### 1. Cline & Roo Code

No manual action is required. Cline and Roo Code automatically detect and load MCP servers configured in `.vscode/cline_mcp_settings.json` and `.vscode/roo_mcp_settings.json` when the workspace is opened.

### 2. Claude Code

Add these servers to Claude Code's global configuration by running the following commands from the repository root:

```bash
# Add Preflight MCP
claude mcp add preflight-mcp node tools/preflight-mcp/index.js

# Add Repowise MCP (optional add-on; shared knowledge lives in .agents/knowledge/)
claude mcp add repowise-mcp uv --project .aistack/tools/repowise repowise mcp .

# Add Sense MCP
claude mcp add sense-mcp .aistack/tools/sense/bin/sense

# Add Memex MCP
claude mcp add memex-mcp uv --project .aistack/tools/memex memex serve --env NEO4J_URI="${NEO4J_URI}" --env NEO4J_USER="${NEO4J_USER}" --env NEO4J_PASSWORD="${NEO4J_PASSWORD}" --env GEMINI_API_KEY="${GEMINI_API_KEY}"

# Add DeepGraph MCPs
claude mcp add deepgraph-nextjs npx -y mcp-code-graph@latest vercel/next.js
claude mcp add deepgraph-react npx -y mcp-code-graph@latest facebook/react
claude mcp add deepgraph-typescript npx -y mcp-code-graph@latest microsoft/TypeScript

# Add Agentic Tools MCP (project memory/tasks)
claude mcp add agentic-tools-mcp node .aistack/packages/agentic-tools-mcp/src/server.js

# Add GitHub Official
claude mcp add github-official docker run -i --rm -e GITHUB_PERSONAL_ACCESS_TOKEN ghcr.io/github/github-mcp-server --env GITHUB_PERSONAL_ACCESS_TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN}"

# Add Redis MCP
claude mcp add redis uvx --from redis-mcp-server@latest redis-mcp-server --env REDIS_URL="redis://localhost:6379"

# Add Trace MCP
claude mcp add trace-mcp npx -y trace-mcp@latest
```

### 3. Gemini / Antigravity IDE

Register the servers in your global user configuration located at `~/.gemini/antigravity-ide/mcp_config.json`:

Refer to the [.vscode/README.md](file:///home/timothy/Documents/Arch-Mk2/.vscode/README.md) contents for absolute path examples.
