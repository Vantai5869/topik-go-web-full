# Multi-stage build for optimal production performance
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Build context is now project root, so we need to copy from soometa-web/
ARG BUILD_CONTEXT=soometa-web

# Install dependencies based on the preferred package manager
COPY ${BUILD_CONTEXT}/package.json ${BUILD_CONTEXT}/yarn.lock* ${BUILD_CONTEXT}/package-lock.json* ${BUILD_CONTEXT}/pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile; \
  else echo "No lockfile found, generating package-lock.json..." && npm install; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
ARG BUILD_CONTEXT=soometa-web
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy .env file FIRST for build-time environment variables (NEXT_PUBLIC_*)
COPY .env* ./

# Copy application source code
COPY ${BUILD_CONTEXT}/ ./

# Next.js collects anonymous telemetry data. Disable it.
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js
RUN yarn build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files for standalone mode
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3081

ENV PORT=3081
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
