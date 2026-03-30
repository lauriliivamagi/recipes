FROM node:22-alpine

RUN corepack enable

WORKDIR /app

# Copy workspace configuration
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY .npmrc ./

# Copy package.json files for all workspace packages
COPY packages/backend/package.json ./packages/backend/
COPY packages/shared/types/package.json ./packages/shared/types/

# Install dependencies
RUN pnpm install --frozen-lockfile --prod=false

# Copy source files
COPY packages/shared/types/src/ ./packages/shared/types/src/
COPY packages/backend/src/ ./packages/backend/src/
COPY packages/backend/healthcheck.ts ./packages/backend/
COPY packages/backend/tsconfig.json ./packages/backend/

EXPOSE 8888

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node --import tsx packages/backend/healthcheck.ts

CMD ["node", "--import", "tsx", "packages/backend/src/main.ts"]
