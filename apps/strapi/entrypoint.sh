#!/bin/sh
set -e

echo "Refreshing node_modules from cache..."
rm -rf /srv/app/node_modules/*
cp -r /node_modules_cache/. /srv/app/node_modules

# Run the original command
exec "$@" 