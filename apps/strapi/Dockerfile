# syntax=docker/dockerfile:1.3

# Stage 1: deps - install dependencies
FROM node:22-alpine AS deps
# Installing libvips-dev for sharp compatibility and build tools
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git

ARG NODE_ENV=development
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/app
# Copy only strapi app manifest files
COPY apps/strapi/package.json apps/strapi/package-lock.json ./
# Install dependencies into /opt/app/node_modules
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install

# Copy Strapi app source
COPY apps/strapi ./

# Stage 2: runner - final runtime image
FROM node:22-alpine AS runner
# Install runtime dependencies
RUN apk add --no-cache postgresql-client vips-dev wget

WORKDIR /opt/app
# Copy over dependencies and source from deps stage
COPY --from=deps /opt/app/node_modules ./node_modules
COPY --from=deps /opt/app ./

# Ensure correct permissions and non-root user
RUN chown -R node:node /opt/app
USER node

# Expose the Strapi port and run the wrapper
EXPOSE 1337
CMD ["npm", "run", "develop"]