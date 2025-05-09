# Stage 1: builder
FROM node:22-alpine AS builder
WORKDIR /app

# Install build tools for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json ./apps/backend/

# Install dependencies with --ignore-scripts to avoid postinstall
RUN npm ci --ignore-scripts

# Copy application code
COPY apps/backend/ ./apps/backend/

# Build the application
WORKDIR /app/apps/backend
RUN npm run build

# Stage 2: production runner
FROM node:22-alpine AS runner
WORKDIR /app

# Install runtime utilities for healthcheck
RUN apk add --no-cache curl

# Copy installed node_modules from the builder stage
COPY --from=builder /app/node_modules ./node_modules
# Copy package.json for metadata
COPY apps/backend/package.json ./package.json

# Copy built application code
COPY --from=builder /app/apps/backend/dist ./dist

# Generate runtime tsconfig.json for alias mapping
RUN echo '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["dist/*"]}}}' > tsconfig.json

ARG PORT=8080
ENV PORT=${PORT}
EXPOSE ${PORT}

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:${PORT}/api/health || exit 1

CMD ["node", "-r", "tsconfig-paths/register", "dist/index.js"]