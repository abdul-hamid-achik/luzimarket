#!/usr/bin/env sh
set -e

# Run database migrations
echo "Running database migrations..."
npm run migrate:up
echo "Database migrations completed"

echo "Seeding database..."
npm run seed
echo "Database seeded successfully"

# Execute the main container command
exec "$@" 