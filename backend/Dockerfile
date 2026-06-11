FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY backend backend
RUN pnpm --filter backend prisma generate
RUN pnpm --filter backend build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN ["apk", "add", "--no-cache", "openssl"]
RUN ["apk", "upgrade", "--no-cache", "openssl", "libssl3", "libcrypto3"]
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json backend/package.json
RUN pnpm install --frozen-lockfile --prod --filter backend
COPY --from=build /app/backend/dist backend/dist
COPY --from=build /app/backend/prisma backend/prisma
COPY --from=build /app/backend/docker-entrypoint.sh backend/docker-entrypoint.sh
COPY --from=build /app/node_modules/.pnpm node_modules/.pnpm
COPY --from=build /app/node_modules/.modules.yaml node_modules/.modules.yaml
COPY --from=build /app/backend/node_modules backend/node_modules
RUN ["rm", "-rf", "/root/.cache/node/corepack", "/usr/local/lib/node_modules/npm", "/usr/local/lib/node_modules/corepack", "/usr/local/bin/npm", "/usr/local/bin/npx", "/usr/local/bin/corepack", "/usr/local/bin/pnpm", "/usr/local/bin/pnpx"]
RUN ["chmod", "+x", "backend/docker-entrypoint.sh"]
EXPOSE 4000
ENTRYPOINT ["backend/docker-entrypoint.sh"]
CMD ["node", "backend/dist/index.js"]
