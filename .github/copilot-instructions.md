# Copilot Instructions

> **Canonical agent policy:** the root `AGENTS.md` is the source of truth for this repo.
> **Shared knowledge base:** read and update `.agents/knowledge/` (repowiki) — start at
> `.agents/knowledge/index.md`; protocol in `.agents/knowledge/README.md`.
> The auto-generated harness content below is sidecar collateral, not policy.

# Data Intensive Harness

> **Harness Manager** - active harness: `data-intensive`  
> Category: data-processing · Version: 1.0.0
> Tags: data-intensive, batch-processing, caching, performance-monitoring, scalability

## Description

Optimized for large-scale data processing workflows.

## Harness Location

Files are installed at `./agent-harnesses/data-intensive/`:

- `agent-harnesses/data-intensive/README.md`
- `agent-harnesses/data-intensive/config.json`
- `agent-harnesses/data-intensive/template.yaml`

## Instructions

# Data Intensive Harness Configuration

# config.json

{
"name": "data-intensive",
"version": "1.0.0",
"description": "Data Intensive Harness",
"requirements": {
"minMemory": "4GB",
"minDiskSpace": "10GB",
"dependencies": []
},
"configuration": {
"batchSize": 1000,
"cacheExpiry": 3600,
"maxConnections": 10,
"retryAttempts": 3
}
}

# template.yaml

---

# Data Intensive Harness Template

apiVersion: v1
kind: Harness
metadata:
name: data-intensive-harness
version: 1.0.0
spec:
type: data-processing
features: - batch-processing - caching - performance-monitoring
configuration:
batchSize: 1000
cacheExpiry: 3600
maxConnections: 10
input:
sources: - type: database
connection: "{{DATABASE_CONNECTION}}" - type: file
path: "{{DATA_PATH}}"
processing:
steps: - name: validate
type: validation - name: transform
type: transformation - name: aggregate
type: aggregation
output:
destination: "{{OUTPUT_DESTINATION}}"
format: parquet
monitoring:
enabled: true
metricsInterval: 60
