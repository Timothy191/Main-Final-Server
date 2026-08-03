# Arch Systems Deployment Guide

This guide covers deployment of the Arch Systems portal application for both local development and production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Deployment](#local-development-deployment)
3. [Build Process](#build-process)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Production Deployment](#production-deployment)
6. [Staging Deployment](#staging-deployment)
7. [Environment Setup](#environment-setup)
8. [Service Architecture](#service-architecture)
9. [Health Checks](#health-checks)
10. [Post-Deployment Verification](#post-deployment-verification)
11. [CI/CD Integration](#cicd-integration)
12. [Troubleshooting](#troubleshooting)
13. [Rollback Procedures](#rollback-procedures)
14. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Prerequisites

### Software Requirements

- **Docker Engine** 24.0+ with Docker Compose plugin
- **Node.js** 22+ (for development without Docker)
- **pnpm** 9.15.9+ (package manager)
- **Git** (version control)

### Required Accounts

- **Supabase** account for authentication and database
- **Sentry** account for error monitoring (optional, production)
- **Redis** service (managed or self-hosted)

### System Resources

- **Development**: 4GB RAM, 2 CPU cores, 10GB disk space
- **Production**: 8GB RAM, 4 CPU cores, 20GB disk space

---

## Local Development Deployment

### Quick Start

```bash
# 1. Set up environment variables
cp .env.example .env
cp apps/portal/.env.example apps/portal/.env.local

# 2. Start infrastructure (Redis + PostgreSQL)
docker compose --profile infra up -d

# 3. Install dependencies and start frontend
pnpm install
pnpm --filter portal dev
```

### Development Environment Details

#### Services Started

1. **Frontend** (Next.js) - http://localhost:3000
   - Hot reload enabled
   - Development mode with full debugging
   - TypeScript compilation on the fly

2. **Redis** - localhost:6379
   - In-memory cache and session storage
   - Health check: `redis-cli ping`

3. **PostgreSQL** - localhost:5432
   - Database for user data and application state
   - Health check: `pg_isready -U postgres`

#### Development Scripts

```bash
# Start all services with Docker Compose
docker compose up

# Start only infrastructure
docker compose up redis postgres

# View logs for specific service
docker compose logs -f portal
docker compose logs -f redis
docker compose logs -f postgres

# Stop all services
docker compose down

# Stop and remove volumes (wipe data)
docker compose down -v
```

---

## Build Process

### Turborepo Build Pipeline

The monorepo uses Turborepo 2 for orchestrated builds across all packages and apps.

```bash
# Full monorepo build (all packages + apps)
pnpm build

# Build only the portal app (with dependencies)
pnpm --filter portal build

# Build a specific package
pnpm --filter @repo/redis build
pnpm --filter @repo/supabase build

# Build with verbose output for debugging
pnpm build --verbosity=debug

# Force rebuild (ignore cache)
pnpm build --force
```

### Build Order (Turborepo DAG)

Turborepo automatically determines the build order based on package dependencies:

```
@repo/typescript-config  (no build step)
@repo/eslint-config      (no build step)
@repo/contract           → Zod schemas
@repo/errors             → Typed error classes
@repo/logger             → Structured logging
@repo/redis              → L1/L2 cache layer
@repo/supabase           → Database client
@repo/rate-limiter       → Rate limiting
@repo/ui                 → Shared UI components
@repo/theme              → Tailwind theme
@repo/utils              → Utility functions
@repo/departments        → Department-specific UI
apps/portal              → Next.js 16 application
apps/ops-gateway         → MCP bridge
```

### Portal Build Details

The portal uses Next.js 16 with Turbopack for development and standard Webpack for production:

```bash
# Development (Turbopack HMR)
cd apps/portal && pnpm dev

# Production build
cd apps/portal && pnpm build

# Production start (after build)
cd apps/portal && pnpm start

# Type-check only (fast, no build)
cd apps/portal && pnpm type-check
```

### Docker Build (Multi-Stage)

Production Docker builds use a multi-stage Dockerfile at `apps/portal/Dockerfile`:

```dockerfile
# Stage 1: Dependencies (pnpm install)
FROM node:22-alpine AS deps
# ... installs all monorepo dependencies

# Stage 2: Builder (pnpm build)
FROM node:22-alpine AS builder
# ... copies source, runs pnpm build

# Stage 3: Runner (production only)
FROM node:22-alpine AS runner
# ... copies only .next/standalone + static assets
# ... minimal image (~200MB)
```

### Quality Gate

Always run the quality gate before deploying:

```bash
# Full quality gate (lint + type-check + test + format)
pnpm quality

# Portal-only quality check
pnpm --filter portal type-check
pnpm --filter portal test

# Individual checks
pnpm lint          # ESLint across all packages
pnpm type-check    # TypeScript strict checking
pnpm test          # Jest test suite
pnpm format        # Prettier formatting
```

---

## Pre-Deployment Checklist

Run through this checklist before every production deployment:

### Automated Checks

```bash
# 1. Validate production environment variables
bash scripts/validate-env.sh --production

# 2. Run full quality gate
pnpm quality

# 3. Run smoke test against current deployment (if running)
bash scripts/smoke-test.sh

# 4. Check for outdated dependencies
pnpm outdated

# 5. Security audit
pnpm audit --production
```

### Manual Checks

- [ ] All tests pass (`pnpm test`)
- [ ] No TypeScript errors (`pnpm type-check`)
- [ ] No ESLint errors (`pnpm lint`)
- [ ] Database migrations are applied
- [ ] Environment variables documented in `.env.production` are up to date
- [ ] SSL certificates are valid (if using HTTPS)
- [ ] Backup strategy is current (latest backup < 24 hours old)
- [ ] Monitoring endpoints are responding
- [ ] No pending security advisories (`pnpm audit`)
- [ ] CHANGELOG updated with deployment changes
- [ ] Rollback plan reviewed and tested

### Pre-Flight Script

```bash
#!/bin/bash
# scripts/pre-flight.sh — Run before deployment

set -euo pipefail

echo "=== Pre-Flight Check ==="

# Quality gate
echo "1/5: Quality gate..."
pnpm quality || { echo "FAIL: quality gate"; exit 1; }

# Environment validation
echo "2/5: Environment validation..."
bash scripts/validate-env.sh --production || { echo "FAIL: env validation"; exit 1; }

# Security audit
echo "3/5: Security audit..."
pnpm audit --production --audit-level=high || echo "WARN: security advisories found"

# Smoke test (if portal running)
echo "4/5: Smoke test..."
bash scripts/smoke-test.sh || echo "WARN: smoke test issues (portal may not be running)"

# Git status
echo "5/5: Git status..."
if [ -n "$(git status --porcelain)" ]; then
  echo "WARN: uncommitted changes detected"
  git status --short
else
  echo "OK: working tree clean"
fi

echo ""
echo "=== Pre-Flight Complete ==="
```

---

## Production Deployment

### Production Checklist

Before deploying to production, ensure:

- [ ] All environment variables are set (see [Environment Setup](#environment-setup))
- [ ] Database is backed up
- [ ] SSL/TLS certificates are configured
- [ ] Monitoring is set up (Sentry, OpenTelemetry)
- [ ] Backup strategy is in place
- [ ] Disaster recovery plan is documented

### Automated Production Deployment

```bash
# Run production deployment script
bash deploy-production.sh

# With options
bash deploy-production.sh --skip-validation  # Skip environment validation (not recommended)
bash deploy-production.sh --skip-build       # Skip Docker image rebuild
bash deploy-production.sh --force            # Skip confirmation prompts
```

### Manual Production Deployment

```bash
# 1. Validate environment
bash scripts/validate-env.sh --production

# 2. Build production Docker images
docker compose -f docker-compose.production.yml build

# 3. Start production services
docker compose -f docker-compose.production.yml up -d

# 4. Wait for health checks
sleep 60  # Wait for services to start
curl -f http://localhost:3000/api/health
```

### Production Configuration

The production configuration (`docker-compose.production.yml`) includes:

- **Resource limits**: CPU and memory constraints
- **Health checks**: Regular service health monitoring
- **Logging**: Structured JSON logs with rotation
- **Restart policy**: Automatic restart on failure
- **Network isolation**: Dedicated production network

### Scaling Considerations

```bash
# Scale frontend service (if using Docker Swarm)
docker service scale arch_portal=3

# Add resource constraints
services:
  portal:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
```

---

## Staging Deployment

### Staging Environment

Staging uses `docker-compose.staging.yml` with a configuration between development and production:

```bash
# Deploy to staging
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d

# Staging typically runs on port 3001
# Access: http://localhost:3001
```

### Staging vs Production Differences

| Setting         | Staging                   | Production                |
| --------------- | ------------------------- | ------------------------- |
| `NODE_ENV`      | `staging`                 | `production`              |
| Database        | Shared Supabase (staging) | Dedicated Supabase (prod) |
| Redis           | Local or shared           | Dedicated managed Redis   |
| SSL             | Self-signed or none       | Valid CA certificate      |
| Sentry          | Staging project           | Production project        |
| Resource limits | Relaxed                   | Strict                    |
| Logging         | Verbose                   | Structured JSON           |

### Staging Validation

```bash
# Run smoke test against staging
bash scripts/smoke-test.sh --port 3001

# Validate staging environment
bash scripts/validate-env.sh --staging
```

---

## Environment Setup

### Required Environment Variables

#### Development (.env.local)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Application Settings
NODE_ENV=development
NEXT_TELEMETRY_DISABLED=1

# Local Infrastructure (defaults to Docker Compose)
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/arch_dev
```

#### Production (.env.production)

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]

# Production Infrastructure
REDIS_URL=redis://[redis-host]:6379?password=[password]
DATABASE_URL=postgresql://[user]:[password]@[host]:5432/[database]

# Application Settings
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Monitoring (optional)
SENTRY_DSN=https://[key]@[project-id].ingest.sentry.io/[project-id]
NEXT_PUBLIC_SENTRY_DSN=https://[key]@[project-id].ingest.sentry.io/[project-id]
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
```

### Environment Validation

```bash
# Validate development environment
bash scripts/validate-env.sh

# Validate production environment
bash scripts/validate-env.sh --production
```

### Secret Management

**Never commit secrets to version control!**

- Store secrets in environment variables
- Use `.env.local` for development (gitignored)
- Use Docker secrets or cloud provider secret management for production
- Rotate secrets regularly

---

## Service Architecture

### Docker Compose Services

#### Frontend (Next.js Portal)

- **Image**: Multi-stage Docker build from `apps/portal/Dockerfile`
- **Port**: 3000 (HTTP)
- **Health check**: `GET /api/health`
- **Dependencies**: Redis, PostgreSQL
- **Volumes** (development): Source code for hot reload

#### Redis

- **Image**: `redis:7-alpine`
- **Port**: 6379
- **Health check**: `redis-cli ping`
- **Data persistence**: Docker volume `redis_data`
- **Configuration**: In-memory cache with periodic saves

#### PostgreSQL

- **Image**: `postgres:16-alpine`
- **Port**: 5432
- **Health check**: `pg_isready -U postgres`
- **Data persistence**: Docker volume `postgres_data`
- **Database**: `arch_dev` (development)

### Networking

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Network                       │
├──────────────┬──────────────┬───────────────────────────┤
│  Frontend    │    Redis     │      PostgreSQL           │
│  (Next.js)   │  (caching)   │    (database)             │
│  10.0.0.2    │  10.0.0.3    │    10.0.0.4               │
└──────────────┴──────────────┴───────────────────────────┘
```

Services communicate via Docker's internal DNS:

- `portal` → `redis:6379`
- `portal` → `postgres:5432`

---

## Health Checks

### Service Health Endpoints

```bash
# Frontend health (checks Redis + PostgreSQL)
curl http://localhost:3000/api/health

# Redis health
docker compose exec redis redis-cli ping

# PostgreSQL health
docker compose exec postgres pg_isready -U postgres
```

### Health Check Response Format

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "latencyMs": 42,
  "checks": {
    "database": {
      "status": "healthy"
    },
    "redis": {
      "status": "healthy",
      "connected": true
    }
  }
}
```

### Status Codes

- **200**: Healthy (all checks pass)
- **503**: Unhealthy (one or more checks fail)
- **404**: Health endpoint not found (service not running)

### Monitoring Health Checks

```bash
# Continuous health monitoring
watch -n 30 'curl -s http://localhost:3000/api/health | jq .status'

# Health check with alerts
curl -f http://localhost:3000/api/health || echo "HEALTH CHECK FAILED" | mail -s "Service Alert" admin@example.com
```

---

## Post-Deployment Verification

### Automated Smoke Test

After every deployment, run the comprehensive smoke test:

```bash
# Standard smoke test (localhost:3000)
bash scripts/smoke-test.sh

# Custom port (e.g., staging)
bash scripts/smoke-test.sh --port 8080

# Strict mode (warnings are failures)
bash scripts/smoke-test.sh --strict

# JSON output for CI/CD pipelines
bash scripts/smoke-test.sh --json > smoke-results.json
```

### Smoke Test Coverage

The smoke test validates the following phases:

| Phase | Check                                          | Critical |
| ----- | ---------------------------------------------- | -------- |
| 0     | Pre-flight (PID files, port availability)      | Yes      |
| 1     | Environment (.env.local, Supabase keys, Redis) | Yes      |
| 2     | Redis (cache endpoint, PING)                   | No       |
| 3     | Supabase (auth health, Realtime)               | No       |
| 4     | Portal routes (/login, /hub, departments)      | Yes      |
| 4     | Portal startup time (< 60s)                    | No       |
| 4     | Portal log (no critical errors)                | No       |
| 5     | Stack smoke (health, RLS, liveness, readiness) | Yes      |
| 5     | Login page HTML validity                       | Yes      |
| 5     | Static assets                                  | No       |
| 5     | Response time (< 2000ms)                       | No       |
| -     | Watchdog script existence                      | No       |

### Manual Verification

After automated smoke tests pass:

1. **Login flow** — Navigate to `/login`, authenticate, verify redirect to `/hub`
2. **Department access** — Click each department, verify data loads
3. **API endpoints** — Check `/api/health` returns `{"status":"healthy"}`
4. **Real-time data** — Verify Supabase Realtime subscriptions are active
5. **Cache functionality** — Check `/api/health/cache` returns 200
6. **Error pages** — Navigate to a non-existent route, verify 404 page renders

---

## CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm quality

  build:
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to production
        run: |
          bash deploy-production.sh --force --skip-validation
      - name: Smoke test
        run: |
          sleep 30  # Wait for services
          bash scripts/smoke-test.sh --json > smoke-results.json
      - name: Upload smoke results
        uses: actions/upload-artifact@v4
        with:
          name: smoke-test-results
          path: smoke-results.json
```

### Pipeline Stages

```
Push/PR → Quality Gate → Build → Deploy → Smoke Test → Monitor
           │               │        │         │
           ├─ lint         ├─ turbo  ├─ docker ├─ smoke-test.sh
           ├─ type-check   ├─ pnpm   ├─ compose ├─ health checks
           ├─ test         └─ next   └─ nginx   └─ route checks
           └─ format
```

---

## Troubleshooting

### Common Issues

#### 1. Services Won't Start

```bash
# Check Docker daemon
docker info

# Check Docker Compose syntax
docker compose config

# View detailed logs
docker compose logs --tail=50
```

#### 2. Database Connection Issues

```bash
# Test PostgreSQL connection
docker compose exec postgres psql -U postgres -d arch_dev -c "SELECT 1;"

# Check if database exists
docker compose exec postgres psql -U postgres -l

# Reset database (development only)
docker compose down -v
docker compose up -d
```

#### 3. Redis Connection Issues

```bash
# Test Redis connection
docker compose exec redis redis-cli ping

# Check Redis logs
docker compose logs redis --tail=20
```

#### 4. Frontend Won't Start

```bash
# Check build logs
docker compose logs portal --tail=50

# Rebuild frontend
docker compose build portal

# Check environment variables
docker compose exec portal printenv | grep SUPABASE
```

#### 5. Health Checks Failing

```bash
# Manual health check
curl -v http://localhost:3000/api/health

# Check individual components
curl http://localhost:3000/api/health/redis
curl http://localhost:3000/api/health/database
```

### Debug Commands

```bash
# List all containers
docker ps -a

# View container resource usage
docker stats

# Enter container shell
docker compose exec portal sh
docker compose exec postgres bash
docker compose exec redis redis-cli

# View container logs in real-time
docker compose logs -f --tail=20
```

---

## Rollback Procedures

### Quick Rollback (Last Known Good)

```bash
# 1. Stop current deployment
bash scripts/deploy-production.sh --skip-build --force

# 2. Tag current image as failed
docker tag arch-portal-prod:latest arch-portal-prod:failed-$(date +%Y%m%d_%H%M%S)

# 3. Rollback to previous image
docker tag arch-portal-prod:previous arch-portal-prod:latest

# 4. Restart services
docker compose -f docker-compose.production.yml restart portal

# 5. Verify rollback
curl -f http://localhost:3000/api/health
```

### Database Rollback

```bash
# 1. Stop application
docker compose -f docker-compose.production.yml stop portal api

# 2. Restore from backup
psql -h localhost -U postgres -d arch_production < backup-YYYYMMDD_HHMMSS.sql

# 3. Restart application
docker compose -f docker-compose.production.yml start portal api

# 4. Verify data integrity
curl -f http://localhost:3000/api/health
```

### Configuration Rollback

```bash
# 1. Restore previous environment
cp .env.production.rollback .env.production

# 2. Redeploy with old config
bash deploy-production.sh --skip-build --force
```

### Rollback Decision Tree

```
Issue detected?
├─ Health check failing → Quick Rollback (image)
├─ Database errors → Database Rollback
├─ Config errors → Configuration Rollback
├─ Performance degradation → Quick Rollback + investigate logs
├─ Smoke test failure → Quick Rollback + review smoke-results.json
└─ Partial outage → Blue-Green switch back + incident review
```

### Rollback Verification

After any rollback, verify:

```bash
# 1. Health check
curl -f http://localhost:3000/api/health | jq .

# 2. Smoke test
bash scripts/smoke-test.sh

# 3. Manual login test
curl -sL -o /dev/null -w '%{http_code}' http://localhost:3000/login

# 4. Check logs for errors
docker compose -f docker-compose.production.yml logs --tail=50 portal | grep -i error
```

---

## Monitoring & Maintenance

### Application Monitoring

#### Health Check Endpoints

```bash
# Main health endpoint (checks all dependencies)
curl http://localhost:3000/api/health

# Individual component checks
curl http://localhost:3000/api/health/redis
curl http://localhost:3000/api/health/database
curl http://localhost:3000/api/health/supabase-realtime

# Liveness probe (Kubernetes-style)
curl http://localhost:3000/api/health/live

# Readiness probe (accepts traffic?)
curl http://localhost:3000/api/health/ready
```

#### Response Format

```json
{
  "status": "healthy|degraded|unhealthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "latencyMs": 42,
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy", "connected": true }
  }
}
```

### Automated Monitoring Script

```bash
# Continuous monitoring (run in terminal)
watch -n 30 'curl -s http://localhost:3000/api/health | jq .'

# Alert on failure
curl -f http://localhost:3000/api/health || \
  echo "ALERT: Health check failed" | mail -s "Production Alert" admin@example.com
```

### Smoke Testing

```bash
# Run comprehensive smoke test (default: localhost:3000)
bash scripts/smoke-test.sh

# Custom port (e.g., staging or non-standard)
bash scripts/smoke-test.sh --port 8080

# Strict mode (treat warnings as failures — for CI/CD)
bash scripts/smoke-test.sh --strict

# JSON output (for CI/CD pipelines and automation)
bash scripts/smoke-test.sh --json > smoke-results.json

# Combined options for CI/CD
bash scripts/smoke-test.sh --strict --json > smoke-results.json
```

The smoke test validates: pre-flight checks, environment configuration, Redis connectivity, Supabase health, portal route accessibility (login, hub, departments), portal startup time, log integrity, full stack health (liveness/readiness probes), RLS enforcement, login page HTML validity, static assets, and response times.

### Log Management

#### Viewing Logs

```bash
# Application logs (portal)
docker compose -f docker-compose.production.yml logs -f portal

# API backend logs
docker compose -f docker-compose.production.yml logs -f api

# Nginx access/error logs
docker compose -f docker-compose.production.yml logs -f nginx

# Redis logs
docker compose -f docker-compose.production.yml logs -f redis

# All services
docker compose -f docker-compose.production.yml logs -f
```

#### Log Analysis

```bash
# Search for errors
docker compose -f docker-compose.production.yml logs portal | grep -i error

# Count errors in last hour
docker compose -f docker-compose.production.yml logs --since 1h portal | \
  grep -c "ERROR"

# Extract slow requests (>1s)
docker compose -f docker-compose.production.yml logs portal | \
  grep -E "latencyMs: [0-9]{4,}"
```

#### Log Rotation

Production Docker Compose includes automatic log rotation:

```yaml
logging:
  driver: 'json-file'
  options:
    max-size: '10m' # Rotate at 10MB
    max-file: '3' # Keep 3 files
```

### Performance Monitoring

#### Resource Usage

```bash
# Real-time container stats
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

# Snapshot to file
docker stats --no-stream > resource-usage-$(date +%Y%m%d_%H%M%S).txt
```

#### Application Metrics

```bash
# Prometheus metrics (if configured)
curl http://localhost:3000/api/metrics/prometheus

# Custom metrics endpoint
curl http://localhost:3000/api/metrics
```

#### Sentry Integration

Production deployments include Sentry error tracking:

```bash
# Check Sentry is receiving events
curl -H "Authorization: Bearer $SENTRY_AUTH_TOKEN" \
  https://sentry.io/api/0/projects/your-org/your-project/events/
```

### Backup Procedures

#### Automated Daily Backups

```bash
# Add to crontab (crontab -e)
0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/arch-backups.log 2>&1
```

#### Manual Backup

```bash
# Full database backup
bash scripts/backup-db.sh

# Backup specific table
docker compose -f docker-compose.production.yml exec postgres \
  pg_dump -U postgres -t employees arch_production > employees-backup.sql

# Backup Redis
docker compose -f docker-compose.production.yml exec redis redis-cli SAVE
docker cp $(docker compose -f docker-compose.production.yml ps -q redis):/data/dump.rdb \
  ./redis-backup-$(date +%Y%m%d).rdb
```

#### Backup Verification

```bash
# Test restore to temporary database
createdb -U postgres arch_test_restore
psql -U postgres -d arch_test_restore < backup-20240101.sql
psql -U postgres -d arch_test_restore -c "SELECT COUNT(*) FROM employees;"
dropdb -U postgres arch_test_restore
```

### Update Procedures

#### Zero-Downtime Deployment

```bash
# 1. Pull latest code
git pull origin main

# 2. Build new images (parallel)
docker compose -f docker-compose.production.yml build --parallel

# 3. Rolling restart (one service at a time)
docker compose -f docker-compose.production.yml up -d --force-recreate redis
docker compose -f docker-compose.production.yml up -d --force-recreate api
docker compose -f docker-compose.production.yml up -d --force-recreate portal

# 4. Verify health after each service
for service in redis api portal; do
  echo "Checking $service..."
  docker compose -f docker-compose.production.yml ps $service
  sleep 10
done
```

#### Blue-Green Deployment

```bash
# 1. Deploy to green environment
docker compose -f docker-compose.green.yml up -d

# 2. Test green environment
curl -f http://localhost:3001/api/health  # green on different port

# 3. Switch traffic (nginx config)
sed -i 's/3000/3001/g' devops/nginx/nginx.conf
docker compose -f docker-compose.production.yml restart nginx

# 4. Monitor for 15 minutes
watch -n 30 'curl -s http://localhost:3000/api/health | jq .status'

# 5. Rollback if needed (switch back to blue)
sed -i 's/3001/3000/g' devops/nginx/nginx.conf
docker compose -f docker-compose.production.yml restart nginx
```

### Security Maintenance

#### Dependency Updates

```bash
# Check for outdated packages
pnpm outdated

# Audit for security vulnerabilities
pnpm audit

# Update dependencies
pnpm update --latest

# Rebuild and redeploy
bash deploy-production.sh --force
```

#### Secret Rotation

```bash
# 1. Generate new secrets
openssl rand -hex 32 > new-jwt-secret.txt

# 2. Update Supabase keys (via dashboard)
# https://app.supabase.com/project/your-project/settings/api

# 3. Update environment files
vim .env.production  # update SUPABASE keys, JWT_SECRET, etc.

# 4. Redeploy
bash deploy-production.sh --force

# 5. Verify all services healthy
curl http://localhost:3000/api/health
```

#### SSL Certificate Management

```bash
# Check certificate expiry
echo | openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | \
  openssl x509 -noout -dates

# Renew Let's Encrypt certificates
docker compose -f docker-compose.production.yml run --rm certbot renew

# Reload nginx
docker compose -f docker-compose.production.yml exec nginx nginx -s reload
```

### Incident Response

#### Common Scenarios

**Scenario 1: Portal Down**

```bash
# 1. Check container status
docker compose -f docker-compose.production.yml ps portal

# 2. View logs
docker compose -f docker-compose.production.yml logs --tail=50 portal

# 3. Restart
docker compose -f docker-compose.production.yml restart portal

# 4. If still down, rollback
docker tag arch-portal-prod:previous arch-portal-prod:latest
docker compose -f docker-compose.production.yml restart portal
```

**Scenario 2: Database Connection Failed**

```bash
# 1. Check PostgreSQL
docker compose -f docker-compose.production.yml exec postgres pg_isready -U postgres

# 2. Check connection pool
docker compose -f docker-compose.production.yml logs api | grep -i "database"

# 3. Restart API
docker compose -f docker-compose.production.yml restart api

# 4. If persists, check Supabase status
curl http://127.0.0.1:54321/auth/v1/health
```

**Scenario 3: High Memory Usage**

```bash
# 1. Identify culprit
docker stats --no-stream

# 2. Restart heavy service
docker compose -f docker-compose.production.yml restart portal

# 3. Check for memory leaks in logs
docker compose -f docker-compose.production.yml logs portal | grep -i "heap"
```

#### Emergency Contacts

- **Infrastructure**: Check Docker logs, system monitoring
- **Database**: PostgreSQL logs, connection pooling, Supabase status
- **Application**: Sentry alerts, user reports, portal logs
- **Security**: Isolate containers, analyze logs, rotate secrets

---

## Support & Resources

### Documentation

- [AGENTS.md](../AGENTS.md) - Agent development guidelines
- [NESTJS_TO_NEXTJS_MIGRATION.md](./NESTJS_TO_NEXTJS_MIGRATION.md) - Backend migration plan
- [caching-strategy-research.md](./caching-strategy-research.md) - Redis caching architecture
- [Next.js Documentation](https://nextjs.org/docs) - Framework documentation
- [Docker Documentation](https://docs.docker.com/) - Container platform

### Monitoring Tools

- **Sentry**: Error monitoring and performance tracking
- **OpenTelemetry**: Distributed tracing and metrics
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Dashboard visualization

### Quick Commands Reference

```bash
# Start everything
docker compose -f docker-compose.production.yml up -d

# Stop everything
docker compose -f docker-compose.production.yml down

# View logs
docker compose -f docker-compose.production.yml logs -f

# Rebuild and restart
docker compose -f docker-compose.production.yml up -d --build

# Check health
curl http://localhost:3000/api/health

# Run smoke test (standard)
bash scripts/smoke-test.sh

# Run smoke test (strict mode, CI/CD JSON output)
bash scripts/smoke-test.sh --strict --json > smoke-results.json

# Validate environment
bash scripts/validate-env.sh --production

# Run full quality gate
pnpm quality

# Build production bundle
pnpm build

# Backup database
bash scripts/backup-db.sh

# Rollback to previous image
docker tag arch-portal-prod:previous arch-portal-prod:latest
docker compose -f docker-compose.production.yml restart portal

# Deploy with scripts/deploy-production.sh
bash scripts/deploy-production.sh --yes         # Non-interactive
bash scripts/deploy-production.sh --status      # Show stack status
bash scripts/deploy-production.sh --restart     # Quick restart
bash scripts/deploy-production.sh --logs        # Tail logs
bash scripts/deploy-production.sh --backup      # Manual backup
```

### Port Reference

- **80/443**: Nginx (HTTP/HTTPS)
- **3000**: Frontend application (internal)
- **3001**: API backend (internal)
- **3100**: Ops-gateway (internal)
- **5432**: PostgreSQL database
- **6379**: Redis cache
- **54321**: Supabase auth (local)
- **54323**: Supabase Studio (local)

### File Locations

- `docker-compose.yml` - Development configuration
- `docker-compose.production.yml` - Production configuration
- `docker-compose.staging.yml` - Staging configuration
- `scripts/dev.sh` - Development deployment script
- `scripts/smoke-test.sh` - Operational smoke test (comprehensive)
- `scripts/pre-flight.sh` - Pre-commit validation (type-check + scope)
- `scripts/backup-db.sh` - Database backup script
- `scripts/validate-env.sh` - Environment validation
- `deploy-production.sh` - Production deployment script
- `apps/portal/Dockerfile` - Frontend Docker build
- `apps/api/Dockerfile` - API Docker build
- `devops/nginx/` - Nginx configuration
- `.env.example` - Example environment variables

---

_Last Updated: 2026-07-23_  
_Version: 3.0.0_  
_Changes: Added Build Process, Pre-Deployment Checklist, Staging, Post-Deployment Verification, CI/CD Integration, enhanced Rollback Procedures_
