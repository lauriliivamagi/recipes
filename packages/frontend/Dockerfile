# Build stage
FROM node:22-alpine AS build

RUN corepack enable

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc ./

# Copy package.json files
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/shared/types/package.json ./packages/shared/types/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source files
COPY packages/shared/types/src/ ./packages/shared/types/src/
COPY packages/frontend/ ./packages/frontend/

# Build
WORKDIR /app/packages/frontend
RUN pnpm build

# Production stage
FROM caddy:2-alpine

COPY packages/frontend/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/packages/frontend/dist /srv

EXPOSE 80 443
