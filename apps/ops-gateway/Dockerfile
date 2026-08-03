# Ops-Gateway Dockerfile — Meta-Backend / Control Plane (MCP + Incident Engine)
# Three stages: deps → builder → production
# Build context must be monorepo root (.) — same as portal and API Dockerfiles

# ── Stage 1: deps ──────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat && \
    npm install -g pnpm@9.15.9
WORKDIR /app
COPY pnpm-workspace.yaml ./
COPY apps/ops-gateway/package.json ./apps/ops-gateway/
COPY pnpm-lock.yaml ./
RUN --mount=type=cache,target=/pnpm-store \
    pnpm install --filter ops-gateway --no-frozen-lockfile

# ── Stage 2: builder ───────────────────────────────────
FROM deps AS builder
WORKDIR /app
COPY apps/ops-gateway/ ./apps/ops-gateway/
ENV NODE_ENV=production
WORKDIR /app/apps/ops-gateway
RUN npx tsc

# ── Stage 3: production ──────────────────────────────────
FROM node:22-alpine AS production
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY --from=builder /app/apps/ops-gateway/dist ./dist
COPY --from=builder /app/apps/ops-gateway/package.json ./
COPY --from=builder /app/apps/ops-gateway/node_modules ./node_modules

ENV NODE_ENV=production
ENV OPS_API_URL=http://host.docker.internal:3001/api/ops
ENV MCP_PORT=3100

EXPOSE 3100

USER node
CMD ["node", "dist/index.js"]
