# syntax=docker/dockerfile:1

# ── Dependencies stage ──
FROM node:22.12-bookworm-slim AS deps
WORKDIR /app

# Copy lockfile + package.json first for install cache hit
COPY webapp/package.json webapp/package-lock.json ./

RUN --mount=type=cache,id=npm-webapp,target=/root/.npm \
    npm ci --ignore-scripts

# ── Builder stage ──
FROM node:22.12-bookworm-slim AS builder
WORKDIR /app

# Copy installed node_modules from deps
COPY --from=deps /app/node_modules ./node_modules

# 1. Declare build arguments FIRST. Next.js needs these during the compilation phase.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_TELEMETRY_DISABLED=1

# 2. Copy config files first (they change less often than source code)
COPY webapp/package.json webapp/next.config.ts webapp/tsconfig.json webapp/postcss.config.mjs webapp/components.json ./
COPY webapp/eslint.config.mjs ./

# 3. Copy only the directories that contain actual code changes to isolate code changes entirely to this step.
COPY webapp/src ./src
COPY webapp/public ./public

RUN npm run build

# ── Runner stage ──
FROM node:22.12-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs && \
    useradd --system --uid 1001 --gid 1001 nextjs

# Copy public assets (static files)
COPY --from=builder /app/public ./public

# Copy the standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
