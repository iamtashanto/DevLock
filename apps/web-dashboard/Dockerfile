FROM node:20-alpine AS base
RUN corepack enable pnpm

# ── Dependencies ────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web-dashboard/package.json ./apps/web-dashboard/
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/ui/package.json ./packages/ui/
COPY packages/config/package.json ./packages/config/
COPY packages/encryption/package.json ./packages/encryption/
RUN pnpm install --frozen-lockfile --filter @devlock/web-dashboard...

# ── Build ───────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app ./
COPY packages/ ./packages/
COPY apps/web-dashboard/ ./apps/web-dashboard/
RUN pnpm --filter @devlock/web-dashboard... build

# ── Production ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web-dashboard/public ./apps/web-dashboard/public

COPY --from=builder --chown=nextjs:nodejs /app/apps/web-dashboard/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-dashboard/.next/static ./apps/web-dashboard/.next/static

USER nextjs
EXPOSE 4000
ENV PORT=4000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web-dashboard/server.js"]
