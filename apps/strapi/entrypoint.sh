#!/bin/sh
set -e

# If the mounted node_modules directory is empty, populate from cache
if [ -z "$(ls -A /srv/app/node_modules)" ]; then
  echo "Initializing node_modules volume from cache..."
  cp -r /node_modules_cache/. /srv/app/node_modules
fi

# Run the original command
exec "$@" 