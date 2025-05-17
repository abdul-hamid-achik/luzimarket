# syntax=docker/dockerfile:1.3

# Stage 1: deps - install all dependencies
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/strapi/package.json apps/strapi/package.json
RUN npm ci --ignore-scripts

# Stage 2: builder - compile the backend
FROM deps AS builder
WORKDIR /app/apps/backend
COPY apps/backend/ ./
RUN npm run build

# Stage 3: runner - production runtime
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache curl
COPY --from=deps /app/node_modules ./node_modules
COPY apps/backend/package.json ./package.json
COPY --from=builder /app/apps/backend/dist ./dist
# Generate runtime tsconfig for path aliases
RUN echo '{"compilerOptions":{"baseUrl":".","paths":{"@/*":["dist/*"]}}}' > tsconfig.json
ARG PORT=8000
ENV PORT=${PORT}
EXPOSE ${PORT}
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl --fail http://localhost:${PORT}/api/health || exit 1
CMD ["node","-r","tsconfig-paths/register","dist/index.js"]