# ── Stage 1: pruner ───────────────────────────────────────
FROM node:24-alpine AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@2.10.5
COPY . .
RUN turbo prune --scope=portal --docker

# ── Stage 2: deps ─────────────────────────────────────────
FROM node:24-alpine AS deps
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml

RUN pnpm install --frozen-lockfile

# ── Stage 3: builder ──────────────────────────────────────
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app

COPY --from=deps /app/ .
COPY --from=pruner /app/out/full/ .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV CI=true

RUN pnpm --filter portal build

# ── Stage 4: runner ───────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/portal/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/.next/static ./apps/portal/.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "apps/portal/server.js"]
