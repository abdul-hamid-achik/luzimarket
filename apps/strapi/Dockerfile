# Use an official lightweight Node.js image
FROM node:22-alpine

# Install PostgreSQL client tools for database interaction
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /srv/app

# Copy dependencies definitions
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm uninstall esbuild
RUN npm install esbuild@0.21.5 --save-exact
RUN mkdir -p /node_modules_cache && cp -r node_modules/. /node_modules_cache

# Copy the rest of the app files
COPY . ./
COPY entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Expose Strapi default port
EXPOSE 1337

# Start Strapi in development mode
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["npm", "run", "develop"] 