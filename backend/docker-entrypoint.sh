#!/bin/sh
set -e
node backend/node_modules/.bin/prisma migrate deploy --schema=prisma/schema.prisma
exec "$@"
