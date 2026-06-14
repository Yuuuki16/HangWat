FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY front/package.json front/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY backend backend
RUN pnpm --filter backend prisma generate
RUN pnpm --filter backend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN ["apk", "add", "--no-cache", "openssl"]
RUN ["apk", "upgrade", "--no-cache", "openssl", "libssl3", "libcrypto3"]
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
COPY front/package.json front/package.json
COPY backend/prisma backend/prisma
RUN pnpm install --frozen-lockfile --prod --filter backend
RUN pnpm --filter backend prisma generate
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/docker-entrypoint.sh backend/docker-entrypoint.sh
RUN ["rm", "-rf", "/root/.cache/node/corepack", "/usr/local/lib/node_modules/npm", "/usr/local/lib/node_modules/corepack", "/usr/local/bin/npm", "/usr/local/bin/npx", "/usr/local/bin/corepack", "/usr/local/bin/pnpm", "/usr/local/bin/pnpx"]
RUN ["chmod", "+x", "backend/docker-entrypoint.sh"]
RUN ["chown", "-R", "appuser:appgroup", "/app"]
USER appuser
EXPOSE 8080
ENTRYPOINT ["backend/docker-entrypoint.sh"]
CMD ["node", "backend/dist/index.js"]
