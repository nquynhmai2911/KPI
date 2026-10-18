# ==============================================================================
# MULTI-STAGE DOCKERFILE FOR DUAL-MODE KPI SYSTEM
# Stage 1: Build API & Frontend
# Stage 2: Production NestJS API runner
# Stage 3: Production Nginx Client runner
# ==============================================================================

# --- Base Node.js image ---
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package*.json ./
COPY packages/database/package*.json ./packages/database/
COPY apps/api/package*.json ./apps/api/

# --- Dependencies installation ---
FROM base AS dependencies
RUN npm ci

# --- Builder Stage ---
FROM dependencies AS builder
COPY . .
# Generate Prisma Client
RUN npm run db:generate
# Build Frontend
RUN npm run build
# Build NestJS API
RUN npm run api:build

# --- Production API Container ---
FROM node:20-alpine AS api-production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache curl postgresql-client
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/database/package*.json ./packages/database/
RUN npm ci --only=production
COPY --from=builder /app/packages/database/prisma ./packages/database/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:4000/api/v1/docs || exit 1

CMD ["node", "apps/api/dist/main.js"]

# --- Production Frontend Container (Nginx) ---
FROM nginx:1.25-alpine AS frontend-production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
