# Stage 1: install deps for the frontend workspace
FROM node:22-alpine AS deps
WORKDIR /app
# copy root manifests
COPY package.json package-lock.json ./
# copy frontend workspace manifest for dependency resolution
COPY apps/frontend/package.json ./apps/frontend/package.json
# install only the frontend workspace (including dev deps)
RUN npm ci --workspace=apps/frontend

# Stage 2: runtime
FROM node:22-alpine AS runner
WORKDIR /app
# copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
# copy frontend source
COPY apps/frontend/ ./
# healthcheck for Vite dev server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:5173 || exit 1
# expose port
EXPOSE 5173
# start dev server
CMD ["npm","run","dev","--","--host","0.0.0.0"] 