FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 devlock && \
    adduser --system --uid 1001 devlock

COPY --from=builder --chown=devlock:devlock /app/dist ./dist
COPY --from=builder --chown=devlock:devlock /app/package.json ./
COPY --from=builder --chown=devlock:devlock /app/node_modules ./node_modules

USER devlock
EXPOSE 6002
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:6002/health || exit 1
CMD ["node", "dist/index.js"]
