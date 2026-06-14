#!/bin/sh
set -e

node backend/node_modules/prisma/build/index.js migrate deploy --schema backend/prisma/schema.prisma

exec "$@"
