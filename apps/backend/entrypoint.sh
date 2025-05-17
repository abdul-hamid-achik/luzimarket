#!/bin/sh

if [ -z "$STRAPI_API_TOKEN" ] && [ -n "$STRAPI_API_TOKEN_FILE" ]; then
  while [ ! -f "$STRAPI_API_TOKEN_FILE" ]; do
    echo "Waiting for Strapi API token..."
    sleep 2
  done

  export STRAPI_API_TOKEN=$(cat "$STRAPI_API_TOKEN_FILE")
fi

# Execute the main command
exec "$@" 