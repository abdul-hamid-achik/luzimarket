#!/bin/sh
# Wrapper to launch Strapi and capture the bootstrap token
npm run develop &
PID=$!
# Wait for Strapi to be ready
until wget --no-verbose --tries=1 --spider http://localhost:1337/admin/login; do
  echo "Waiting for Strapi..."
  sleep 5
done
# Check for existing token file
if [ ! -f /strapi/.token ]; then
  echo "No token found, waiting for bootstrap to generate one..."
  while [ ! -f /strapi/.token ]; do
    sleep 2
  done
fi
export STRAPI_API_TOKEN=$(cat /strapi/.token)
# Keep container running
wait $PID 