# Stage 1: build the backend workspace
FROM node:22-alpine AS builder
WORKDIR /app
# skip postinstall and other lifecycle scripts (e.g. playwright install)
ENV NPM_CONFIG_IGNORE_SCRIPTS=true

# copy monorepo manifests and backend package
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./
COPY apps/backend/package.json apps/backend/package.json

# copy backend source code
COPY apps/backend/ apps/backend/

# install only the backend workspace and build (skip lifecycle scripts)
RUN npm ci --workspace=ecommerce-backend --ignore-scripts
# compile TypeScript using explicit project path so tsconfig.base.json is found
RUN npx tsc -p apps/backend/tsconfig.json

# Stage 2: production runner
FROM node:22-alpine
WORKDIR /app

# copy built output and node_modules
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# healthcheck for backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1

EXPOSE 5000
CMD ["npm", "start"]