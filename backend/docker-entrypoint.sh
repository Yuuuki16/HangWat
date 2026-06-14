#!/bin/sh
set -e

if [ "${SKIP_MIGRATE:-false}" != "true" ]; then
  node backend/node_modules/prisma/build/index.js migrate deploy --schema backend/prisma/schema.prisma
fi

exec "$@"
