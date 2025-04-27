# Stage 1: install deps for the frontend workspace
FROM node:22-alpine AS builder
WORKDIR /app

# skip lifecycle scripts (postinstall, etc)
ENV NPM_CONFIG_IGNORE_SCRIPTS=true

# copy monorepo manifests and workspace manifest
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json

# install only the frontend workspace
RUN npm ci --workspace=apps/frontend --ignore-scripts

# Stage 2: dev runtime
FROM node:22-alpine
WORKDIR /app

# copy node_modules from builder stage
COPY --from=builder /app/node_modules ./node_modules

# copy source code
COPY apps/frontend/ ./

# healthcheck for Vite dev server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5173 || exit 1

EXPOSE 5173
CMD ["npm","run","dev","--","--host","0.0.0.0"] 