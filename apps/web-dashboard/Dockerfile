# ==============================================================================
# GARUDA A.S.T.R.A — Next.js Web Dashboard Dockerfile
# ==============================================================================

FROM node:20-alpine AS base

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

# Install dependencies
COPY apps/web-dashboard/package.json apps/web-dashboard/package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Copy source files
COPY apps/web-dashboard/ ./

# Build Next.js
RUN npm run build

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["npm", "start"]
