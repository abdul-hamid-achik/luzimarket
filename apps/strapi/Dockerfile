# Use an official lightweight Node.js image
FROM node:22-alpine

# Create app directory
WORKDIR /srv/app

# Copy dependencies definitions
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install
RUN npm rebuild esbuild
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