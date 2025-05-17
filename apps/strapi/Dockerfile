# syntax=docker/dockerfile:1.3

# Stage 1: deps - install all workspace dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# Copy only the root manifest and the Strapi workspace manifest
COPY package.json package-lock.json ./
COPY apps/strapi/package.json apps/strapi/package.json
# Install only the Strapi workspace dependencies
RUN npm ci --workspace=apps/strapi

# Stage 2: runner - final Strapi runtime
FROM node:22-alpine AS runner
# Install runtime dependencies
RUN apk add --no-cache postgresql-client
# Copy only Strapi node_modules from deps into parent dir
COPY --from=deps /app/node_modules /srv/app/node_modules
# Also populate workspace-specific node_modules so bind mounts don't overwrite deps
COPY --from=deps /app/node_modules /srv/app/apps/strapi/node_modules
# Copy Strapi source into subdirectory
COPY apps/strapi/ /srv/app/apps/strapi
# Install entrypoint
COPY apps/strapi/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh
# Set working directory into Strapi workspace
WORKDIR /srv/app/apps/strapi
# Expose and run
EXPOSE 1337
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm","run","develop"] 