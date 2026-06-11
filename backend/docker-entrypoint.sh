#!/bin/sh
set -e

pnpm --filter backend prisma migrate deploy

exec "$@"
