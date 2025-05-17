# syntax=docker/dockerfile:1.3

# Stage 1: deps - install dependencies
FROM node:22-alpine AS deps
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git
ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/app
# Copy root package files for workspace resolution
COPY package.json package-lock.json ./
COPY apps/strapi/package.json ./
# Install dependencies
RUN npm install
ENV PATH=/opt/app/node_modules/.bin:$PATH

# Stage 2: runner - final runtime
FROM node:22-alpine AS runner
RUN apk add --no-cache postgresql-client vips-dev wget
WORKDIR /opt/app
# Copy deps and source
COPY --from=deps /opt/app/node_modules ./node_modules
COPY apps/strapi/ ./
# Set permissions
RUN chown -R node:node /opt/app
USER node
# Expose and run
EXPOSE 1337
CMD ["npm", "run", "develop"] 