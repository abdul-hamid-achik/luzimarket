# syntax=docker/dockerfile:1.3

# Stage 1: deps - install frontend dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# Copy root and frontend workspace manifests
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
# Install only the frontend workspace dependencies
RUN npm ci --workspace=apps/frontend --ignore-scripts

# Stage 2: runner - development runtime
FROM node:22-alpine AS runner
# Set working directory and copy code/modules
WORKDIR /app/apps/frontend
COPY --from=deps /app/node_modules ./node_modules
COPY apps/frontend/ ./
EXPOSE 5173
CMD ["npm","run","dev","--host","0.0.0.0"] 