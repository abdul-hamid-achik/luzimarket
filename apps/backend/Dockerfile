# Stage 1: install deps for the backend workspace
FROM node:22-alpine AS deps
WORKDIR /app
# copy root manifests
COPY package.json package-lock.json ./
# copy backend workspace manifest for dependency resolution
COPY apps/backend/package.json ./apps/backend/package.json
# install only the backend workspace, omit dev dependencies and skip scripts
RUN npm ci --workspace=apps/backend --omit=dev --ignore-scripts

# Stage 2: build the backend
FROM node:22-alpine AS build
WORKDIR /app
# bring in installed modules
COPY --from=deps /app/node_modules ./node_modules
# copy backend source
COPY apps/backend/ ./
# compile TS to JS
RUN npm run build

# Stage 3: production runner
FROM node:22-alpine AS runner
WORKDIR /app
# copy built output and modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/node_modules ./node_modules
# healthcheck for backend
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:5000/health || exit 1
EXPOSE 5000
CMD ["npm", "start"]