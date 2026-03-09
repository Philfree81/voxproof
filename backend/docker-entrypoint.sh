#!/bin/sh
set -e

echo "[entrypoint] Running Prisma migrations..."
npx prisma migrate deploy --schema=src/prisma/schema.prisma

echo "[entrypoint] Starting backend..."
exec node dist/index.js
