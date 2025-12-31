#!/bin/sh
set -e

echo "Waiting for Postgres..."
until pg_isready -d "$DATABASE_URL" >/dev/null 2>&1; do
  sleep 1
done

echo "Running Better Auth migrations..."
corepack enable
corepack pnpm exec better-auth migrate --config src/lib/auth.ts --yes

echo "Starting app..."
ls -la build || true
exec node build/index.js

