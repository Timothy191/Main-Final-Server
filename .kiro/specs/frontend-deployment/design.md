# Frontend Deployment Configuration - Design

## Architecture Overview

### Service Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Docker Compose                       │
├──────────────┬──────────────┬───────────────────────────┤
│  Frontend    │    Redis     │      PostgreSQL           │
│  (Next.js)   │  (caching)   │    (database)             │
│  Port: 3000  │  Port: 6379  │    Port: 5432             │
└──────────────┴──────────────┴───────────────────────────┘
       │               │               │
       └───────────────┼───────────────┘
                       │
               Environment Variables
               (Supabase, Redis URL, etc.)
```

### File Changes Required

#### 1. `docker-compose.yml` Updates

- Add frontend service definition
- Configure service dependencies and health checks
- Add network configuration for service communication
- Add volume for development hot reload

#### 2. New `docker-compose.production.yml` (Optional)

- Production-optimized configuration
- Resource limits and scaling settings
- SSL/TLS configuration
- Logging configuration

#### 3. Environment Configuration

- Update `.env.example` with all required variables
- Create validation script for required environment variables
- Documentation for environment setup

#### 4. Deployment Scripts

- Update `deploy-dev-mode.sh` for full stack deployment
- Create `deploy-production.sh` for production deployment
- Add health check scripts for each service

## Server vs Client Boundaries

- **Server**: All Docker services, database access, Redis operations
- **Client**: Next.js frontend (mix of server and client components)
- **Boundaries**: Environment variables injected at runtime, secrets stay server-side

## New Routes/Handlers Required

- Health check endpoints for each service
- Status monitoring endpoint for deployment verification
- Environment validation endpoint

## Environment Variables Required

### Required for Local Development

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/arch_dev
NODE_ENV=development
```

### Required for Production

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
DATABASE_URL=
NODE_ENV=production
SENTRY_DSN=
```

## Packages Needed

- No new packages required (uses existing Docker infrastructure)
- All dependencies already in package.json

## Implementation Plan

### Phase 1: Update docker-compose.yml

1. Add frontend service definition
2. Configure health checks for all services
3. Set up service dependencies
4. Add volume mounts for development

### Phase 2: Create Production Configuration

1. Create docker-compose.production.yml
2. Add resource limits and optimizations
3. Configure SSL/TLS if needed
4. Set up logging and monitoring

### Phase 3: Environment Setup

1. Update environment variable documentation
2. Create validation script
3. Document deployment process

### Phase 4: Testing

1. Test local deployment
2. Test production configuration
3. Validate service communication
4. Verify authentication works

## Risk Assessment

- **Low risk**: Adding frontend service to existing docker-compose.yml
- **Medium risk**: Environment variable validation and security
- **Low risk**: Health check implementation

## Success Criteria

- All services start with `docker compose up`
- Frontend accessible at http://localhost:3000
- Login page works and connects to Supabase
- All pages render correctly
- Services communicate properly via Docker network
- Health checks pass for all services
