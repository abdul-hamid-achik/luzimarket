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

# Copy package.json to install production dependencies
COPY apps/backend/package.json ./package.json

# Install all production dependencies needed by backend
RUN npm init -y && \
    npm install --no-save \
    json5 tsconfig-paths express cors dotenv \
    bcrypt body-parser drizzle-orm http-status-codes jsonwebtoken \
    pg postgres serverless-http stripe swagger-jsdoc swagger-ui-express \
    ws zod @neondatabase/serverless

# Copy built application code
COPY --from=builder /app/apps/backend/dist ./dist

# Generate runtime tsconfig.json for alias mapping
RUN echo '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["dist/*"]}}}' > tsconfig.json

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:5000/health || exit 1

CMD ["node", "-r", "tsconfig-paths/register", "dist/index.js"]