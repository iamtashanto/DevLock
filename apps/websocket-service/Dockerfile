FROM node:20-alpine AS base
RUN corepack enable pnpm

# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/websocket-service/package.json ./apps/websocket-service/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/logger/package.json ./packages/logger/
COPY packages/config/package.json ./packages/config/
COPY packages/database/package.json ./packages/database/
COPY packages/encryption/package.json ./packages/encryption/
RUN pnpm install --frozen-lockfile --filter @devlock/websocket-service...

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY packages/ ./packages/
COPY apps/websocket-service/ ./apps/websocket-service/
RUN pnpm --filter @devlock/websocket-service... build

# ── Production ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 devlock && \
    adduser --system --uid 1001 devlock

COPY --from=builder --chown=devlock:devlock /app/apps/websocket-service/dist ./dist
COPY --from=builder --chown=devlock:devlock /app/apps/websocket-service/package.json ./
COPY --from=builder --chown=devlock:devlock /app/node_modules ./node_modules

USER devlock
EXPOSE 3010
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:3010/health || exit 1
CMD ["node", "dist/index.js"]
